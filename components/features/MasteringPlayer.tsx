'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { Play, Pause } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import { SpectrumAnalyser } from '@/components/features/SpectrumAnalyser'
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

const LoadingSkeleton = (): JSX.Element => (
  <section className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-32">
    <div className="w-full bg-card border border-border rounded overflow-hidden">
      <div className="p-8 md:p-10">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-secondary/50 rounded w-1/3" />
          <div className="h-[120px] bg-secondary/30 rounded" />
          <div className="h-12 bg-secondary/30 rounded" />
        </div>
      </div>
    </div>
  </section>
)

const ErrorDisplay = ({ message }: { message: string | null }): JSX.Element => (
  <section className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-32">
    <div className="bg-card border border-border rounded p-8 text-center">
      <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">
        {message ?? 'Audio error'}
      </p>
    </div>
  </section>
)

export const MasteringPlayer = ({ track }: MasteringPlayerProps): JSX.Element => {
  const validation = showcaseTrackSchema.safeParse(track)

  if (!validation.success) {
    return (
      <section className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-32">
        <div className="bg-card border border-border rounded p-8 text-center">
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">
            Invalid track data
          </p>
        </div>
      </section>
    )
  }

  const validTrack = validation.data
  return <MasteringPlayerInner track={validTrack} />
}

const MasteringPlayerInner = ({ track }: { track: ShowcaseTrack }): JSX.Element => {
  const engine = useAudioEngine(
    { before: { label: 'before', url: track.beforeUrl }, after: { label: 'after', url: track.afterUrl } },
    { startMarker: track.startMarker, gainCompensation: false },
  )

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [iosHintDismissed, setIosHintDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return sessionStorage.getItem('ios-audio-hint-dismissed') === '1'
  })

  const isIos =
    typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)

  const dismissIosHint = (): void => {
    sessionStorage.setItem('ios-audio-hint-dismissed', '1')
    setIosHintDismissed(true)
  }

  // Canvas DPR scaling with ResizeObserver to keep pixels crisp on resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const applyDpr = (): void => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      // Setting canvas.width/height resets the 2D context state (clears transform)
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      const ctx = canvas.getContext('2d')
      ctx?.scale(dpr, dpr)
    }

    applyDpr()

    const ro = new ResizeObserver(applyDpr)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !engine.frequencyData) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const w = canvas.width / dpr
    const h = canvas.height / dpr
    ctx.clearRect(0, 0, w, h)
    const data = engine.frequencyData
    const barCount = Math.min(64, data.length)
    const barWidth = w / barCount
    ctx.fillStyle = '#D94848'
    for (let i = 0; i < barCount; i++) {
      const value = data[i] / 255
      const barHeight = value * h
      ctx.fillRect(i * barWidth, h - barHeight, barWidth - 1, barHeight)
    }
  }, [engine.frequencyData])

  useEffect(() => {
    drawVisualizer()
  }, [drawVisualizer])

  if (engine.status === 'loading') return <LoadingSkeleton />
  if (engine.status === 'error') return <ErrorDisplay message={engine.errorMessage} />

  const lufsIntegrated = engine.lufsIntegrated
  const lufsShortTerm = engine.lufsShortTerm
  const lufsImproved =
    lufsIntegrated !== null && lufsShortTerm !== null && lufsShortTerm > lufsIntegrated

  const labelBefore = track.labelBefore ?? 'MIXDOWN'
  const labelAfter = track.labelAfter ?? 'MASTER'

  return (
    <section className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-32">
      {/* Section heading – aligned with all other sections */}
      <div className="mb-10">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-mono uppercase inline-block">
          A/B PLAYER
        </h2>
        <div className="h-0.5 w-16 bg-[var(--color-accent)] mt-2" />
      </div>

      {/* iOS silent-switch hint */}
      {isIos && !iosHintDismissed && engine.status === 'ready' && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 font-mono text-xs text-yellow-300">
          <span>⚠️ On iPhone, make sure the silent switch is OFF to hear audio.</span>
          <button
            onClick={dismissIosHint}
            className="ml-4 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center text-yellow-300 hover:text-yellow-100 transition-colors"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <div className="w-full bg-card border border-border rounded overflow-hidden">
        <div className="p-8 md:p-10 border-b border-border">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold tracking-tight font-heading">{track.title}</h3>
              {track.artist && (
                <p className="text-sm text-muted-foreground font-mono uppercase tracking-wide">
                  {track.artist}
                </p>
              )}
            </div>

            {/* Gain Compensation Toggle */}
            <button
              onClick={engine.toggleGainCompensation}
              className={cn(
                'px-3 py-2 min-h-[44px] rounded font-mono text-xs font-bold uppercase tracking-wider border transition-all duration-200',
                engine.gainCompensationEnabled
                  ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                  : 'bg-transparent border-border text-muted-foreground hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]',
              )}
              title="Match loudness between Mix and Master"
            >
              {engine.gainCompensationEnabled ? 'GAIN COMP ON' : 'GAIN COMP OFF'}
            </button>
          </div>

          {/* Thumb-zone layout: on mobile A/B buttons are at bottom (col-reverse), on desktop normal order */}
          <div className="flex flex-col-reverse sm:flex-col gap-6">
            {/* A/B Toggle row */}
            <div className="flex gap-2">
              {(['before', 'after'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => engine.switchTrack(t)}
                  disabled={engine.status === 'switching'}
                  className={cn(
                    'flex-1 sm:flex-none px-6 py-2 min-h-[44px] rounded font-mono text-sm font-bold uppercase tracking-wider border-2 transition-all duration-200',
                    engine.activeTrack === t
                      ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white glow-accent-strong'
                      : 'bg-transparent border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10',
                    engine.status === 'switching' && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  {t === 'before' ? labelBefore : labelAfter}
                </button>
              ))}
            </div>

            {/* Controls row: visualizer + transport */}
            <div>
              {/* Canvas Visualizer */}
              <div className="mb-4 rounded overflow-hidden bg-secondary/30">
                <canvas ref={canvasRef} className="w-full h-[120px] block" />
              </div>

              {/* FFT Spectrum Analyser – A/B overlay */}
              <SpectrumAnalyser
                analyserBefore={engine.analyserBefore}
                analyserAfter={engine.analyserAfter}
                activeTrack={engine.activeTrack}
                className="mb-4"
              />

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
                  disabled={engine.status === 'switching'}
                  className="h-11 w-11 min-h-[44px] min-w-[44px] rounded bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white transition-all hover:scale-105 active:scale-95 glow-accent-strong flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
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
          </div>
        </div>

        {/* Metadata Strip */}
        {(track.genre || track.equipment) && (
          <div className="px-8 md:px-10 py-3 flex gap-2 flex-wrap bg-secondary/20">
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
      </div>
    </section>
  )
}
