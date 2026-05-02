'use client'

import { useState, useRef } from 'react'
import { Play, Pause, SkipBack, SkipForward } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import { SpectrumAnalyser } from '@/components/features/SpectrumAnalyser'
import { MultibandMeter } from '@/components/features/MultibandMeter'
import { showcaseTrackSchema, type ShowcaseTrack } from '@/lib/schemas/showcase'
import { cn } from '@/lib/utils'

interface MasteringPlayerProps {
  track: ShowcaseTrack
  /** Playlist navigation — provided by PlaylistPlayer when there are multiple tracks */
  onPrev?: () => void
  onNext?: () => void
  /** Display hints for the track counter (e.g. 1/3) */
  currentTrackIndex?: number
  totalTracks?: number
}

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(Math.floor(totalSeconds % 60)).padStart(2, '0')
  return `${minutes}:${seconds}`
}

const formatLufs = (v: number | null): string =>
  v !== null ? `${v.toFixed(1)}` : '---'

const LoadingSkeleton = (): JSX.Element => (
  <section className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-32">
    <div className="w-full bg-zinc-950/80 border border-white/10 rounded overflow-hidden">
      <div className="p-8 md:p-10">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-secondary/50 rounded w-1/3" />
          <div className="h-[180px] bg-secondary/30 rounded" />
          <div className="h-12 bg-secondary/30 rounded" />
        </div>
      </div>
    </div>
  </section>
)

const ErrorDisplay = ({ message }: { message: string | null }): JSX.Element => (
  <section className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-32">
    <div className="bg-zinc-950/80 border border-white/10 rounded p-8 text-center">
      <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">
        {message ?? 'Audio error'}
      </p>
    </div>
  </section>
)

export const MasteringPlayer = ({
  track,
  onPrev,
  onNext,
  currentTrackIndex,
  totalTracks,
}: MasteringPlayerProps): JSX.Element => {
  const validation = showcaseTrackSchema.safeParse(track)

  if (!validation.success) {
    return (
      <section className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-32">
        <div className="bg-zinc-950/80 border border-white/10 rounded p-8 text-center">
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">
            Invalid track data
          </p>
        </div>
      </section>
    )
  }

  const validTrack = validation.data
  return (
    <MasteringPlayerInner
      track={validTrack}
      onPrev={onPrev}
      onNext={onNext}
      currentTrackIndex={currentTrackIndex}
      totalTracks={totalTracks}
    />
  )
}

