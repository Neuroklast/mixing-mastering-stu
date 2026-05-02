'use client'

import { useRef, useEffect, useState } from 'react'
import { Question } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useSpectrumAnalyser, type ViewMode } from '@/hooks/useSpectrumAnalyser'
import { TOOLTIP_SPECTRUM_CURVE } from '@/lib/constants'

interface SpectrumAnalyserProps {
  analyserBefore: AnalyserNode | null
  analyserAfter: AnalyserNode | null
  activeTrack: 'before' | 'after'
  /** When true the canvas wrapper gets a subtle green neon glow */
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
  const [helpOpen, setHelpOpen] = useState(false)

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
      ctx?.scale(dpr, dpr)
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
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* View selector */}
        <div
          className="flex rounded overflow-hidden border border-border"
          role="group"
          aria-label="Spectrum view"
        >
          {viewButtons.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className={cn(
                'px-3 py-1 min-h-[44px] font-mono text-xs uppercase tracking-wider transition-colors',
                viewMode === key
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-transparent text-muted-foreground hover:text-[var(--color-accent)]',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Desktop tooltip (title attr) + mobile help button */}
        <span
          className="hidden md:inline-flex items-center"
          title={TOOLTIP_SPECTRUM_CURVE}
          aria-label={TOOLTIP_SPECTRUM_CURVE}
        >
          <Question className="w-3.5 h-3.5 text-muted-foreground/50 cursor-help" />
        </span>
        <button
          className="md:hidden flex items-center justify-center w-6 h-6 rounded-full border border-white/20 text-muted-foreground/50"
          aria-label="Spectrum analyser info"
          onClick={() => setHelpOpen((v) => !v)}
        >
          <Question className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mobile help panel */}
      {helpOpen && (
        <div className="md:hidden rounded border border-white/10 bg-zinc-900/80 px-3 py-2 text-[11px] font-mono text-muted-foreground leading-relaxed">
          {TOOLTIP_SPECTRUM_CURVE}
        </div>
      )}

      {/* Canvas */}
      <div
        className={cn(
          'rounded overflow-hidden bg-secondary/30 transition-all duration-500',
          isMasterActive && 'shadow-[0_0_20px_rgba(74,222,128,0.15),inset_0_0_20px_rgba(74,222,128,0.04)]',
        )}
        style={{ transform: 'translateZ(0)', willChange: 'transform' }}
      >
        <canvas ref={canvasRef} className="w-full h-[180px] block" />
      </div>
    </div>
  )
}
