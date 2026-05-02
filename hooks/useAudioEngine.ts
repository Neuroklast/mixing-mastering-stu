'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { StereoFieldAnalyzer } from '@/lib/StereoFieldAnalyzer'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AudioTrack {
  label: 'before' | 'after'
  url: string
}

export type PlayerStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'switching' | 'error'

const CORR_ALPHA = 0.15 // EMA smoothing factor for correlation display (main thread)

export interface AudioEngineState {
  status: PlayerStatus
  /** @deprecated use `status` instead; will be removed in a future release */
  isPlaying: boolean
  activeTrack: 'before' | 'after'
  currentTime: number
  duration: number
  /** Integrated LUFS for the master (after) track */
  lufsIntegrated: number | null
  /** Integrated LUFS for the mix (before) track */
  lufsIntegratedBefore: number | null
  lufsShortTerm: number | null
  frequencyData: Uint8Array | null
  errorMessage: string | null
  /** Per-track AnalyserNodes for A/B spectrum comparison (null until audio graph is initialised) */
  analyserBefore: AnalyserNode | null
  analyserAfter: AnalyserNode | null
  /** Phase correlation per frequency band (null until playback starts) */
  multibandCorrelation: { low: number; mid: number; high: number } | null
}

interface AudioEngineTracks {
  before: AudioTrack
  after: AudioTrack
}

interface AudioEngineOptions {
  startMarker?: number
}

type AudioEngineControls = {
  play: () => Promise<void>
  pause: () => void
  seek: (time: number) => void
  switchTrack: (track: 'before' | 'after') => void
}

let sharedAudioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioContext()
  }
  return sharedAudioContext
}

// ─── LUFS helpers ─────────────────────────────────────────────────────────────

// ITU-R BS.1770-4 reference offset for LUFS calculation
const LUFS_REFERENCE_OFFSET = -0.691

export function computeIntegratedLufs(samples: Float32Array): number {
  let sum = 0
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i]
  const meanSquare = sum / samples.length
  if (meanSquare === 0) return -Infinity
  return LUFS_REFERENCE_OFFSET + 10 * Math.log10(meanSquare)
}

