'use client'

import { useRef, useEffect, useState } from 'react'
import { Question } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { TOOLTIP_PHASE_METER } from '@/lib/constants'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface MultibandMeterProps {
  correlation: { low: number; mid: number; high: number } | null
  className?: string
}

type CorrKey = 'low' | 'mid' | 'high'

const BANDS: { key: CorrKey; label: string }[] = [
  { key: 'low',  label: 'LOW' },
  { key: 'mid',  label: 'MID' },
  { key: 'high', label: 'HIGH' },
]

// ── Drawing ───────────────────────────────────────────────────────────────────

function drawMeter (
  canvas: HTMLCanvasElement,
  vals: { low: number; mid: number; high: number },
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const w = canvas.width  / dpr
  const h = canvas.height / dpr

  ctx.clearRect(0, 0, w, h)

  const LABEL_H = 16          // px reserved at top for band labels
  const barArea = h - LABEL_H - 4
  const gap     = 3
  const barW    = (w - gap * (BANDS.length + 1)) / BANDS.length

  BANDS.forEach(({ key, label }, i) => {
    const val = Math.max(-1, Math.min(1, vals[key]))
    const x   = gap + i * (barW + gap)

    // ── Track background ────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    ctx.fillRect(x, LABEL_H + 2, barW, barArea)

    // ── Centre line (0 = widest stereo) ─────────────────────────────────────
    const centerY = LABEL_H + 2 + barArea / 2
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, centerY)
    ctx.lineTo(x + barW, centerY)
    ctx.stroke()

    // ── Correlation bar with industrial glow ────────────────────────────────
    if (Math.abs(val) > 0.004) {
      const isPos  = val >= 0
      const barLen = Math.abs(val) * (barArea / 2)
      const barY   = isPos ? centerY - barLen : centerY

      // Glow colour: Sonorativa-red (accent) – bright for positive (in-phase), dimmer for negative
      const barColor   = isPos ? 'rgba(217,72,72,0.92)' : 'rgba(217,72,72,0.65)'
      const glowColor  = isPos ? 'rgba(217,72,72,0.75)' : 'rgba(217,72,72,0.45)'
      const glowRadius  = 4 + Math.abs(val) * 12  // stronger glow toward extremes

      ctx.save()
      ctx.shadowBlur  = glowRadius
      ctx.shadowColor = glowColor
      ctx.fillStyle   = barColor
      ctx.fillRect(x + 1, barY, barW - 2, Math.max(barLen, 1))
      ctx.restore()
    }

    // ── ±1 tick marks ────────────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, LABEL_H + 2);          ctx.lineTo(x + barW, LABEL_H + 2)
    ctx.moveTo(x, LABEL_H + 2 + barArea); ctx.lineTo(x + barW, LABEL_H + 2 + barArea)
    ctx.stroke()

    // ── Band label ───────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.42)'
    ctx.font = '6px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(label, x + barW / 2, LABEL_H - 2)
  })

  // ── Scale labels: +1 / 0 / -1 (right edge) ──────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = '7px monospace'
  ctx.textAlign = 'right'
  const rEdge = w - 1
  ctx.fillText('+1', rEdge, LABEL_H + 7)
  ctx.fillText(' 0', rEdge, LABEL_H + 2 + barArea / 2 + 3)
  ctx.fillText('-1', rEdge, LABEL_H + 2 + barArea + 7)
}

// ─────────────────────────────────────────────────────────────────────────────

export const MultibandMeter = ({ correlation, className }: MultibandMeterProps): JSX.Element => {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  // Target values (updated from prop); display values (interpolated each RAF frame)
  const targetRef  = useRef({ low: 0, mid: 0, high: 0 })
  const displayRef = useRef({ low: 0, mid: 0, high: 0 })

  // Sync incoming prop into target ref
  useEffect(() => {
    if (correlation) targetRef.current = { ...correlation }
  }, [correlation])

  // DPR-aware canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const apply = (): void => {
      const dpr  = window.devicePixelRatio || 1
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

  // RAF animation loop — interpolates display toward target each frame
  useEffect(() => {
    const INTERP = 0.12   // visual smoothing per frame (~60 fps → ~0.73 s to settle)
    let rafId: number

    const tick = (): void => {
      const d = displayRef.current
      const t = targetRef.current
      d.low  += (t.low  - d.low)  * INTERP
      d.mid  += (t.mid  - d.mid)  * INTERP
      d.high += (t.high - d.high) * INTERP

      const canvas = canvasRef.current
      if (canvas) drawMeter(canvas, d)

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])  // run once on mount

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Label + help */}
      <div className="flex items-center justify-center gap-1 mb-1">
        <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground leading-none">
          Phase
        </p>
        {/* Desktop tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="hidden md:inline-flex" aria-label={TOOLTIP_PHASE_METER}>
                <Question className="w-2.5 h-2.5 text-muted-foreground/40 cursor-help" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">{TOOLTIP_PHASE_METER}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {/* Mobile help button */}
        <button
          className="md:hidden flex items-center justify-center"
          aria-label="Phase meter info"
          onClick={() => setHelpOpen((v) => !v)}
        >
          <Question className="w-2.5 h-2.5 text-muted-foreground/40" />
        </button>
      </div>

      {/* Mobile help text */}
      {helpOpen && (
        <div className="md:hidden mb-1 rounded border border-white/10 bg-zinc-900/80 px-2 py-1.5 text-[10px] font-mono text-muted-foreground leading-relaxed">
          {TOOLTIP_PHASE_METER}
        </div>
      )}

      <div className="rounded overflow-hidden bg-secondary/30">
        <canvas ref={canvasRef} className="w-full h-[180px] block" />
      </div>
    </div>
  )
}
