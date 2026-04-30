'use client'

import { Play, Pause, SpeakerHigh } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { FrequencyVisualizer } from '@/components/features/FrequencyVisualizer'
import { useAudioPlayer, type AudioVersion, type AudioTracks } from '@/hooks/useAudioPlayer'
import { cn } from '@/lib/utils'

interface AudioPlayerProps {
  tracks: AudioTracks
  title: string
  artist: string
}

const VERSION_LABELS: Record<AudioVersion, string> = {
  original: 'ORIGINAL',
  mixed: 'MIXED',
  mastered: 'MASTERED',
}

const ALL_VERSIONS: AudioVersion[] = ['original', 'mixed', 'mastered']

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(Math.floor(totalSeconds % 60)).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export const AudioPlayer = ({ tracks, title, artist }: AudioPlayerProps): JSX.Element => {
  const {
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
  } = useAudioPlayer(tracks)

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-card border border-border rounded overflow-hidden glow-accent">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground font-mono uppercase tracking-wide">
              {artist}
            </p>
          </div>
          <div className="flex gap-2">
            {ALL_VERSIONS.map((version) => (
              <Badge
                key={version}
                variant={activeVersion === version ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer transition-all font-mono text-xs px-3 py-1',
                  activeVersion === version
                    ? 'bg-accent text-white border-accent'
                    : 'border-border hover:border-accent/50',
                )}
                onClick={() => switchVersion(version)}
              >
                {VERSION_LABELS[version]}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            size="icon"
            onClick={togglePlayPause}
            className="h-12 w-12 rounded bg-accent hover:bg-accent/90 text-white transition-all hover:scale-105 active:scale-95 glow-accent-strong"
          >
            {isPlaying
              ? <Pause weight="fill" className="h-5 w-5" />
              : <Play weight="fill" className="h-5 w-5 ml-0.5" />}
          </Button>

          <div className="flex-1 space-y-2">
            <Slider
              value={[progressPercent]}
              onValueChange={([value]) => seekTo(value)}
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
                onValueChange={([value]) => setVolume(value)}
                max={100}
                step={1}
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      <FrequencyVisualizer frequencyBands={frequencyBands} isPlaying={isPlaying} />
    </div>
  )
}
