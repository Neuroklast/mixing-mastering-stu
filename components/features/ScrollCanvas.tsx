'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'

// ── Constants ──────────────────────────────────────────────────────────────────
const FRAME_COUNT = 182
const FRAME_BASE = '/video/frames/ezgif-frame-'
const PRELOAD_BATCH_SIZE = 8

const frameUrl = (n: number): string =>
  `${FRAME_BASE}${String(n).padStart(3, '0')}.png`

// ── Module-level cache ─────────────────────────────────────────────────────────
// Lives outside the component so it persists across remounts and HMR cycles.
const frameCache = new Map<number, HTMLImageElement>()

function loadFrame(n: number): Promise<HTMLImageElement> {
  const hit = frameCache.get(n)
  if (hit) return Promise.resolve(hit)
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => { frameCache.set(n, img); resolve(img) }
    img.onerror = () => reject(new Error(`Frame ${n} failed to load`))
    img.src = frameUrl(n)
  })
}

async function preloadFrames(
  from: number,
  to: number,
  batchSize: number,
  onFirstBatch?: () => void,
): Promise<void> {
  for (let i = from; i <= to; i += batchSize) {
    const end = Math.min(i + batchSize - 1, to)
    await Promise.allSettled(
      Array.from({ length: end - i + 1 }, (_, j) => loadFrame(i + j)),
    )
    if (i === from) onFirstBatch?.()
  }
}

// ── Drawing helpers ────────────────────────────────────────────────────────────

/** Draw an image onto the canvas using object-fit: cover semantics. */
function drawFrameCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
): void {
  const { width: cw, height: ch } = ctx.canvas
  const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
  const sw = img.naturalWidth * scale
  const sh = img.naturalHeight * scale
  ctx.drawImage(img, (cw - sw) / 2, (ch - sh) / 2, sw, sh)
}

/** Map a [0, 1] scroll-progress to a 1-based frame index. */
function progressToFrame(progress: number): number {
  return Math.max(1, Math.min(FRAME_COUNT, Math.round(progress * (FRAME_COUNT - 1)) + 1))
}

/** Compute [0, 1] scroll progress of a container element. */
function buildScrollProgress(container: HTMLElement): number {
  const rect = container.getBoundingClientRect()
  const total = window.innerHeight + rect.height
  const scrolled = window.innerHeight - rect.top
  return Math.max(0, Math.min(1, scrolled / total))
}

// ── prefers-reduced-motion hook ────────────────────────────────────────────────
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent): void => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

// ── Fallback / skeleton UI ─────────────────────────────────────────────────────
const StaticGradientFallback = (): JSX.Element => (
  <div className="relative w-full h-[300vh]">
    <div className="sticky top-0 h-screen w-full overflow-hidden">
      <div className="w-full h-full bg-gradient-to-b from-black via-[#1a0808] to-background opacity-60" />
    </div>
  </div>
)

const CanvasSkeleton = (): JSX.Element => (
  <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900" />
)

// ── ScrollCanvas ───────────────────────────────────────────────────────────────
export const ScrollCanvas = (): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const pendingRaf   = useRef(false)
  const lastFrame    = useRef(-1)
  const [ready, setReady] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  // ── Canvas sizing: DPR-aware, always fills the viewport (mobile-safe) ────────
  const syncCanvasSize = useCallback((): void => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const w   = window.innerWidth
    const h   = window.innerHeight
    canvas.width  = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)

    // Redraw the current frame after resize so there is no blank flash
    const frame = lastFrame.current
    if (frame > 0) {
      const img = frameCache.get(frame)
      const ctx = canvas.getContext('2d')
      if (img && ctx) drawFrameCover(ctx, img)
    }
  }, [])

  useEffect(() => {
    syncCanvasSize()
    const ro = new ResizeObserver(syncCanvasSize)
    ro.observe(document.documentElement)
    return () => ro.disconnect()
  }, [syncCanvasSize])

  // ── Batch-preload all frames ─────────────────────────────────────────────────
  useEffect(() => {
    if (prefersReducedMotion) return
    preloadFrames(1, FRAME_COUNT, PRELOAD_BATCH_SIZE, () => setReady(true))
  }, [prefersReducedMotion])

  // ── Draw a specific frame onto the canvas ────────────────────────────────────
  const drawFrame = useCallback((frameIndex: number): void => {
    const canvas = canvasRef.current
    const img    = frameCache.get(frameIndex)
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawFrameCover(ctx, img)
    lastFrame.current = frameIndex
  }, [])

  // ── Lenis smooth-scroll driver ───────────────────────────────────────────────
  useEffect(() => {
    if (prefersReducedMotion || !ready) return
    const container = containerRef.current
    if (!container) return

    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.5,
    })

    const onScroll = (): void => {
      if (pendingRaf.current) return
      pendingRaf.current = true
      requestAnimationFrame(() => {
        pendingRaf.current = false
        const progress = buildScrollProgress(container)
        const frameIndex = progressToFrame(progress)
        if (frameIndex !== lastFrame.current) drawFrame(frameIndex)
      })
    }

    lenis.on('scroll', onScroll)
    drawFrame(1)

    let rafId: number
    const tick = (time: number): void => {
      lenis.raf(time)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.off('scroll', onScroll)
      lenis.destroy()
    }
  }, [prefersReducedMotion, ready, drawFrame])

  if (prefersReducedMotion) return <StaticGradientFallback />

  return (
    <div ref={containerRef} className="relative w-full h-[300vh]">
      {/*
       * sticky wrapper – full viewport, no horizontal overflow.
       * `width: 100vw; left: 0` ensures it always spans edge-to-edge on mobile
       * even when a parent has padding or a scroll-container offset.
       */}
      <div
        className="sticky top-0 h-screen bg-black overflow-hidden"
        style={{ width: '100vw', left: 0 }}
      >
        {!ready && <CanvasSkeleton />}
        {/*
         * The canvas backing store is sized in physical pixels (DPR-aware).
         * CSS width/height pin it to the full viewport so it is always
         * edge-to-edge on every device – including mobile.
         */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100vw',
            height: '100vh',
            opacity: ready ? 0.5 : 0,
            transform: 'translateZ(0)',
            willChange: 'transform',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />
      </div>
    </div>
  )
}
