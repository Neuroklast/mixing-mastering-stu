'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AudioTrack {
  label: 'before' | 'after'
  url: string
}

export type PlayerStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'switching' | 'error'

// ─── Loudness Penalty Strategy Pattern ───────────────────────────────────────

export const PENALTY_PROFILES = {
  spotify: { label: 'Spotify', targetLufs: -14 },
  youtube: { label: 'YouTube', targetLufs: -14 },
  apple:   { label: 'Apple',   targetLufs: -16 },
  club:    { label: 'Club',    targetLufs: null }, // No penalty – full dynamic range
} as const

export type PlatformKey = keyof typeof PENALTY_PROFILES

// ─── Multiband correlation helpers ───────────────────────────────────────────

interface CorrBandPair {
  analyserL: AnalyserNode
  analyserR: AnalyserNode
  bufL: Float32Array
  bufR: Float32Array
}

interface TrackCorrNodes {
  splitter: ChannelSplitterNode
  low: CorrBandPair
  mid: CorrBandPair
  high: CorrBandPair
}

/** Pearson correlation between two time-domain buffers [-1, +1]. Returns +1 for mono (silent right channel). */
function computeCorr(band: CorrBandPair): number {
  band.analyserL.getFloatTimeDomainData(band.bufL)
  band.analyserR.getFloatTimeDomainData(band.bufR)
  let sumLR = 0, sumLL = 0, sumRR = 0
  const n = band.bufL.length
  for (let i = 0; i < n; i++) {
    const l = band.bufL[i]!
    const r = band.bufR[i]!
    sumLR += l * r
    sumLL += l * l
    sumRR += r * r
  }
  // When right channel is silent (mono source → splitter output[1] = 0), treat as perfect mono
  if (sumRR < 1e-10) return sumLL > 1e-10 ? 1 : 0
  const denom = Math.sqrt(sumLL * sumRR)
  return denom < 1e-10 ? 0 : Math.max(-1, Math.min(1, sumLR / denom))
}

