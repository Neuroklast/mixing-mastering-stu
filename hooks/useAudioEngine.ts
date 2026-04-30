'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

export interface AudioTrack {
  label: 'before' | 'after'
  url: string
}

export interface AudioEngineState {
  isPlaying: boolean
  activeTrack: 'before' | 'after'
  currentTime: number
  duration: number
  lufsIntegrated: number | null
  lufsShortTerm: number | null
  frequencyData: Uint8Array | null
}

interface AudioEngineTracks {
  before: AudioTrack
  after: AudioTrack
}

type AudioEngineControls = {
  play: () => Promise<void>
  pause: () => void
  seek: (time: number) => void
  switchTrack: (track: 'before' | 'after') => void
}

// ITU-R BS.1770-4 reference offset for LUFS calculation
const LUFS_REFERENCE_OFFSET = -0.691

function computeIntegratedLufs(samples: Float32Array): number {
  let sum = 0
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i]
  }
  const meanSquare = sum / samples.length
  if (meanSquare === 0) return -Infinity
  return LUFS_REFERENCE_OFFSET + 10 * Math.log10(meanSquare)
}

function computeShortTermLufsFromFreqData(data: Uint8Array): number {
  let sum = 0
  for (let i = 0; i < data.length; i++) {
    const normalized = data[i] / 255
    sum += normalized * normalized
  }
  const meanSquare = sum / data.length
  if (meanSquare === 0) return -Infinity
  return LUFS_REFERENCE_OFFSET + 10 * Math.log10(meanSquare)
}

