'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AudioTrack {
  label: 'before' | 'after'
  url: string
}

export type PlayerStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'switching' | 'error'

export interface AudioEngineState {
  status: PlayerStatus
  /** @deprecated use `status` instead; will be removed in a future release */
  isPlaying: boolean
  activeTrack: 'before' | 'after'
  currentTime: number
  duration: number
  lufsIntegrated: number | null
  lufsShortTerm: number | null
  frequencyData: Uint8Array | null
  errorMessage: string | null
  gainCompensationEnabled: boolean
  /** Per-track AnalyserNodes for A/B spectrum comparison (null until audio graph is initialised) */
  analyserBefore: AnalyserNode | null
  analyserAfter: AnalyserNode | null
}

interface AudioEngineTracks {
  before: AudioTrack
  after: AudioTrack
}

interface AudioEngineOptions {
  startMarker?: number
  gainCompensation?: boolean
}

type AudioEngineControls = {
  play: () => Promise<void>
  pause: () => void
  seek: (time: number) => void
  switchTrack: (track: 'before' | 'after') => void
  toggleGainCompensation: () => void
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
  const [lufsShortTerm, setLufsShortTerm] = useState<number | null>(null)
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [gainCompensationEnabled, setGainCompensationEnabled] = useState(
    options.gainCompensation ?? false,
  )
  const [analyserBefore, setAnalyserBefore] = useState<AnalyserNode | null>(null)
  const [analyserAfter, setAnalyserAfter] = useState<AnalyserNode | null>(null)

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
  const gainMatchRef = useRef<number>(1) // ratio to apply to 'before' when compensation on
  const gainCompRef = useRef<boolean>(options.gainCompensation ?? false) // mirror of gainCompensationEnabled for stale-closure-safe access

  // Helper: keep statusRef in sync
  const updateStatus = useCallback((s: PlayerStatus) => {
    statusRef.current = s
    setStatus(s)
  }, [])

  // ── Audio graph setup ──
  const getOrCreateGraph = useCallback(() => {
    const ctx = getAudioContext()
    const isMobile = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1
    if (!analyserRef.current) {
      const analyser = ctx.createAnalyser()
      analyser.fftSize = isMobile ? 512 : 2048
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
    // the gain-compensation/crossfade state.  This is required for a correct
    // delta curve and for the inactive-track background curve to update live.
    if (!analyserBeforeRef.current) {
      const ab = ctx.createAnalyser()
      ab.fftSize = isMobile ? 512 : 4096
      ab.smoothingTimeConstant = 0.8
      analyserBeforeRef.current = ab
      setAnalyserBefore(ab)
    }
    if (!analyserAfterRef.current) {
      const aa = ctx.createAnalyser()
      aa.fftSize = isMobile ? 512 : 4096
      aa.smoothingTimeConstant = 0.8
      analyserAfterRef.current = aa
      setAnalyserAfter(aa)
    }
    return { ctx, analyser: analyserRef.current, gains: gainNodesRef.current }
  }, [])

  const connectAudioElement = useCallback(
    (audio: HTMLAudioElement, track: 'before' | 'after'): void => {
      if (sourceNodesRef.current.has(audio)) return
      const { ctx, gains } = getOrCreateGraph()
      const source = ctx.createMediaElementSource(audio)
      source.connect(gains[track])
      // Connect per-track analyser directly from source, bypassing the gain
      // node so the spectrum is visible regardless of crossfade/compensation gain.
      const analyserPerTrack = track === 'before' ? analyserBeforeRef.current : analyserAfterRef.current
      if (analyserPerTrack) source.connect(analyserPerTrack)
      sourceNodesRef.current.set(audio, source)
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
    (from: 'before' | 'after', to: 'before' | 'after', toTargetGain: number = 1): void => {
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
      toGain.gain.linearRampToValueAtTime(toTargetGain, now + FADE)
    },
    [],
  )

  // ── Gain compensation calculation ──
  const applyGainCompensation = useCallback(
    async (enabled: boolean): Promise<void> => {
      const gains = gainNodesRef.current
      if (!gains) return

      if (!enabled) {
        gains.before.gain.value = 1
        return
      }

      try {
        const ctx = getAudioContext()
        const [bufA, bufB] = await Promise.all([
          fetch(tracks.before.url)
            .then((r) => r.arrayBuffer())
            .then((ab) => ctx.decodeAudioData(ab)),
          fetch(tracks.after.url)
            .then((r) => r.arrayBuffer())
            .then((ab) => ctx.decodeAudioData(ab)),
        ])
        const rms = (buf: AudioBuffer): number => {
          const ch = buf.getChannelData(0)
          let sum = 0
          for (let i = 0; i < ch.length; i++) sum += ch[i] * ch[i]
          return Math.sqrt(sum / ch.length)
        }
        const ratio = rms(bufB) / (rms(bufA) || 1)
        gainMatchRef.current = ratio
        if (activeTrackRef.current === 'before') {
          gains.before.gain.value = ratio
        }
      } catch {
        // Gain compensation silently unavailable
      }
    },
    [tracks.before.url, tracks.after.url],
  )

  // ── Mount effect ──
  useEffect(() => {
    if (typeof window === 'undefined') return

    updateStatus('loading')

    const elements: Record<'before' | 'after', HTMLAudioElement> = {
      before: new Audio(tracks.before.url),
      after: new Audio(tracks.after.url),
    }
    elements.before.preload = 'metadata'
    elements.after.preload = 'metadata'

    // Jump to startMarker on first load
    if (startMarker > 0) {
      ;(['before', 'after'] as const).forEach((v) => {
        const seekOnce = (): void => {
          elements[v].currentTime = startMarker
          elements[v].removeEventListener('loadedmetadata', seekOnce)
        }
        elements[v].addEventListener('loadedmetadata', seekOnce)
      })
    }

    audioElementsRef.current = elements
    sourceNodesRef.current = new Map()

    let metadataLoaded = 0
    const onMetadata = (v: 'before' | 'after') => () => {
      if (v === 'before') setDuration(elements[v].duration)
      metadataLoaded++
      if (metadataLoaded >= 2) updateStatus('ready')
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

    ;(['before', 'after'] as const).forEach((v) => {
      elements[v].addEventListener('loadedmetadata', onMetadata(v))
      elements[v].addEventListener('timeupdate', onTimeUpdate(v))
      elements[v].addEventListener('ended', onEnded(v))
      elements[v].addEventListener('error', onError(v))
    })

    return () => {
      ;(['before', 'after'] as const).forEach((v) => {
        elements[v].pause()
        elements[v].src = ''
      })
      stopRaf()
      // Do NOT close the shared AudioContext here (singleton)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Pre-compute gain-match ratio on mount (Bug #7A) ──
  useEffect(() => {
    if (typeof window === 'undefined') return
    const prefetchGainRatio = async (): Promise<void> => {
      try {
        const ctx = getAudioContext()
        const [bufA, bufB] = await Promise.all([
          fetch(tracks.before.url)
            .then((r) => r.arrayBuffer())
            .then((ab) => ctx.decodeAudioData(ab)),
          fetch(tracks.after.url)
            .then((r) => r.arrayBuffer())
            .then((ab) => ctx.decodeAudioData(ab)),
        ])
        const rms = (buf: AudioBuffer): number => {
          const ch = buf.getChannelData(0)
          let sum = 0
          for (let i = 0; i < ch.length; i++) sum += ch[i] * ch[i]
          return Math.sqrt(sum / ch.length)
        }
        gainMatchRef.current = rms(bufB) / (rms(bufA) || 1)
      } catch {
        // Silently unavailable
      }
    }
    void prefetchGainRatio()
  }, [tracks.before.url, tracks.after.url])

  // ── LUFS integrated (background computation on mount) ──
  useEffect(() => {
    if (typeof window === 'undefined') return
    const compute = async (): Promise<void> => {
      try {
        const ctx = new AudioContext()
        const resp = await fetch(tracks.after.url)
        const ab = await resp.arrayBuffer()
        const decoded = await ctx.decodeAudioData(ab)
        const lufs = computeIntegratedLufs(decoded.getChannelData(0))
        setLufsIntegrated(isFinite(lufs) ? lufs : null)
        await ctx.close()
      } catch {
        // silently ignore
      }
    }
    void compute()
  }, [tracks.after.url])

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
    const targetGain =
      active === 'before' && gainCompRef.current
        ? gainMatchRef.current
        : 1
    gains[active].gain.value = targetGain
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

      // Compute target gain using ref (safe against stale closures)
      const targetGain = track === 'before' && gainCompRef.current ? gainMatchRef.current : 1

      // Crossfade: ramp out old, ramp in new — with correct target gain for compensation
      crossfade(prevTrack, track, targetGain)

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

  const toggleGainCompensation = useCallback((): void => {
    setGainCompensationEnabled((prev) => {
      const next = !prev
      gainCompRef.current = next
      const gains = gainNodesRef.current
      if (gains) {
        gains.before.gain.value = next ? gainMatchRef.current : 1
      }
      return next
    })
  }, [])

  return {
    status,
    isPlaying: status === 'playing',
    activeTrack,
    currentTime,
    duration,
    lufsIntegrated,
    lufsShortTerm,
    frequencyData,
    errorMessage,
    gainCompensationEnabled,
    analyserBefore,
    analyserAfter,
    play,
    pause,
    seek,
    switchTrack,
    toggleGainCompensation,
  }
}
