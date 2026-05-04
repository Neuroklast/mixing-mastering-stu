'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

export type AudioVersion = 'original' | 'mixed' | 'mastered'

export interface AudioTracks {
  original: string
  mixed: string
  mastered: string
}

export interface FrequencyBand {
  min: number
  max: number
  label: string
}

export const FREQUENCY_BANDS: FrequencyBand[] = [
  { min: 20, max: 250, label: 'Bass' },
  { min: 250, max: 500, label: 'Low Mid' },
  { min: 500, max: 2000, label: 'Mid' },
  { min: 2000, max: 6000, label: 'High Mid' },
  { min: 6000, max: 20000, label: 'Treble' },
]

export interface AudioPlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  activeVersion: AudioVersion
  volume: number
  frequencyBands: number[]
}

export interface AudioPlayerControls {
  togglePlayPause: () => Promise<void>
  seekTo: (progressPercent: number) => void
  setVolume: (volume: number) => void
  switchVersion: (version: AudioVersion) => void
}

const buildAudioElements = (tracks: AudioTracks): Record<AudioVersion, HTMLAudioElement> => {
  const make = (url: string): HTMLAudioElement => {
    const a = new Audio()
    a.crossOrigin = 'anonymous'
    a.src = url
    return a
  }
  return {
    original: make(tracks.original),
    mixed: make(tracks.mixed),
    mastered: make(tracks.mastered),
  }
}

const computeFrequencyBands = (
  analyser: AnalyserNode,
  sampleRate: number,
): number[] => {
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  analyser.getByteFrequencyData(dataArray)

  const nyquist = sampleRate / 2
  const binWidth = nyquist / bufferLength

  return FREQUENCY_BANDS.map(({ min, max }) => {
    const startBin = Math.floor(min / binWidth)
    const endBin = Math.min(Math.floor(max / binWidth), bufferLength - 1)
    let sum = 0
    for (let i = startBin; i <= endBin; i++) sum += dataArray[i]
    const count = endBin - startBin + 1
    return count > 0 ? sum / count / 255 : 0
  })
}

export const useAudioPlayer = (tracks: AudioTracks): AudioPlayerState & AudioPlayerControls => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [activeVersion, setActiveVersion] = useState<AudioVersion>('original')
  const [volume, setVolumeState] = useState(75)
  const [frequencyBands, setFrequencyBands] = useState<number[]>(
    new Array(FREQUENCY_BANDS.length).fill(0),
  )

  const audioElements = useRef<Record<AudioVersion, HTMLAudioElement>>(buildAudioElements(tracks))
  const audioCtx = useRef<AudioContext | null>(null)
  const analyserNode = useRef<AnalyserNode | null>(null)
  const sourceNodes = useRef<Map<HTMLAudioElement, MediaElementAudioSourceNode>>(new Map())
  const analyserRaf = useRef<number | undefined>(undefined)

  const stopAnalyser = useCallback(() => {
    if (analyserRaf.current !== undefined) cancelAnimationFrame(analyserRaf.current)
    analyserRaf.current = undefined
    setFrequencyBands(new Array(FREQUENCY_BANDS.length).fill(0))
  }, [])

  useEffect(() => {
    const elements = audioElements.current
    const allVersions: AudioVersion[] = ['original', 'mixed', 'mastered']

    allVersions.forEach((version) => {
      const audio = elements[version]
      audio.preload = 'metadata'
      audio.volume = volume / 100
      audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
      audio.addEventListener('timeupdate', () => {
        if (version === activeVersion) setCurrentTime(audio.currentTime)
      })
      audio.addEventListener('ended', () => {
        setIsPlaying(false)
        stopAnalyser()
      })
    })

    return () => {
      allVersions.forEach((version) => {
        elements[version].pause()
        elements[version].src = ''
      })
      stopAnalyser()
      audioCtx.current?.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const allVersions: AudioVersion[] = ['original', 'mixed', 'mastered']
    allVersions.forEach((version) => {
      audioElements.current[version].volume = volume / 100
    })
  }, [volume])

  const getOrCreateAudioContext = (): AudioContext => {
    if (!audioCtx.current) audioCtx.current = new AudioContext()
    return audioCtx.current
  }

  const getOrCreateAnalyser = (): AnalyserNode => {
    if (analyserNode.current) return analyserNode.current
    const ctx = getOrCreateAudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.8
    analyser.connect(ctx.destination)
    analyserNode.current = analyser
    return analyser
  }

  const connectAudioElement = (audio: HTMLAudioElement): void => {
    if (sourceNodes.current.has(audio)) return
    const ctx = getOrCreateAudioContext()
    const analyser = getOrCreateAnalyser()
    const source = ctx.createMediaElementSource(audio)
    source.connect(analyser)
    sourceNodes.current.set(audio, source)
  }

  const startAnalyser = (): void => {
    const analyser = getOrCreateAnalyser()
    const sampleRate = getOrCreateAudioContext().sampleRate

    const tick = (): void => {
      setFrequencyBands(computeFrequencyBands(analyser, sampleRate))
      analyserRaf.current = requestAnimationFrame(tick)
    }
    tick()
  }

  const togglePlayPause = async (): Promise<void> => {
    const activeAudio = audioElements.current[activeVersion]

    if (isPlaying) {
      activeAudio.pause()
      stopAnalyser()
      setIsPlaying(false)
      return
    }

    connectAudioElement(activeAudio)
    const ctx = getOrCreateAudioContext()
    if (ctx.state === 'suspended') await ctx.resume()
    await activeAudio.play()
    startAnalyser()
    setIsPlaying(true)
  }

  const seekTo = (progressPercent: number): void => {
    const activeAudio = audioElements.current[activeVersion]
    const newTime = (progressPercent / 100) * duration
    activeAudio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const setVolume = (newVolume: number): void => setVolumeState(newVolume)

  const switchVersion = (version: AudioVersion): void => {
    const previousAudio = audioElements.current[activeVersion]
    const nextAudio = audioElements.current[version]
    const wasPlaying = isPlaying
    const savedTime = previousAudio.currentTime

    previousAudio.pause()
    nextAudio.currentTime = savedTime
    setActiveVersion(version)

    if (!wasPlaying) return
    connectAudioElement(nextAudio)
    nextAudio.play()
  }

  return {
    isPlaying,
    currentTime,
    duration,
    activeVersion,
    volume,
    frequencyBands,
    togglePlayPause,
    seekTo,
    setVolume,
    switchVersion,
  }
}
