'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, SpeakerHigh } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AudioPlayerProps {
  tracks: {
    original: string
    mixed: string
    mastered: string
  }
  title: string
  artist: string
}

type AudioVersion = 'original' | 'mixed' | 'mastered'

const VERSION_LABELS: Record<AudioVersion, string> = {
  original: 'ORIGINAL',
  mixed: 'MIXED',
  mastered: 'MASTERED',
}

const FREQUENCY_BANDS = [
  { min: 20, max: 250, label: 'Bass' },
  { min: 250, max: 500, label: 'Low Mid' },
  { min: 500, max: 2000, label: 'Mid' },
  { min: 2000, max: 6000, label: 'High Mid' },
  { min: 6000, max: 20000, label: 'Treble' },
]

const BAND_COLORS = [
  'oklch(0.75 0.20 160)',
  'oklch(0.70 0.18 180)',
  'oklch(0.65 0.16 200)',
  'oklch(0.70 0.18 220)',
  'oklch(0.75 0.20 240)',
]

export function AudioPlayer({ tracks, title, artist }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [version, setVersion] = useState<AudioVersion>('original')
  const [volume, setVolume] = useState(75)
  const [frequencyData, setFrequencyData] = useState<number[]>(
    new Array(FREQUENCY_BANDS.length).fill(0),
  )

  const audioRefs = useRef<Record<AudioVersion, HTMLAudioElement | null>>({
    original: null,
    mixed: null,
    mastered: null,
  })
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceMapRef = useRef<Map<HTMLAudioElement, MediaElementAudioSourceNode>>(new Map())
  const rafRef = useRef<number>()

  const stopAnalyzer = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = undefined
    }
    setFrequencyData(new Array(FREQUENCY_BANDS.length).fill(0))
  }, [])

  useEffect(() => {
    ;(Object.keys(tracks) as AudioVersion[]).forEach((key) => {
      const audio = new Audio(tracks[key])
      audio.preload = 'metadata'
      audio.volume = volume / 100
      audioRefs.current[key] = audio

      audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
      audio.addEventListener('timeupdate', () => {
        if (key === version) setCurrentTime(audio.currentTime)
      })
      audio.addEventListener('ended', () => {
        setIsPlaying(false)
        stopAnalyzer()
      })
    })

    return () => {
      Object.values(audioRefs.current).forEach((a) => {
        a?.pause()
        a?.remove()
      })
      stopAnalyzer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks])

  useEffect(() => {
    Object.values(audioRefs.current).forEach((a) => {
      if (a) a.volume = volume / 100
    })
  }, [volume])

  function getContext() {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
    return audioCtxRef.current
  }

  function getAnalyser() {
    if (!analyserRef.current) {
      const ctx = getContext()
      analyserRef.current = ctx.createAnalyser()
      analyserRef.current.fftSize = 2048
      analyserRef.current.smoothingTimeConstant = 0.8
      analyserRef.current.connect(ctx.destination)
    }
    return analyserRef.current
  }

  function connectSource(element: HTMLAudioElement) {
    const existing = sourceMapRef.current.get(element)
    if (existing) return existing
    const ctx = getContext()
    const analyser = getAnalyser()
    const source = ctx.createMediaElementSource(element)
    source.connect(analyser)
    sourceMapRef.current.set(element, source)
    return source
  }

  function startAnalyzer() {
    const analyser = getAnalyser()
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const sampleRate = getContext().sampleRate
    const nyquist = sampleRate / 2
    const binWidth = nyquist / bufferLength

    const analyze = () => {
      analyser.getByteFrequencyData(dataArray)
      const values = FREQUENCY_BANDS.map(({ min, max }) => {
        const start = Math.floor(min / binWidth)
        const end = Math.floor(max / binWidth)
        let sum = 0
        let count = 0
        for (let i = start; i <= Math.min(end, bufferLength - 1); i++) {
          sum += dataArray[i]
          count++
        }
        return count > 0 ? sum / count / 255 : 0
      })
      setFrequencyData(values)
      rafRef.current = requestAnimationFrame(analyze)
    }
    analyze()
  }

  const togglePlayPause = async () => {
    const audio = audioRefs.current[version]
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      stopAnalyzer()
    } else {
      connectSource(audio)
      if (audioCtxRef.current?.state === 'suspended') await audioCtxRef.current.resume()
      await audio.play()
      startAnalyzer()
    }
    setIsPlaying((p) => !p)
  }

  const handleVersionChange = (newVersion: AudioVersion) => {
    const oldAudio = audioRefs.current[version]
    const newAudio = audioRefs.current[newVersion]
    if (!newAudio) return

    const wasPlaying = isPlaying
    const pos = oldAudio?.currentTime ?? 0
    oldAudio?.pause()
    newAudio.currentTime = pos
    setVersion(newVersion)

    if (wasPlaying) {
      connectSource(newAudio)
      newAudio.play()
    }
  }

  const handleSeek = (value: number[]) => {
    const newTime = (value[0] / 100) * duration
    const audio = audioRefs.current[version]
    if (audio) {
      audio.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  return (
    <div className="bg-card border border-border rounded overflow-hidden glow-accent">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground font-mono uppercase tracking-wide">{artist}</p>
          </div>
          <div className="flex gap-2">
            {(['original', 'mixed', 'mastered'] as AudioVersion[]).map((v) => (
              <Badge
                key={v}
                variant={version === v ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer transition-all font-mono text-xs px-3 py-1',
                  version === v
                    ? 'bg-accent text-white border-accent'
                    : 'border-border hover:border-accent/50',
                )}
                onClick={() => handleVersionChange(v)}
              >
                {VERSION_LABELS[v]}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              size="icon"
              onClick={togglePlayPause}
              className="h-12 w-12 rounded bg-accent hover:bg-accent/90 text-white transition-all hover:scale-105 active:scale-95 glow-accent-strong"
            >
              {isPlaying ? (
                <Pause weight="fill" className="h-5 w-5" />
              ) : (
                <Play weight="fill" className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            <div className="flex-1 space-y-2">
              <Slider
                value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs font-mono text-muted-foreground uppercase tracking-wider">
                <span>{fmt(currentTime)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <SpeakerHigh className="h-4 w-4 text-muted-foreground" />
              <div className="w-20">
                <Slider
                  value={[volume]}
                  onValueChange={(v) => setVolume(v[0])}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Frequency visualiser */}
      <div className="p-6 bg-secondary/30 relative overflow-hidden">
        <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
          Frequency Spectrum
        </h4>
        <div className="flex items-end justify-between gap-3 h-40">
          {frequencyData.map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-muted/50 border border-border/50 rounded-sm overflow-hidden relative h-full">
                <div
                  className="absolute bottom-0 w-full transition-all duration-100 rounded-sm"
                  style={{
                    height: `${Math.max(value * 100, 2)}%`,
                    background: `linear-gradient(to top, ${BAND_COLORS[index]}, ${BAND_COLORS[index]}aa)`,
                    boxShadow:
                      isPlaying && value > 0.1 ? `0 0 12px ${BAND_COLORS[index]}88` : 'none',
                  }}
                />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                {FREQUENCY_BANDS[index].label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
