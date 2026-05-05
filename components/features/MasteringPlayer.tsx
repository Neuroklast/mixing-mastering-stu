'use client'

import { useState, useRef } from 'react'
import { Play, Pause } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import { SpectrumAnalyser } from '@/components/features/SpectrumAnalyser'
import { MultibandMeter } from '@/components/features/MultibandMeter'
import { showcaseTrackSchema, type ShowcaseTrack } from '@/lib/schemas/showcase'
import { IOS_AUDIO_HINT_KEY } from '@/lib/site'
import { cn } from '@/lib/utils'

interface MasteringPlayerProps {
  track: ShowcaseTrack
  /** Full playlist — enables the track-selector dropdown */
  tracks?: ShowcaseTrack[]
  /** Called when the user picks a different track from the dropdown */
  onSelectTrack?: (index: number) => void
  /** Display index of the current track (0-based) */
  currentTrackIndex?: number
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
    <div className="w-full bg-surface/80 border border-white/10 rounded overflow-hidden">
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
    <div className="bg-surface/80 border border-white/10 rounded p-8 text-center">
      <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">
        {message ?? 'Audio error'}
      </p>
    </div>
  </section>
)

export const MasteringPlayer = ({
  track,
  tracks,
  onSelectTrack,
  currentTrackIndex,
}: MasteringPlayerProps): JSX.Element => {
  const validation = showcaseTrackSchema.safeParse(track)

  if (!validation.success) {
    return (
      <section className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-32">
        <div className="bg-surface/80 border border-white/10 rounded p-8 text-center">
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
      tracks={tracks}
      onSelectTrack={onSelectTrack}
      currentTrackIndex={currentTrackIndex}
    />
  )
}

const MasteringPlayerInner = ({
  track,
  tracks,
  onSelectTrack,
  currentTrackIndex,
}: {
  track: ShowcaseTrack
  tracks?: ShowcaseTrack[]
  onSelectTrack?: (index: number) => void
  currentTrackIndex?: number
}): JSX.Element => {
  const engine = useAudioEngine(
    { before: { label: 'before', url: track.beforeUrl }, after: { label: 'after', url: track.afterUrl } },
    { startMarker: track.startMarker },
  )

  // Track whether we've ever been in a 'ready' state – used to distinguish the
  // initial skeleton from the in-place loading overlay on subsequent track changes.
  // This ref is written/read during render intentionally: it is a monotonic flag
  // (false → true, never back) so concurrent rendering cannot cause stale reads.
  const hasBeenReadyRef = useRef(false)
  if (engine.status === 'ready' || engine.status === 'playing' || engine.status === 'paused') {
    // eslint-disable-next-line react-hooks/refs
    hasBeenReadyRef.current = true
  }

  const [iosHintDismissed, setIosHintDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return sessionStorage.getItem(IOS_AUDIO_HINT_KEY) === '1'
  })

  const isIos =
    typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)

  const dismissIosHint = (): void => {
    sessionStorage.setItem(IOS_AUDIO_HINT_KEY, '1')
    setIosHintDismissed(true)
  }

  // Initial load: show skeleton until first metadata is ready
  // eslint-disable-next-line react-hooks/refs
  if (engine.status === 'loading' && !hasBeenReadyRef.current) return <LoadingSkeleton />
  if (engine.status === 'error') return <ErrorDisplay message={engine.errorMessage} />

  const labelBefore = track.labelBefore ?? 'DEMO'
  const labelAfter  = track.labelAfter  ?? 'FINAL'

  // LUFS matrix
  const mixLufs    = engine.lufsIntegratedBefore
  const masterLufs = engine.lufsIntegrated
  const lufsDelta  = mixLufs !== null && masterLufs !== null ? masterLufs - mixLufs : null

  const isMasterActive = engine.activeTrack === 'after'
  // Cover both "loading new URLs" and "crossfading between A/B" states so UI
  // consistently shows disabled / overlay during any non-interactive phase.
  const isBusy = engine.status === 'loading' || engine.status === 'switching'

  return (
    <section className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-32">
      {/* Section heading */}
      <div className="mb-10">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-mono uppercase inline-block">
          EXAMPLES
        </h2>
        <div className="h-0.5 w-16 bg-accent mt-2" />
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
          'relative w-full bg-surface/80 backdrop-blur-sm rounded overflow-hidden',
          'border border-white/[0.08] [border-top-color:rgba(255,255,255,0.15)]',
          'transition-shadow duration-500',
          isMasterActive && 'shadow-[0_0_40px_rgba(217,72,72,0.10)]',
        )}
      >
        {/* ── Decorative screw corners (19″ rack aesthetic) ── */}
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((pos) => (
          <span
            key={pos}
            aria-hidden="true"
            className={cn(
              'absolute w-4 h-4 z-10 pointer-events-none opacity-25',
              pos === 'top-left'     && 'top-2 left-2',
              pos === 'top-right'    && 'top-2 right-2',
              pos === 'bottom-left'  && 'bottom-2 left-2',
              pos === 'bottom-right' && 'bottom-2 right-2',
            )}
          >
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
              <circle cx="8" cy="8" r="1.5" fill="rgba(255,255,255,0.4)" />
              <line x1="8" y1="3" x2="8" y2="13" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
              <line x1="3" y1="8" x2="13" y2="8" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
            </svg>
          </span>
        ))}

        {/* Loading overlay: shown while switching tracks (not on initial load) */}
        {isBusy && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-surface/70 backdrop-blur-[2px]">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="block w-1.5 h-6 bg-accent rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent/70">
              Loading track
            </p>
          </div>
        )}

        {/* ══ TOP SECTION: Identity + A/B Toggle + Penalty Buttons ══ */}
        <div className="px-6 md:px-8 pt-6 pb-4 border-b border-white/[0.08]">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">

            {/* Left – Track selector dropdown (multiple tracks) or static title (single) */}
            <div className="min-w-0 flex-1">
              {tracks && tracks.length > 1 && onSelectTrack ? (
                <Select
                  value={String(currentTrackIndex ?? 0)}
                  onValueChange={(val: string) => onSelectTrack(Number(val))}
                >
                  <SelectTrigger
                    className={cn(
                      'w-full max-w-xs h-auto py-1.5 px-0 border-0 border-b border-white/20',
                      'bg-transparent rounded-none shadow-none',
                      'hover:border-white/40 focus:ring-0 focus:ring-offset-0',
                      'font-heading text-base font-bold tracking-tight text-foreground',
                      '[&>span]:line-clamp-1 [&_svg]:hidden',
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <SelectValue />
                      <span className="shrink-0 text-muted-foreground/60">
                        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                          <path d="M4 6l4-4 4 4H4zm0 4l4 4 4-4H4z" />
                        </svg>
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent
                    className={cn(
                      'bg-surface/95 backdrop-blur-md border-white/[0.12]',
                      'text-foreground min-w-[280px]',
                    )}
                  >
                    {tracks.map((t, i) => (
                      <SelectItem
                        key={i}
                        value={String(i)}
                        className={cn(
                          'font-mono text-xs uppercase tracking-wide cursor-pointer',
                          'focus:bg-accent/20 focus:text-accent',
                          'data-[state=checked]:text-accent',
                        )}
                      >
                        <span className="font-bold">{t.title}</span>
                        {t.artist && (
                          <span className="ml-2 text-muted-foreground font-normal normal-case">
                            — {t.artist}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-baseline gap-2">
                  <h3 className="text-base font-bold tracking-tight font-heading truncate">{track.title}</h3>
                </div>
              )}
              {track.artist && (
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mt-0.5 truncate">
                  {track.artist}
                </p>
              )}
            </div>

            {/* Centre – A/B toggle */}
            <div className="flex gap-2 flex-shrink-0">
              <TooltipProvider>
                {(['before', 'after'] as const).map((t) => (
                  <Tooltip key={t}>
                    <TooltipTrigger asChild>
                      {/* Wrap in a span so pointer events reach the tooltip even
                          when the inner button is disabled (disabled elements
                          suppress pointer events and break Radix tooltips). */}
                      <span className="inline-flex">
                        <button
                          onClick={() => engine.switchTrack(t)}
                          disabled={isBusy}
                          aria-pressed={engine.activeTrack === t}
                          className={cn(
                            'px-5 py-2 min-h-[44px] rounded font-mono text-sm font-bold uppercase tracking-wider border-2 transition-all duration-200',
                            engine.activeTrack === t
                              ? 'bg-accent/20 border-accent text-accent glow-accent-strong'
                              : 'bg-transparent border-white/20 text-white/40 hover:border-white/40 hover:text-white/70',
                            isBusy && 'opacity-50 cursor-not-allowed',
                          )}
                        >
                          {t === 'before' ? labelBefore : labelAfter}
                        </button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {t === 'before' ? 'Listen to the unprocessed mix' : 'Listen to the mastered version'}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
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
                <span className="text-accent">
                  {lufsDelta > 0 ? '+' : ''}{lufsDelta.toFixed(1)} dB
                </span>
              </span>
            )}
            {engine.lufsShortTerm !== null && (
              <span className="text-muted-foreground uppercase tracking-wider">
                S-TERM:{' '}
                <span className="text-white/70">{engine.lufsShortTerm.toFixed(1)} LUFS</span>
              </span>
            )}
          </div>

          {/* Transport: Play/Pause + Progress Bar + Time */}
          <div className="flex items-center gap-3">
            <TooltipProvider>

            {/* Play / Pause */}
            <Tooltip>
              <TooltipTrigger asChild>
                {/* Span wrapper keeps tooltip active even when the button is disabled */}
                <span className="inline-flex">
                  <Button
                    size="icon"
                    onClick={engine.isPlaying ? engine.pause : engine.play}
                    disabled={isBusy}
                    aria-label={engine.isPlaying ? 'Pause' : 'Play'}
                    className={cn(
                      'h-11 w-11 min-h-[44px] min-w-[44px] rounded text-white transition-all hover:scale-105 active:scale-95 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100',
                      'bg-accent hover:bg-accent/90 glow-accent-strong',
                    )}
                  >
                    {engine.isPlaying ? (
                      <Pause weight="fill" className="h-5 w-5" />
                    ) : (
                      <Play weight="fill" className="h-5 w-5 ml-0.5" />
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                {engine.isPlaying ? 'Pause playback' : 'Start playback'}
              </TooltipContent>
            </Tooltip>

            </TooltipProvider>

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