function computeShortTermLufsFromFreqData(data: Uint8Array): number {
  let sum = 0
  for (let i = 0; i < data.length; i++) {
    const n = data[i] / 255
    sum += n * n
  }
  const meanSquare = sum / data.length
  if (meanSquare === 0) return -Infinity
  return LUFS_REFERENCE_OFFSET + 10 * Math.log10(meanSquare)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAudioEngine(
  tracks: AudioEngineTracks,
  options: AudioEngineOptions = {},
): AudioEngineState & AudioEngineControls {
  const { startMarker = 0 } = options

  // ── State (React-visible) ──
  const [status, setStatus] = useState<PlayerStatus>('idle')
  const [activeTrack, setActiveTrack] = useState<'before' | 'after'>('before')
  const [currentTime, setCurrentTime] = useState(startMarker)
  const [duration, setDuration] = useState(0)
  const [lufsIntegrated, setLufsIntegrated] = useState<number | null>(null)
  const [lufsIntegratedBefore, setLufsIntegratedBefore] = useState<number | null>(null)
  const [lufsShortTerm, setLufsShortTerm] = useState<number | null>(null)
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [analyserBefore, setAnalyserBefore] = useState<AnalyserNode | null>(null)
  const [analyserAfter, setAnalyserAfter] = useState<AnalyserNode | null>(null)
  const [multibandCorrelation, setMultibandCorrelation] = useState<{ low: number; mid: number; high: number } | null>(null)

  // ── Refs (audio graph) ──
  const analyserRef = useRef<AnalyserNode | null>(null)
  const analyserBeforeRef = useRef<AnalyserNode | null>(null)
  const analyserAfterRef = useRef<AnalyserNode | null>(null)
  const gainNodesRef = useRef<Record<'before' | 'after', GainNode> | null>(null)
  const sourceNodesRef = useRef<Map<HTMLAudioElement, MediaElementAudioSourceNode>>(new Map())
  const audioElementsRef = useRef<Record<'before' | 'after', HTMLAudioElement> | null>(null)
  const activeTrackRef = useRef<'before' | 'after'>('before')
  const statusRef = useRef<PlayerStatus>('idle')
  const rafIdRef = useRef<number | undefined>(undefined)
  const sfaRef = useRef<Partial<Record<'before' | 'after', StereoFieldAnalyzer>>>({})
  const corrSmoothRef = useRef({
    before: { low: 0, mid: 0, high: 0 },
    after:  { low: 0, mid: 0, high: 0 },
  })
  // Counts how many audio elements have fired loadedmetadata for the current load cycle
  const metadataLoadedRef = useRef(0)
  // Becomes true after the first render so the URL-change effect skips only that one render
  const hasMountedRef = useRef(false)
  /**
   * Monotonically increasing generation counter.
   * Incremented on every new load cycle (mount + each URL change).
   * Each loadedmetadata callback captures the current generation at scheduling
   * time and ignores the call if the generation has since changed.  This
   * prevents stale callbacks from older (possibly already-disposed) load
   * cycles from corrupting the state machine – especially important when the
   * user skips tracks rapidly.
   */
  const loadGenerationRef = useRef(0)

  // Helper: keep statusRef in sync
  const updateStatus = useCallback((s: PlayerStatus) => {
    statusRef.current = s
    setStatus(s)
  }, [])

  // ── Audio graph setup ──
  const getOrCreateGraph = useCallback(() => {
    const ctx = getAudioContext()
    const isMobileDevice = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (!analyserRef.current) {
      const analyser = ctx.createAnalyser()
      analyser.fftSize = isMobileDevice ? 512 : 2048
      analyser.smoothingTimeConstant = 0.8
      analyser.connect(ctx.destination)
      analyserRef.current = analyser
    }
    if (!gainNodesRef.current) {
      const gainBefore = ctx.createGain()
      const gainAfter = ctx.createGain()
      gainBefore.connect(analyserRef.current)
      gainAfter.connect(analyserRef.current)
      gainNodesRef.current = { before: gainBefore, after: gainAfter }
    }
    // Per-track analysers for A/B spectrum comparison.
    // These are connected directly from the MediaElementSource (pre-gain) in
    // connectAudioElement so they always carry the raw signal regardless of
    // the crossfade state.  This is required for a correct delta curve and for
    // the inactive-track background curve to update live.
    if (!analyserBeforeRef.current) {
      const ab = ctx.createAnalyser()
      ab.fftSize = isMobileDevice ? 512 : 4096
      ab.smoothingTimeConstant = 0.8
      analyserBeforeRef.current = ab
      setAnalyserBefore(ab)
    }
    if (!analyserAfterRef.current) {
      const aa = ctx.createAnalyser()
      aa.fftSize = isMobileDevice ? 512 : 4096
      aa.smoothingTimeConstant = 0.8
      analyserAfterRef.current = aa
      setAnalyserAfter(aa)
    }
    return { ctx, analyser: analyserRef.current, gains: gainNodesRef.current }
  }, [])

  const connectAudioElement = useCallback(
    (audio: HTMLAudioElement, track: 'before' | 'after'): void => {
      const { ctx, gains } = getOrCreateGraph()

      // Get or create the MediaElementAudioSourceNode.
      // Each HTMLAudioElement can only be wrapped once — reuse the existing node
      // on subsequent calls (e.g. after a song-URL change that reuses the same elements).
      let source = sourceNodesRef.current.get(audio)
      if (!source) {
        source = ctx.createMediaElementSource(audio)
        source.connect(gains[track])
        // Connect per-track analyser directly from source, bypassing the gain
        // node so the spectrum is visible regardless of crossfade gain.
        const analyserPerTrack = track === 'before' ? analyserBeforeRef.current : analyserAfterRef.current
        if (analyserPerTrack) source.connect(analyserPerTrack)
        sourceNodesRef.current.set(audio, source)
      }

      // ── Multiband correlation (StereoFieldAnalyzer) ──────────────────────────
      // This check is intentionally separate from the source-node guard above:
      // after a song change, sfaRef is cleared but the source node may already
      // exist.  We must re-attach the SFA whenever it is missing, regardless of
      // whether we just created the source node.
      if (!sfaRef.current[track]) {
        const sfa = new StereoFieldAnalyzer(ctx)
        sfaRef.current[track] = sfa
        void sfa.attach(source, (corr) => {
          // Ignore results from the inactive track
          if (activeTrackRef.current !== track) return
          const s = corrSmoothRef.current[track]
          s.low  = s.low  * (1 - CORR_ALPHA) + corr.low  * CORR_ALPHA
          s.mid  = s.mid  * (1 - CORR_ALPHA) + corr.mid  * CORR_ALPHA
          s.high = s.high * (1 - CORR_ALPHA) + corr.high * CORR_ALPHA
          setMultibandCorrelation({ low: s.low, mid: s.mid, high: s.high })
        }).catch(console.error)
      }
    },
    [getOrCreateGraph],
  )

  // ── RAF loop ──
  const stopRaf = useCallback(() => {
    if (rafIdRef.current !== undefined) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = undefined
    }
  }, [])

  const startRaf = useCallback(() => {
    stopRaf()
    const analyser = analyserRef.current
    if (!analyser) return
    const data = new Uint8Array(analyser.frequencyBinCount)
    const tick = (): void => {
      analyser.getByteFrequencyData(data)
      setFrequencyData(new Uint8Array(data))
      const stLufs = computeShortTermLufsFromFreqData(data)
      setLufsShortTerm(isFinite(stLufs) ? stLufs : null)

      rafIdRef.current = requestAnimationFrame(tick)
    }
    rafIdRef.current = requestAnimationFrame(tick)
  }, [stopRaf])

  // ── Crossfade helper (5 ms linear ramp) ──
  const crossfade = useCallback(
    (from: 'before' | 'after', to: 'before' | 'after'): void => {
      const gains = gainNodesRef.current
      if (!gains) return
      const ctx = getAudioContext()
      const now = ctx.currentTime
      const FADE = 0.005 // 5 ms

      const fromGain = gains[from]
      const toGain = gains[to]

      fromGain.gain.setValueAtTime(fromGain.gain.value, now)
      fromGain.gain.linearRampToValueAtTime(0, now + FADE)

      toGain.gain.cancelScheduledValues(now)
      toGain.gain.setValueAtTime(0, now)
      toGain.gain.linearRampToValueAtTime(1, now + FADE)
    },
    [],
  )

  // ── Mount effect ──
  useEffect(() => {
    if (typeof window === 'undefined') return

    updateStatus('loading')
    metadataLoadedRef.current = 0
    // Assign the initial generation for this load cycle
    loadGenerationRef.current++
    const generation = loadGenerationRef.current

    const elements: Record<'before' | 'after', HTMLAudioElement> = {
      before: new Audio(tracks.before.url),
      after: new Audio(tracks.after.url),
    }
    elements.before.preload = 'metadata'
    elements.after.preload = 'metadata'

    audioElementsRef.current = elements
    sourceNodesRef.current = new Map()

    const onMetadata = (v: 'before' | 'after') => () => {
      // Ignore stale callbacks from a previous load cycle
      if (loadGenerationRef.current !== generation) return
      if (v === 'before') setDuration(elements[v].duration)
      metadataLoadedRef.current++
      if (metadataLoadedRef.current >= 2) updateStatus('ready')
    }

    const onTimeUpdate = (v: 'before' | 'after') => () => {
      if (v === activeTrackRef.current) setCurrentTime(elements[v].currentTime)
    }

    const onEnded = (v: 'before' | 'after') => (): void => {
      // Only the active track ending should trigger a state transition; ignore
      // the inactive track's ended event to avoid duplicate transitions.
      if (v !== activeTrackRef.current) return
      elements['before'].pause()
      elements['after'].pause()
      updateStatus('paused')
      stopRaf()
      setFrequencyData(null)
      setLufsShortTerm(null)
    }

    const onError = (v: 'before' | 'after') => () => {
      console.error(`Audio element error for track: ${v}`)
      updateStatus('error')
      setErrorMessage(`Failed to load ${v} audio file. Check the URL is accessible.`)
    }

    const metadataCbs = {
      before: onMetadata('before'),
      after: onMetadata('after'),
    }
    const timeUpdateCbs = {
      before: onTimeUpdate('before'),
      after: onTimeUpdate('after'),
    }
    const endedCbs = {
      before: onEnded('before'),
      after: onEnded('after'),
    }
    const errorCbs = {
      before: onError('before'),
      after: onError('after'),
    }

    ;(['before', 'after'] as const).forEach((v) => {
      elements[v].addEventListener('loadedmetadata', metadataCbs[v])
      elements[v].addEventListener('timeupdate', timeUpdateCbs[v])
      elements[v].addEventListener('ended', endedCbs[v])
      elements[v].addEventListener('error', errorCbs[v])
    })

    // Jump to startMarker on first load (add BEFORE loading the audio)
    if (startMarker > 0) {
      ;(['before', 'after'] as const).forEach((v) => {
        const seekOnce = (): void => {
          elements[v].currentTime = startMarker
          elements[v].removeEventListener('loadedmetadata', seekOnce)
        }
        elements[v].addEventListener('loadedmetadata', seekOnce)
      })
    }

    return () => {
      ;(['before', 'after'] as const).forEach((v) => {
        elements[v].removeEventListener('loadedmetadata', metadataCbs[v])
        elements[v].removeEventListener('timeupdate', timeUpdateCbs[v])
        elements[v].removeEventListener('ended', endedCbs[v])
        elements[v].removeEventListener('error', errorCbs[v])
        elements[v].pause()
        elements[v].src = ''
      })
      stopRaf()
      // Detach correlation callbacks (analysis nodes stay alive with the singleton context)
      sfaRef.current.before?.dispose()
      sfaRef.current.after?.dispose()
      // Do NOT close the shared AudioContext here (singleton)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Background track switching: reload audio when URLs change without remount ──
  useEffect(() => {
    // Skip on initial render — the mount effect above handles first load
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    const elements = audioElementsRef.current
    if (!elements) return

    // Pause and stop any running animation
    elements.before.pause()
    elements.after.pause()
    stopRaf()
    setFrequencyData(null)
    setLufsShortTerm(null)
    setMultibandCorrelation(null)
    setLufsIntegrated(null)
    setLufsIntegratedBefore(null)

    // Reset playback state
    updateStatus('loading')
    metadataLoadedRef.current = 0
    activeTrackRef.current = 'before'
    setActiveTrack('before')
    setCurrentTime(startMarker)

    // Increment generation so stale loadedmetadata callbacks from the previous
    // cycle (including any still-live mount-effect listeners) are ignored.
    loadGenerationRef.current++
    const generation = loadGenerationRef.current

    // Dispose old StereoFieldAnalyzers (new audio elements will trigger re-attach)
    sfaRef.current.before?.dispose()
    sfaRef.current.after?.dispose()
    sfaRef.current = {}

    // Reset correlation smoothing accumulators so the previous song's phase
    // values don't bleed into the first frames of the new song.
    corrSmoothRef.current = {
      before: { low: 0, mid: 0, high: 0 },
      after:  { low: 0, mid: 0, high: 0 },
    }

    const onMetadata = (v: 'before' | 'after') => (): void => {
      // Ignore stale callbacks from a previous generation
      if (loadGenerationRef.current !== generation) return
      if (v === 'before') setDuration(elements[v].duration)
      metadataLoadedRef.current++
      if (metadataLoadedRef.current >= 2) updateStatus('ready')
    }

    const beforeCb = onMetadata('before')
    const afterCb  = onMetadata('after')

    // Add one-shot listeners BEFORE calling .load() to avoid missing
    // the event when the browser serves the file from cache.
    elements.before.addEventListener('loadedmetadata', beforeCb, { once: true })
    elements.after.addEventListener('loadedmetadata', afterCb, { once: true })

    // Update URLs on existing audio elements (MediaElementAudioSourceNode stays connected)
    elements.before.src = tracks.before.url
    elements.after.src  = tracks.after.url
    elements.before.preload = 'metadata'
    elements.after.preload  = 'metadata'
    elements.before.load()
    elements.after.load()

    if (startMarker > 0) {
      ;(['before', 'after'] as const).forEach((v) => {
        const seekOnce = (): void => {
          elements[v].currentTime = startMarker
          elements[v].removeEventListener('loadedmetadata', seekOnce)
        }
        elements[v].addEventListener('loadedmetadata', seekOnce)
      })
    }

    return () => {
      // Remove listeners if they haven't fired yet (e.g. rapid skip before load completes)
      elements.before.removeEventListener('loadedmetadata', beforeCb)
      elements.after.removeEventListener('loadedmetadata', afterCb)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks.before.url, tracks.after.url])

  // ── LUFS integrated (background computation on URL change) ──
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Abort any in-flight fetch from a previous URL combination
    const abortCtrl = new AbortController()
    const { signal } = abortCtrl

    const computeTrack = async (
      url: string,
      setter: (v: number | null) => void,
    ): Promise<void> => {
      try {
        const ctx = new AudioContext()
        const resp = await fetch(url, { signal })
        const ab = await resp.arrayBuffer()
        if (signal.aborted) { await ctx.close(); return }
        const decoded = await ctx.decodeAudioData(ab)
        const lufs = computeIntegratedLufs(decoded.getChannelData(0))
        setter(isFinite(lufs) ? lufs : null)
        await ctx.close()
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        // silently ignore other errors (network, decode)
      }
    }

    void computeTrack(tracks.after.url, setLufsIntegrated)
    void computeTrack(tracks.before.url, setLufsIntegratedBefore)

    return () => { abortCtrl.abort() }
  }, [tracks.after.url, tracks.before.url])

  // ── One-time user-gesture listener to resume suspended AudioContext (Safari/iOS) ──
  useEffect(() => {
    if (typeof document === 'undefined') return
    const resume = (): void => {
      if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
        void sharedAudioContext.resume()
      }
      document.removeEventListener('click', resume)
      document.removeEventListener('touchstart', resume)
    }
    document.addEventListener('click', resume)
    document.addEventListener('touchstart', resume)
    return () => {
      document.removeEventListener('click', resume)
      document.removeEventListener('touchstart', resume)
    }
  }, [])

  // ── Auto-suspend when page goes hidden ──
  useEffect(() => {
    if (typeof document === 'undefined') return
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'hidden') {
        if (statusRef.current === 'playing') {
          audioElementsRef.current?.['before']?.pause()
          audioElementsRef.current?.['after']?.pause()
          stopRaf()
          updateStatus('paused')
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [stopRaf, updateStatus])

  // ── Controls ──
  const play = useCallback(async (): Promise<void> => {
    if (!audioElementsRef.current) return
    if (statusRef.current === 'loading') return
    const active = activeTrackRef.current
    const inactive: 'before' | 'after' = active === 'before' ? 'after' : 'before'
    const activeAudio = audioElementsRef.current[active]
    const inactiveAudio = audioElementsRef.current[inactive]

    // Connect both elements to the audio graph (no-op if already connected)
    connectAudioElement(activeAudio, active)
    connectAudioElement(inactiveAudio, inactive)

    const { ctx, gains } = getOrCreateGraph()
    if (ctx.state === 'suspended') await ctx.resume()

    // Active track is heard; inactive track is silent but must keep running so
    // its per-track analyser (connected pre-gain) produces live spectrum data.
    gains[active].gain.value = 1
    gains[inactive].gain.value = 0

    // Sync inactive to the same playback position as the active track
    inactiveAudio.currentTime = activeAudio.currentTime

    await activeAudio.play()
    // Inactive play errors are non-fatal (background visualisation only)
    void inactiveAudio.play().catch(() => undefined)

    startRaf()
    updateStatus('playing')
  }, [connectAudioElement, getOrCreateGraph, startRaf, updateStatus])

  const pause = useCallback((): void => {
    if (!audioElementsRef.current) return
    audioElementsRef.current['before'].pause()
    audioElementsRef.current['after'].pause()
    stopRaf()
    updateStatus('paused')
    setFrequencyData(null)
    setLufsShortTerm(null)
  }, [stopRaf, updateStatus])

  const seek = useCallback((time: number): void => {
    if (!audioElementsRef.current) return
    audioElementsRef.current['before'].currentTime = time
    audioElementsRef.current['after'].currentTime = time
    setCurrentTime(time)
  }, [])

  const switchTrack = useCallback(
    (track: 'before' | 'after'): void => {
      if (!audioElementsRef.current) return
      if (statusRef.current === 'loading') return
      if (activeTrackRef.current === track) {
        // If status got stuck in switching for any reason, correct it
        if (statusRef.current === 'switching') {
          const audio = audioElementsRef.current?.[track]
          updateStatus(audio && !audio.paused ? 'playing' : 'paused')
        }
        return
      }

      const prevTrack = activeTrackRef.current
      const prevAudio = audioElementsRef.current[prevTrack]
      const nextAudio = audioElementsRef.current[track]
      const savedTime = prevAudio.currentTime
      const wasPlaying = statusRef.current === 'playing'

      updateStatus('switching')

      connectAudioElement(nextAudio, track)
      nextAudio.currentTime = savedTime
      activeTrackRef.current = track
      setActiveTrack(track)
      setDuration(nextAudio.duration || 0)
      setCurrentTime(savedTime)

      if (!wasPlaying) {
        updateStatus('paused')
        return
      }

      // Crossfade: ramp out old track, ramp in new track
      crossfade(prevTrack, track)

      const ctx = getAudioContext()
      const startPlay = (): void => {
        void nextAudio.play().then(() => {
          updateStatus('playing')
        })
      }

      if (ctx.state === 'suspended') {
        void ctx.resume().then(startPlay)
      } else {
        startPlay()
      }

      // Both tracks remain playing; prevTrack continues silently (gain = 0)
      // so its per-track analyser keeps producing spectrum data for the
      // background curve overlay.
    },
    [connectAudioElement, crossfade, getOrCreateGraph, updateStatus],
  )

  return {
    status,
    isPlaying: status === 'playing',
    activeTrack,
    currentTime,
    duration,
    lufsIntegrated,
    lufsIntegratedBefore,
    lufsShortTerm,
    frequencyData,
    errorMessage,
    analyserBefore,
    analyserAfter,
    multibandCorrelation,
    play,
    pause,
    seek,
    switchTrack,
  }
}