export function useAudioEngine(
  tracks: AudioEngineTracks,
): AudioEngineState & AudioEngineControls {
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeTrack, setActiveTrack] = useState<'before' | 'after'>('before')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [lufsIntegrated, setLufsIntegrated] = useState<number | null>(null)
  const [lufsShortTerm, setLufsShortTerm] = useState<number | null>(null)
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null)

  const audioCtx = useRef<AudioContext | null>(null)
  const analyserNode = useRef<AnalyserNode | null>(null)
  const sourceNodes = useRef<Map<HTMLAudioElement, MediaElementAudioSourceNode>>(new Map())
  const rafId = useRef<number | undefined>(undefined)
  const audioElements = useRef<Record<'before' | 'after', HTMLAudioElement> | null>(null)
  const activeTrackRef = useRef<'before' | 'after'>('before')
  const isPlayingRef = useRef(false)

  const getOrCreateAudioContext = useCallback((): AudioContext => {
    if (!audioCtx.current) audioCtx.current = new AudioContext()
    return audioCtx.current
  }, [])

  const getOrCreateAnalyser = useCallback((): AnalyserNode => {
    if (analyserNode.current) return analyserNode.current
    const ctx = getOrCreateAudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.8
    analyser.connect(ctx.destination)
    analyserNode.current = analyser
    return analyser
  }, [getOrCreateAudioContext])

  const connectAudioElement = useCallback(
    (audio: HTMLAudioElement): void => {
      if (sourceNodes.current.has(audio)) return
      const ctx = getOrCreateAudioContext()
      const analyser = getOrCreateAnalyser()
      const source = ctx.createMediaElementSource(audio)
      source.connect(analyser)
      sourceNodes.current.set(audio, source)
    },
    [getOrCreateAudioContext, getOrCreateAnalyser],
  )

  const stopRaf = useCallback((): void => {
    if (rafId.current !== undefined) {
      cancelAnimationFrame(rafId.current)
      rafId.current = undefined
    }
  }, [])

  const startRaf = useCallback((): void => {
    stopRaf()
    const analyser = getOrCreateAnalyser()
    const data = new Uint8Array(analyser.frequencyBinCount)

    const tick = (): void => {
      analyser.getByteFrequencyData(data)
      setFrequencyData(new Uint8Array(data))
      const stLufs = computeShortTermLufsFromFreqData(data)
      setLufsShortTerm(isFinite(stLufs) ? stLufs : null)
      rafId.current = requestAnimationFrame(tick)
    }
    rafId.current = requestAnimationFrame(tick)
  }, [getOrCreateAnalyser, stopRaf])

  useEffect(() => {
    if (typeof window === 'undefined') return
    sourceNodes.current = new Map()
    audioElements.current = {
      before: new Audio(tracks.before.url),
      after: new Audio(tracks.after.url),
    }
    const elements = audioElements.current
    elements.before.preload = 'metadata'
    elements.after.preload = 'metadata'

    const handleMetadata = (version: 'before' | 'after') => () => {
      if (version === activeTrackRef.current) {
        setDuration(elements[version].duration)
      }
    }

    const handleTimeUpdate = (version: 'before' | 'after') => () => {
      if (version === activeTrackRef.current) {
        setCurrentTime(elements[version].currentTime)
      }
    }

    const handleEnded = (): void => {
      setIsPlaying(false)
      isPlayingRef.current = false
      stopRaf()
      setFrequencyData(null)
      setLufsShortTerm(null)
    }

    ;(['before', 'after'] as const).forEach((version) => {
      elements[version].addEventListener('loadedmetadata', handleMetadata(version))
      elements[version].addEventListener('timeupdate', handleTimeUpdate(version))
      elements[version].addEventListener('ended', handleEnded)
    })

    return () => {
      ;(['before', 'after'] as const).forEach((version) => {
        elements[version].pause()
        elements[version].src = ''
      })
      stopRaf()
      audioCtx.current?.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const computeLufs = async (): Promise<void> => {
      try {
        const ctx = new AudioContext()
        const response = await fetch(tracks.after.url)
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
        const channelData = audioBuffer.getChannelData(0)
        const lufs = computeIntegratedLufs(channelData)
        setLufsIntegrated(isFinite(lufs) ? lufs : null)
        await ctx.close()
      } catch {
        // Ignore LUFS computation errors (e.g. CORS, decode failure)
      }
    }
    void computeLufs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks.after.url])

  const play = useCallback(async (): Promise<void> => {
    if (!audioElements.current) return
    const audio = audioElements.current[activeTrackRef.current]
    connectAudioElement(audio)
    const ctx = getOrCreateAudioContext()
    if (ctx.state === 'suspended') await ctx.resume()
    await audio.play()
    startRaf()
    setIsPlaying(true)
    isPlayingRef.current = true
    setDuration(audio.duration || 0)
  }, [connectAudioElement, getOrCreateAudioContext, startRaf])

  const pause = useCallback((): void => {
    if (!audioElements.current) return
    audioElements.current[activeTrackRef.current].pause()
    stopRaf()
    setIsPlaying(false)
    isPlayingRef.current = false
    setFrequencyData(null)
    setLufsShortTerm(null)
  }, [stopRaf])

  const seek = useCallback((time: number): void => {
    if (!audioElements.current) return
    const audio = audioElements.current[activeTrackRef.current]
    audio.currentTime = time
    setCurrentTime(time)
  }, [])

  const switchTrack = useCallback(
    (track: 'before' | 'after'): void => {
      if (!audioElements.current) return
      const prevAudio = audioElements.current[activeTrackRef.current]
      const nextAudio = audioElements.current[track]
      const savedTime = prevAudio.currentTime
      const wasPlaying = isPlayingRef.current

      prevAudio.pause()
      nextAudio.currentTime = savedTime
      activeTrackRef.current = track
      setActiveTrack(track)
      setDuration(nextAudio.duration || 0)
      setCurrentTime(savedTime)

      if (!wasPlaying) return
      connectAudioElement(nextAudio)
      const ctx = getOrCreateAudioContext()
      if (ctx.state === 'suspended') {
        void ctx.resume().then(() => nextAudio.play())
      } else {
        void nextAudio.play()
      }
    },
    [connectAudioElement, getOrCreateAudioContext],
  )

  return {
    isPlaying,
    activeTrack,
    currentTime,
    duration,
    lufsIntegrated,
    lufsShortTerm,
    frequencyData,
    play,
    pause,
    seek,
    switchTrack,
  }
}