const MasteringPlayerInner = ({
  track,
  onPrev,
  onNext,
  currentTrackIndex,
  totalTracks,
}: {
  track: ShowcaseTrack
  onPrev?: () => void
  onNext?: () => void
  currentTrackIndex?: number
  totalTracks?: number
}): JSX.Element => {
  const engine = useAudioEngine(
    { before: { label: 'before', url: track.beforeUrl }, after: { label: 'after', url: track.afterUrl } },
    { startMarker: track.startMarker },
  )

  // Track whether we've ever been in a 'ready' state – used to distinguish the
  // initial skeleton from the in-place loading overlay on subsequent track changes.
  const hasBeenReadyRef = useRef(false)
  if (engine.status === 'ready' || engine.status === 'playing' || engine.status === 'paused') {
    hasBeenReadyRef.current = true
  }

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

  // Initial load: show skeleton until first metadata is ready
  if (engine.status === 'loading' && !hasBeenReadyRef.current) return <LoadingSkeleton />
  if (engine.status === 'error') return <ErrorDisplay message={engine.errorMessage} />

  const labelBefore = track.labelBefore ?? 'DEMO'
  const labelAfter  = track.labelAfter  ?? 'FINAL'

  // LUFS matrix
  const mixLufs    = engine.lufsIntegratedBefore
  const masterLufs = engine.lufsIntegrated
  const lufsDelta  = mixLufs !== null && masterLufs !== null ? masterLufs - mixLufs : null

  const isMasterActive = engine.activeTrack === 'after'
  const isSwitching = engine.status === 'loading'

  return (
    <section className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-32">
      {/* Section heading */}
      <div className="mb-10">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-mono uppercase inline-block">
          EXAMPLE SOUNDS
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

      {/* ── Rack Unit Container ── */}
      <div
        className={cn(
          'relative w-full bg-zinc-950/80 backdrop-blur-sm rounded overflow-hidden',
          'border border-white/[0.08] [border-top-color:rgba(255,255,255,0.15)]',
          'transition-shadow duration-500',
          isMasterActive && 'shadow-[0_0_40px_rgba(74,222,128,0.08)]',
        )}
      >
        {/* Loading overlay: shown while switching tracks (not on initial load) */}
        {isSwitching && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-zinc-950/70 backdrop-blur-[2px]">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="block w-1.5 h-6 bg-[var(--color-accent)] rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-accent)]/70">
              Loading track
            </p>
          </div>
        )}

        {/* ══ TOP SECTION: Identity + A/B Toggle + Penalty Buttons ══ */}
        <div className="px-6 md:px-8 pt-6 pb-4 border-b border-white/[0.08]">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">

            {/* Left – Track identity */}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <h3 className="text-base font-bold tracking-tight font-heading truncate">{track.title}</h3>
                {totalTracks !== undefined && totalTracks > 1 && (
                  <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
                    {(currentTrackIndex ?? 0) + 1}/{totalTracks}
                  </span>
                )}
              </div>
              {track.artist && (
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mt-0.5 truncate">
                  {track.artist}
                </p>
              )}
            </div>

            {/* Centre – A/B toggle */}
            <div className="flex gap-2 flex-shrink-0">
              {(['before', 'after'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => engine.switchTrack(t)}
                  disabled={engine.status === 'switching'}
                  className={cn(
                    'px-5 py-2 min-h-[40px] rounded font-mono text-sm font-bold uppercase tracking-wider border-2 transition-all duration-200',
                    engine.activeTrack === t
                      ? t === 'after'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_16px_rgba(74,222,128,0.4)]'
                        : 'bg-[var(--color-accent)]/20 border-[var(--color-accent)] text-[var(--color-accent)] glow-accent-strong'
                      : 'bg-transparent border-white/20 text-white/40 hover:border-white/40 hover:text-white/70',
                    engine.status === 'switching' && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  {t === 'before' ? labelBefore : labelAfter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ══ MIDDLE SECTION: Spectrum Analyser + Multiband Meter ══ */}
        <div className="px-6 md:px-8 pt-4 pb-3">
          <div className="flex gap-3">

            {/* Spectrum analyser – takes most of the width */}
            <div className="flex-1 min-w-0">
              <SpectrumAnalyser
                analyserBefore={engine.analyserBefore}
                analyserAfter={engine.analyserAfter}
                activeTrack={engine.activeTrack}
                isMasterActive={isMasterActive}
              />
            </div>

            {/* Multiband correlation meter – right sidebar */}
            <MultibandMeter
              correlation={engine.multibandCorrelation}
              className="w-20 flex-shrink-0"
            />
          </div>
        </div>

        {/* ══ BOTTOM SECTION: LUFS Matrix + Transport + Badges ══ */}
        <div className="px-6 md:px-8 pb-6">

          {/* LUFS readout matrix */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 mb-4 font-mono text-xs">
            <span className="text-muted-foreground uppercase tracking-wider">
              Demo:{' '}
              <span className="text-white/70">{formatLufs(mixLufs)} LUFS</span>
            </span>
            <span className="text-muted-foreground uppercase tracking-wider">
              Final:{' '}
              <span className="text-white/70">{formatLufs(masterLufs)} LUFS</span>
            </span>
            {lufsDelta !== null && (
              <span className="text-muted-foreground uppercase tracking-wider">
                Δ:{' '}
                <span className={cn(lufsDelta > 0 ? 'text-emerald-400' : 'text-[var(--color-accent)]')}>
                  {lufsDelta > 0 ? '+' : ''}{lufsDelta.toFixed(1)} dB
                </span>
              </span>
            )}
            {engine.lufsShortTerm !== null && (
              <span className="text-muted-foreground uppercase tracking-wider">
                ST:{' '}
                <span className="text-white/70">{engine.lufsShortTerm.toFixed(1)} LUFS</span>
              </span>
            )}
          </div>

          {/* Transport: Prev + Play/Pause + Next + Progress Bar + Time */}
          <div className="flex items-center gap-3">
            {/* Previous button */}
            {onPrev && (
              <button
                onClick={onPrev}
                aria-label="Previous track"
                className="h-9 w-9 flex items-center justify-center rounded text-white/50 hover:text-white/90 transition-colors flex-shrink-0 hover:bg-white/5"
              >
                <SkipBack weight="fill" className="h-4 w-4" />
              </button>
            )}

            {/* Play / Pause */}
            <Button
              size="icon"
              onClick={engine.isPlaying ? engine.pause : engine.play}
              disabled={engine.status === 'switching'}
              className={cn(
                'h-11 w-11 min-h-[44px] min-w-[44px] rounded text-white transition-all hover:scale-105 active:scale-95 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100',
                isMasterActive
                  ? 'bg-emerald-500/80 hover:bg-emerald-500 shadow-[0_0_16px_rgba(74,222,128,0.4)]'
                  : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 glow-accent-strong',
              )}
            >
              {engine.isPlaying ? (
                <Pause weight="fill" className="h-5 w-5" />
              ) : (
                <Play weight="fill" className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            {/* Next button */}
            {onNext && (
              <button
                onClick={onNext}
                aria-label="Next track"
                className="h-9 w-9 flex items-center justify-center rounded text-white/50 hover:text-white/90 transition-colors flex-shrink-0 hover:bg-white/5"
              >
                <SkipForward weight="fill" className="h-4 w-4" />
              </button>
            )}

            <div className="flex-1 space-y-1.5">
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
    </section>
  )
}