const CORR_ALPHA = 0.15 // EMA smoothing factor for correlation display

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
  /** Currently selected loudness penalty platform */
  activePlatform: PlatformKey | null
  /** Gain reduction in dB applied by the selected platform (-x.x), or null when no platform active */
  penaltyDb: number | null
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
  setPlatform: (key: PlatformKey | null) => void
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
  const [activePlatform, setActivePlatform] = useState<PlatformKey | null>(null)

  // ── Refs (audio graph) ──
  const analyserRef = useRef<AnalyserNode | null>(null)
  const analyserBeforeRef = useRef<AnalyserNode | null>(null)
  const analyserAfterRef = useRef<AnalyserNode | null>(null)
  const gainNodesRef = useRef<Record<'before' | 'after', GainNode> | null>(null)
  const penaltyGainRef = useRef<GainNode | null>(null)
  const sourceNodesRef = useRef<Map<HTMLAudioElement, MediaElementAudioSourceNode>>(new Map())
  const audioElementsRef = useRef<Record<'before' | 'after', HTMLAudioElement> | null>(null)
  const activeTrackRef = useRef<'before' | 'after'>('before')
  const statusRef = useRef<PlayerStatus>('idle')
  const rafIdRef = useRef<number | undefined>(undefined)
  const corrNodesRef = useRef<Partial<Record<'before' | 'after', TrackCorrNodes>>>({})
  const corrSmoothRef = useRef({ low: 0, mid: 0, high: 0 })

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
      // Insert penalty gain node between analyser and destination
      const penaltyGain = ctx.createGain()
      penaltyGain.gain.value = 1
      analyser.connect(penaltyGain)
      penaltyGain.connect(ctx.destination)
      analyserRef.current = analyser
      penaltyGainRef.current = penaltyGain
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
      // node so the spectrum is visible regardless of crossfade gain.
      const analyserPerTrack = track === 'before' ? analyserBeforeRef.current : analyserAfterRef.current
      if (analyserPerTrack) source.connect(analyserPerTrack)

      // ── Multiband correlation nodes (desktop only) ──────────────────────────
      const isMobile = navigator.maxTouchPoints > 1
      if (!isMobile && !corrNodesRef.current[track]) {
        const CORR_FFT = 256
        const splitter = ctx.createChannelSplitter(2)
        source.connect(splitter)

        const makeBand = (type: BiquadFilterType, freq: number, q: number): CorrBandPair => {
          const filterL = ctx.createBiquadFilter()
          filterL.type = type; filterL.frequency.value = freq; filterL.Q.value = q
          const filterR = ctx.createBiquadFilter()
          filterR.type = type; filterR.frequency.value = freq; filterR.Q.value = q
          splitter.connect(filterL, 0)
          splitter.connect(filterR, 1)
          const analyserL = ctx.createAnalyser(); analyserL.fftSize = CORR_FFT
          const analyserR = ctx.createAnalyser(); analyserR.fftSize = CORR_FFT
          filterL.connect(analyserL); filterR.connect(analyserR)
          return {
            analyserL, analyserR,
            bufL: new Float32Array(CORR_FFT),
            bufR: new Float32Array(CORR_FFT),
          }
        }

        corrNodesRef.current[track] = {
          splitter,
          low:  makeBand('lowpass',  200,  0.707),
          mid:  makeBand('bandpass', 1000, 0.5),
          high: makeBand('highpass', 5000, 0.707),
        }
      }

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

      // ── Multiband correlation ─────────────────────────────────────────────
      const corrNodes = corrNodesRef.current[activeTrackRef.current]
      if (corrNodes) {
        const lowCorr  = computeCorr(corrNodes.low)
        const midCorr  = computeCorr(corrNodes.mid)
        const highCorr = computeCorr(corrNodes.high)
        const s = corrSmoothRef.current
        s.low  = s.low  * (1 - CORR_ALPHA) + lowCorr  * CORR_ALPHA
        s.mid  = s.mid  * (1 - CORR_ALPHA) + midCorr  * CORR_ALPHA
        s.high = s.high * (1 - CORR_ALPHA) + highCorr * CORR_ALPHA
        setMultibandCorrelation({ low: s.low, mid: s.mid, high: s.high })
      }

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

  // ── LUFS integrated (background computation on mount) ──
  useEffect(() => {
    if (typeof window === 'undefined') return
    const computeAfter = async (): Promise<void> => {
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
    const computeBefore = async (): Promise<void> => {
      try {
        const ctx = new AudioContext()
        const resp = await fetch(tracks.before.url)
        const ab = await resp.arrayBuffer()
        const decoded = await ctx.decodeAudioData(ab)
        const lufs = computeIntegratedLufs(decoded.getChannelData(0))
        setLufsIntegratedBefore(isFinite(lufs) ? lufs : null)
        await ctx.close()
      } catch {
        // silently ignore
      }
    }
    void computeAfter()
    void computeBefore()
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

  // ── Loudness Penalty control ──
  const setPlatform = useCallback((key: PlatformKey | null): void => {
    setActivePlatform(key)
  }, [])

  // Apply penalty gain whenever platform or lufsIntegrated changes
  useEffect(() => {
    const penaltyGain = penaltyGainRef.current
    if (!penaltyGain) return
    if (!activePlatform || activePlatform === 'club') {
      penaltyGain.gain.value = 1
      return
    }
    const profile = PENALTY_PROFILES[activePlatform]
    if (profile.targetLufs === null || lufsIntegrated === null) {
      penaltyGain.gain.value = 1
      return
    }
    const db = profile.targetLufs - lufsIntegrated
    // Only attenuate (never amplify) to prevent clipping
    penaltyGain.gain.value = Math.pow(10, Math.min(0, db) / 20)
  }, [activePlatform, lufsIntegrated])

  // Derived penalty display value
  const penaltyDb: number | null = (() => {
    if (!activePlatform || activePlatform === 'club') return null
    const profile = PENALTY_PROFILES[activePlatform]
    if (profile.targetLufs === null || lufsIntegrated === null) return null
    return profile.targetLufs - lufsIntegrated
  })()

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
    activePlatform,
    penaltyDb,
    play,
    pause,
    seek,
    switchTrack,
    setPlatform,
  }
}
