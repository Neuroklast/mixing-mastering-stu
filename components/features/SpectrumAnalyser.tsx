'use client'

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useSpectrumAnalyser, type ViewMode, type AbMode } from '@/hooks/useSpectrumAnalyser'

interface SpectrumAnalyserProps {
  analyserBefore: AnalyserNode | null
  analyserAfter: AnalyserNode | null
  activeTrack: 'before' | 'after'
  className?: string
}

export const SpectrumAnalyser = ({
  analyserBefore,
  analyserAfter,
  activeTrack,
  className,
}: SpectrumAnalyserProps): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { viewMode, setViewMode, abMode, setAbMode, showDelta, setShowDelta } =
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

  const abButtons: { key: AbMode; label: string }[] = [
    { key: 'A', label: 'A' },
    { key: 'B', label: 'B' },
    { key: 'AB', label: 'A+B' },
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

        {/* A/B mode selector */}
        <div
          className="flex rounded overflow-hidden border border-border"
          role="group"
          aria-label="Signal selection"
        >
          {abButtons.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setAbMode(key)}
              className={cn(
                'px-3 py-1 min-h-[44px] font-mono text-xs uppercase tracking-wider transition-colors',
                abMode === key
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-transparent text-muted-foreground hover:text-[var(--color-accent)]',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Delta toggle (only meaningful in A+B mode) */}
        {abMode === 'AB' && viewMode === 'curve' && (
          <button
            onClick={() => setShowDelta(!showDelta)}
            className={cn(
              'px-3 py-1 min-h-[44px] rounded border font-mono text-xs uppercase tracking-wider transition-colors',
              showDelta
                ? 'bg-[rgba(0,255,128,0.15)] border-[rgba(0,255,128,0.5)] text-[rgba(0,255,128,1)]'
                : 'border-border text-muted-foreground hover:text-[var(--color-accent)]',
            )}
          >
            Δ Delta
          </button>
        )}
      </div>

      {/* Canvas */}
      <div
        className="rounded overflow-hidden bg-secondary/30"
        style={{ transform: 'translateZ(0)', willChange: 'transform' }}
      >
        <canvas ref={canvasRef} className="w-full h-[180px] block" />
      </div>
    </div>
  )
}
