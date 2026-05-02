'use client'

import { useRef, useEffect, useState } from 'react'
import { Question } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useSpectrumAnalyser, type ViewMode } from '@/hooks/useSpectrumAnalyser'
import { TOOLTIP_SPECTRUM_CURVE } from '@/lib/constants'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface SpectrumAnalyserProps {
  analyserBefore: AnalyserNode | null
  analyserAfter: AnalyserNode | null
  activeTrack: 'before' | 'after'
  /** When true the canvas wrapper gets a subtle red neon glow */
  isMasterActive?: boolean
  className?: string
}

export const SpectrumAnalyser = ({
  analyserBefore,
  analyserAfter,
  activeTrack,
  isMasterActive = false,
  className,
}: SpectrumAnalyserProps): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tooltipOpen, setTooltipOpen] = useState(false)

  const { viewMode, setViewMode } =
    useSpectrumAnalyser({ analyserBefore, analyserAfter, canvasRef, activeTrack })

  // DPR-correct sizing with ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const applyDpr = (): void => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.resetTransform()
      ctx.scale(dpr, dpr)
    }

    applyDpr()
    const ro = new ResizeObserver(applyDpr)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  const viewButtons: { key: ViewMode; label: string }[] = [
    { key: 'bars', label: 'Bars' },
    { key: 'curve', label: 'Curve' },
  ]

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Controls row – fixed height so canvas aligns with Phase meter */}
      <div className="h-11 flex items-center gap-3">
        {/* View selector */}
        <div
          className="flex h-full rounded overflow-hidden border border-border"
          role="group"
          aria-label="Spectrum view"
        >
          {viewButtons.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className={cn(
                'px-3 h-full font-mono text-xs uppercase tracking-wider transition-colors',
                viewMode === key
                  ? 'bg-accent text-white'
                  : 'bg-transparent text-muted-foreground hover:text-accent',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tooltip – overlays on desktop (hover) and mobile (click), never shifts layout */}
        <TooltipProvider>
          <Tooltip
            open={tooltipOpen || undefined}
            onOpenChange={(v) => { if (!v) setTooltipOpen(false) }}
          >
            <TooltipTrigger asChild>
              <button
                className="flex items-center justify-center"
                aria-label={TOOLTIP_SPECTRUM_CURVE}
                onClick={() => setTooltipOpen((v) => !v)}
              >
                <Question className="w-3.5 h-3.5 text-muted-foreground/50 cursor-help" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">{TOOLTIP_SPECTRUM_CURVE}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Canvas */}
      <div
        className={cn(
          'rounded overflow-hidden bg-secondary/30 transition-all duration-500',
          isMasterActive && 'shadow-[0_0_20px_rgba(217,72,72,0.12),inset_0_0_20px_rgba(217,72,72,0.04)]',
        )}
        style={{ transform: 'translateZ(0)', willChange: 'transform' }}
      >
        <canvas ref={canvasRef} className="w-full h-[180px] block" />
      </div>
    </div>
  )
}
