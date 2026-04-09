import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SpeakerHigh } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAudioContext } from '@/hooks/use-audio-context'
import { useFrequencyAnalyzer, FREQUENCY_BANDS } from '@/hooks/use-frequency-analyzer'

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

export function AudioPlayer({ tracks, title, artist }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [version, setVersion] = useState<AudioVersion>('original')
  const [volume, setVolume] = useState(75)
  
  const audioRefs = useRef<Record<AudioVersion, HTMLAudioElement | null>>({
    original: null,
    mixed: null,
    mastered: null,
  })
  
  const audioContext = useAudioContext()
  const { frequencyData, start: startAnalyzer, stop: stopAnalyzer } = useFrequencyAnalyzer(
    audioContext.getAnalyser(),
    audioContext.getContext().sampleRate
  )

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
        stopAnalyzer()
      })
    })

    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        audio?.pause()
        audio?.remove()
      })
      stopAnalyzer()
    }
  }, [tracks, version, stopAnalyzer])

  useEffect(() => {
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio) audio.volume = volume / 100
    })
  }, [volume])

  const togglePlayPause = async () => {
    const currentAudio = audioRefs.current[version]
    if (!currentAudio) return

    if (isPlaying) {
      currentAudio.pause()
      stopAnalyzer()
    } else {
      audioContext.connectSource(currentAudio)
      await audioContext.resume()
      await currentAudio.play()
      startAnalyzer()
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
      audioContext.connectSource(newAudio)
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

  const bandColors = [
    'oklch(0.75 0.20 160)',
    'oklch(0.70 0.18 180)',
    'oklch(0.65 0.16 200)',
    'oklch(0.70 0.18 220)',
    'oklch(0.75 0.20 240)',
  ]

  return (
    <div className="bg-card border border-border rounded overflow-hidden glow-accent">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-card-foreground tracking-tight">{title}</h3>
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
                    ? 'bg-accent text-accent-foreground border-accent' 
                    : 'border-border hover:border-accent/50'
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
              className="h-12 w-12 rounded bg-accent hover:bg-accent/90 text-accent-foreground transition-all hover:scale-105 active:scale-95 glow-accent-strong"
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
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
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

      <div className="p-6 bg-secondary/30 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-t from-accent/20 to-transparent" />
        </div>
        <div className="relative">
          <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
            Frequency Spectrum
          </h4>
          <div className="flex items-end justify-between gap-3 h-40">
            {frequencyData.map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-muted/50 border border-border/50 rounded-sm overflow-hidden relative h-full">
                  <div
                    className={cn(
                      "absolute bottom-0 w-full transition-all duration-100 rounded-sm",
                    )}
                    style={{
                      height: `${Math.max(value * 100, 2)}%`,
                      background: `linear-gradient(to top, ${bandColors[index]}, ${bandColors[index]}aa)`,
                      boxShadow: isPlaying && value > 0.1 ? `0 0 12px ${bandColors[index]}88` : 'none',
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
    </div>
  )
}
