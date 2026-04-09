import { useState, useRef, useEffect } from 'react'
import { Play, Pause } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

export function AudioPlayer({ tracks, title, artist }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [version, setVersion] = useState<AudioVersion>('original')
  const [volume, setVolume] = useState(75)
  const [frequencyData, setFrequencyData] = useState<number[]>([0, 0, 0, 0, 0])
  
  const audioRefs = useRef<Record<AudioVersion, HTMLAudioElement | null>>({
    original: null,
    mixed: null,
    mastered: null,
  })
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceNodesRef = useRef<Record<AudioVersion, MediaElementAudioSourceNode | null>>({
    original: null,
    mixed: null,
    mastered: null,
  })
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    Object.keys(tracks).forEach((key) => {
      const audio = new Audio(tracks[key as AudioVersion])
      audio.preload = 'metadata'
      audio.volume = volume / 100
      audioRefs.current[key as AudioVersion] = audio

      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration)
      })

      audio.addEventListener('timeupdate', () => {
        if (key === version) {
          setCurrentTime(audio.currentTime)
        }
      })

      audio.addEventListener('ended', () => {
        setIsPlaying(false)
      })
    })

    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        audio?.pause()
        audio?.remove()
      })
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [tracks, version])

  useEffect(() => {
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio) audio.volume = volume / 100
    })
  }, [volume])

  const initializeAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 2048
      analyserRef.current.smoothingTimeConstant = 0.8

      Object.entries(audioRefs.current).forEach(([key, audio]) => {
        if (audio && !sourceNodesRef.current[key as AudioVersion]) {
          const source = audioContextRef.current!.createMediaElementSource(audio)
          sourceNodesRef.current[key as AudioVersion] = source
          source.connect(analyserRef.current!)
          analyserRef.current!.connect(audioContextRef.current!.destination)
        }
      })
    }
  }

  const analyzeFrequencies = () => {
    if (!analyserRef.current) return

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyserRef.current.getByteFrequencyData(dataArray)

    const nyquist = (audioContextRef.current?.sampleRate || 44100) / 2
    const binWidth = nyquist / bufferLength

    const bands = [
      { min: 20, max: 250, label: 'Bass' },
      { min: 250, max: 500, label: 'Low Mid' },
      { min: 500, max: 2000, label: 'Mid' },
      { min: 2000, max: 6000, label: 'High Mid' },
      { min: 6000, max: 20000, label: 'Presence' },
    ]

    const bandValues = bands.map((band) => {
      const startBin = Math.floor(band.min / binWidth)
      const endBin = Math.floor(band.max / binWidth)
      let sum = 0
      for (let i = startBin; i <= endBin; i++) {
        sum += dataArray[i]
      }
      return (sum / (endBin - startBin + 1)) / 255
    })

    setFrequencyData(bandValues)
    animationFrameRef.current = requestAnimationFrame(analyzeFrequencies)
  }

  const togglePlayPause = () => {
    const currentAudio = audioRefs.current[version]
    if (!currentAudio) return

    if (isPlaying) {
      currentAudio.pause()
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    } else {
      initializeAudioContext()
      currentAudio.play()
      analyzeFrequencies()
    }
    setIsPlaying(!isPlaying)
  }

  const handleVersionChange = (newVersion: AudioVersion) => {
    const oldAudio = audioRefs.current[version]
    const newAudio = audioRefs.current[newVersion]
    
    if (!newAudio) return

    const wasPlaying = isPlaying
    const currentPosition = oldAudio?.currentTime || 0

    if (oldAudio) {
      oldAudio.pause()
    }

    newAudio.currentTime = currentPosition
    setVersion(newVersion)

    if (wasPlaying) {
      newAudio.play()
    }
  }

  const handleSeek = (value: number[]) => {
    const newTime = (value[0] / 100) * duration
    const currentAudio = audioRefs.current[version]
    if (currentAudio) {
      currentAudio.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const bandLabels = ['Bass', 'Low Mid', 'Mid', 'High Mid', 'Presence']
  const bandColors = [
    'oklch(0.60 0.20 30)',
    'oklch(0.65 0.18 90)',
    'oklch(0.70 0.15 180)',
    'oklch(0.65 0.18 240)',
    'oklch(0.60 0.20 280)',
  ]

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{artist}</p>
          </div>
          <Tabs value={version} onValueChange={(v) => handleVersionChange(v as AudioVersion)}>
            <TabsList className="bg-secondary">
              <TabsTrigger value="original" className="text-xs">Original</TabsTrigger>
              <TabsTrigger value="mixed" className="text-xs">Mixed</TabsTrigger>
              <TabsTrigger value="mastered" className="text-xs">Mastered</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              size="icon"
              onClick={togglePlayPause}
              className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
            >
              {isPlaying ? (
                <Pause weight="fill" className="h-5 w-5" />
              ) : (
                <Play weight="fill" className="h-5 w-5" />
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
              <div className="flex justify-between text-xs font-mono text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="w-24">
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

      <div className="p-6 bg-secondary/50">
        <div className="flex items-end justify-between gap-2 h-32">
          {frequencyData.map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-muted rounded-sm overflow-hidden relative h-full">
                <div
                  className={cn(
                    "absolute bottom-0 w-full transition-all duration-75 rounded-sm",
                    isPlaying && "animate-pulse-subtle"
                  )}
                  style={{
                    height: `${Math.max(value * 100, 2)}%`,
                    background: `linear-gradient(to top, ${bandColors[index]}, ${bandColors[index]}88)`,
                    boxShadow: isPlaying ? `0 0 20px ${bandColors[index]}` : 'none',
                  }}
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {bandLabels[index]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
