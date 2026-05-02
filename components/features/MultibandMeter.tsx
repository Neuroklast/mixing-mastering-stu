'use client'

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface MultibandMeterProps {
  correlation: { low: number; mid: number; high: number } | null
  className?: string
}

type CorrKey = 'low' | 'mid' | 'high'

const BANDS: { key: CorrKey; label: string }[] = [
  { key: 'low',  label: 'L' },
  { key: 'mid',  label: 'M' },
  { key: 'high', label: 'H' },
]

// Map a correlation value [-1, +1] to a CSS hsl color
function corrColor(val: number): string {
  if (val > 0.6) return 'hsl(140,70%,50%)'  // green – good correlation
  if (val > 0.2) return 'hsl(55,85%,55%)'   // yellow – moderate
  if (val > -0.2) return 'hsl(30,90%,55%)'  // orange – wide
  return 'hsl(0,75%,55%)'                    // red – phase danger
}

export const MultibandMeter = ({ correlation, className }: MultibandMeterProps): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // DPR-aware sizing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const apply = (): void => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      canvas.width  = rect.width  * dpr
      canvas.height = rect.height * dpr
      const ctx = canvas.getContext('2d')
      ctx?.scale(dpr, dpr)
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  // Redraw whenever correlation changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.width  / dpr
    const h = canvas.height / dpr

    ctx.clearRect(0, 0, w, h)

    const LABEL_H  = 14
    const barArea  = h - LABEL_H - 2
    const gap      = 3
    const barW     = (w - gap * (BANDS.length + 1)) / BANDS.length

    BANDS.forEach(({ key, label }, i) => {
      const val = Math.max(-1, Math.min(1, (correlation ?? {})[key] ?? 0))
      const x   = gap + i * (barW + gap)

      // Track background
      ctx.fillStyle = 'rgba(255,255,255,0.05)'
      ctx.fillRect(x, LABEL_H + 1, barW, barArea)

      // Centre line (0 = stereo/wide)
      const centerY = LABEL_H + 1 + barArea / 2
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, centerY)
      ctx.lineTo(x + barW, centerY)
      ctx.stroke()

      // Correlation bar (from centre upward for positive, downward for negative)
      const barLen = Math.abs(val) * (barArea / 2)
      const barY   = val >= 0 ? centerY - barLen : centerY
      ctx.fillStyle = corrColor(val)
      ctx.fillRect(x + 1, barY, barW - 2, barLen || 1)

      // ±1 tick marks at top and bottom of the bar track
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, LABEL_H + 2)
      ctx.lineTo(x + barW, LABEL_H + 2)
      ctx.moveTo(x, LABEL_H + 1 + barArea)
      ctx.lineTo(x + barW, LABEL_H + 1 + barArea)
      ctx.stroke()

      // Band label
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = '8px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(label, x + barW / 2, LABEL_H - 2)
    })

    // Scale labels (+1, 0, -1) on the right edge
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.font = '7px monospace'
    ctx.textAlign = 'right'
    const rEdge = w - 1
    ctx.fillText('+1', rEdge, LABEL_H + 5)
    ctx.fillText(' 0', rEdge, LABEL_H + 1 + barArea / 2 + 3)
    ctx.fillText('-1', rEdge, LABEL_H + 1 + barArea + 5)
  }, [correlation])

  return (
    <div className={cn('flex flex-col', className)}>
      <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1 text-center leading-none">
        Phase
      </p>
      <div className="flex-1 min-h-0">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  )
}
