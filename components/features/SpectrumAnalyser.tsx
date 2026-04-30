'use client'

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useSpectrumAnalyser, type ViewMode } from '@/hooks/useSpectrumAnalyser'

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
