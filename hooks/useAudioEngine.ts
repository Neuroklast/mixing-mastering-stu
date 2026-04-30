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
  /** @deprecated use status instead */
  isPlaying: boolean
  activeTrack: 'before' | 'after'
  currentTime: number
  duration: number
  lufsIntegrated: number | null
  lufsShortTerm: number | null
  frequencyData: Uint8Array | null
  errorMessage: string | null
  gainCompensationEnabled: boolean
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

// ─── Singleton AudioContext ───────────────────────────────────────────────────

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

  // ── Refs (audio graph) ──
  const analyserRef = useRef<AnalyserNode | null>(null)
  const gainNodesRef = useRef<Record<'before' | 'after', GainNode> | null>(null)
  const sourceNodesRef = useRef<Map<HTMLAudioElement, MediaElementAudioSourceNode>>(new Map())
  const audioElementsRef = useRef<Record<'before' | 'after', HTMLAudioElement> | null>(null)
  const activeTrackRef = useRef<'before' | 'after'>('before')
  const statusRef = useRef<PlayerStatus>('idle')
  const rafIdRef = useRef<number | undefined>(undefined)
  const gainMatchRef = useRef<number>(1) // ratio to apply to 'before' when compensation on

  // Helper: keep statusRef in sync
  const updateStatus = useCallback((s: PlayerStatus) => {
    statusRef.current = s
    setStatus(s)
  }, [])

  // ── Audio graph setup ──
  const getOrCreateGraph = useCallback(() => {
    const ctx = getAudioContext()
    if (!analyserRef.current) {
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
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
    return { ctx, analyser: analyserRef.current, gains: gainNodesRef.current }
  }, [])

  const connectAudioElement = useCallback(
    (audio: HTMLAudioElement, track: 'before' | 'after'): void => {
      if (sourceNodesRef.current.has(audio)) return
      const { ctx, gains } = getOrCreateGraph()
      const source = ctx.createMediaElementSource(audio)
      source.connect(gains[track])
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

      toGain.gain.setValueAtTime(0, now)
      toGain.gain.linearRampToValueAtTime(1, now + FADE)
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
        const ctx = new AudioContext()
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
        await ctx.close()
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

    const onEnded = (): void => {
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
      elements[v].addEventListener('ended', onEnded)
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

  // ── Controls ──
  const play = useCallback(async (): Promise<void> => {
    if (!audioElementsRef.current) return
    if (statusRef.current === 'loading') return
    const audio = audioElementsRef.current[activeTrackRef.current]
    connectAudioElement(audio, activeTrackRef.current)
    const { ctx, gains } = getOrCreateGraph()
    if (ctx.state === 'suspended') await ctx.resume()
    // Ensure the active track's gain is at 1 (or gain-compensated value for 'before')
    const targetGain =
      activeTrackRef.current === 'before' && gainCompensationEnabled
        ? gainMatchRef.current
        : 1
    gains[activeTrackRef.current].gain.value = targetGain
    gains[activeTrackRef.current === 'before' ? 'after' : 'before'].gain.value = 0
    await audio.play()
    startRaf()
    updateStatus('playing')
    setDuration(audio.duration || 0)
  }, [connectAudioElement, gainCompensationEnabled, getOrCreateGraph, startRaf, updateStatus])

  const pause = useCallback((): void => {
    if (!audioElementsRef.current) return
    audioElementsRef.current[activeTrackRef.current].pause()
    stopRaf()
    updateStatus('paused')
    setFrequencyData(null)
    setLufsShortTerm(null)
  }, [stopRaf, updateStatus])

  const seek = useCallback((time: number): void => {
    if (!audioElementsRef.current) return
    const audio = audioElementsRef.current[activeTrackRef.current]
    audio.currentTime = time
    setCurrentTime(time)
  }, [])

  const switchTrack = useCallback(
    (track: 'before' | 'after'): void => {
      if (!audioElementsRef.current) return
      if (statusRef.current === 'loading') return
      if (activeTrackRef.current === track) return

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
        prevAudio.pause()
        updateStatus('paused')
        return
      }

      // Crossfade: ramp out old, ramp in new
      crossfade(prevTrack, track)

      // Set gain compensation for the new active track
      const { gains } = getOrCreateGraph()
      const targetGain =
        track === 'before' && gainCompensationEnabled ? gainMatchRef.current : 1

      const ctx = getAudioContext()
      const startPlay = (): void => {
        void nextAudio.play().then(() => {
          gains[track].gain.value = targetGain
          updateStatus('playing')
        })
      }

      if (ctx.state === 'suspended') {
        void ctx.resume().then(startPlay)
      } else {
        startPlay()
      }

      // Fade out previous after crossfade window
      setTimeout(() => prevAudio.pause(), 20)
    },
    [connectAudioElement, crossfade, gainCompensationEnabled, getOrCreateGraph, updateStatus],
  )

  const toggleGainCompensation = useCallback((): void => {
    setGainCompensationEnabled((prev) => {
      const next = !prev
      void applyGainCompensation(next)
      return next
    })
  }, [applyGainCompensation])

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
    play,
    pause,
    seek,
    switchTrack,
    toggleGainCompensation,
  }
}
