'use client'

import { useRef, useEffect, useCallback } from 'react'
import { Play, Pause } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import { showcaseTrackSchema, type ShowcaseTrack } from '@/lib/schemas/showcase'
import { cn } from '@/lib/utils'

interface MasteringPlayerProps {
  track: ShowcaseTrack
}

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(Math.floor(totalSeconds % 60)).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export const MasteringPlayer = ({ track }: MasteringPlayerProps): JSX.Element => {
  const validation = showcaseTrackSchema.safeParse(track)

  if (!validation.success) {
    return (
      <div className="bg-card border border-border rounded p-6 text-center">
        <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">
          Invalid track data
        </p>
      </div>
    )
  }

  const validTrack = validation.data
  return <MasteringPlayerInner track={validTrack} />
}

const MasteringPlayerInner = ({ track }: { track: ShowcaseTrack }): JSX.Element => {
  const engine = useAudioEngine({
    before: { label: 'before', url: track.beforeUrl },
    after: { label: 'after', url: track.afterUrl },
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !engine.frequencyData) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { width, height } = canvas
    ctx.clearRect(0, 0, width, height)
    const data = engine.frequencyData
    const barCount = Math.min(64, data.length)
    const barWidth = width / barCount
    ctx.fillStyle = '#D94848'
    for (let i = 0; i < barCount; i++) {
      const value = data[i] / 255
      const barHeight = value * height
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight)
    }
  }, [engine.frequencyData])

  useEffect(() => {
    drawVisualizer()
  }, [drawVisualizer])

  const lufsIntegrated = engine.lufsIntegrated
  const lufsShortTerm = engine.lufsShortTerm
  const lufsImproved =
    lufsIntegrated !== null && lufsShortTerm !== null && lufsShortTerm > lufsIntegrated

  return (
    <section className="w-full bg-card border border-border rounded overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold tracking-tight font-heading">{track.title}</h3>
            {track.artist && (
              <p className="text-sm text-muted-foreground font-mono uppercase tracking-wide">
                {track.artist}
              </p>
            )}
          </div>

          {/* A/B Toggle */}
          <div className="flex gap-2">
            {(['before', 'after'] as const).map((t) => (
              <button
                key={t}
                onClick={() => engine.switchTrack(t)}
                className={cn(
                  'px-6 py-2 rounded font-mono text-sm font-bold uppercase tracking-wider border-2 transition-all duration-200',
                  engine.activeTrack === t
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white glow-accent-strong'
                    : 'bg-transparent border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10',
                )}
              >
                {t === 'before' ? 'MIXDOWN' : 'FINAL TRACK'}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas Visualizer */}
        <div className="mb-4 rounded overflow-hidden bg-secondary/30">
          <canvas ref={canvasRef} width={800} height={120} className="w-full h-[120px]" />
        </div>

        {/* LUFS Meter */}
        <div className="flex gap-6 mb-4 font-mono text-xs">
          <span className="text-muted-foreground uppercase tracking-wider">
            INT:{' '}
            <span className="text-foreground">
              {lufsIntegrated !== null ? `${lufsIntegrated.toFixed(1)} LUFS` : '--- LUFS'}
            </span>
          </span>
          <span className="text-muted-foreground uppercase tracking-wider">
            ST:{' '}
            <span
              className={cn(
                lufsIntegrated !== null && lufsShortTerm !== null
                  ? lufsImproved
                    ? 'text-green-400'
                    : 'text-red-400'
                  : 'text-foreground',
              )}
            >
              {lufsShortTerm !== null ? `${lufsShortTerm.toFixed(1)} LUFS` : '--- LUFS'}
            </span>
          </span>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            onClick={engine.isPlaying ? engine.pause : engine.play}
            className="h-12 w-12 rounded bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white transition-all hover:scale-105 active:scale-95 glow-accent-strong flex-shrink-0"
          >
            {engine.isPlaying ? (
              <Pause weight="fill" className="h-5 w-5" />
            ) : (
              <Play weight="fill" className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          <div className="flex-1 space-y-2">
            <Slider
              value={[engine.currentTime]}
              onValueChange={([value]) => engine.seek(value ?? 0)}
              max={engine.duration || 1}
              step={0.1}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs font-mono text-muted-foreground uppercase tracking-wider">
              <span>{formatTime(engine.currentTime)}</span>
              <span>{formatTime(engine.duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata Strip */}
      {(track.genre || track.equipment) && (
        <div className="px-6 py-3 flex gap-2 flex-wrap bg-secondary/20">
          {track.genre && (
            <Badge variant="outline" className="font-mono text-xs border-border">
              {track.genre}
            </Badge>
          )}
          {track.equipment && (
            <Badge variant="outline" className="font-mono text-xs border-border">
              {track.equipment}
            </Badge>
          )}
        </div>
      )}
    </section>
  )
}
