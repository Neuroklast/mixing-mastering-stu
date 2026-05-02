'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'

// ── Constants ──────────────────────────────────────────────────────────────────
const PRELOAD_BATCH_SIZE = 16

// ── Module-level cache ─────────────────────────────────────────────────────────
const frameCache = new Map<number, HTMLImageElement>()

function loadFrame(n: number, urls: string[]): Promise<HTMLImageElement> {
  const url = urls[n - 1]
  if (!url) return Promise.reject(new Error(`No URL for frame ${n}`))
  const hit = frameCache.get(n)
  if (hit) return Promise.resolve(hit)
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image()
    if (n === 1) (img as any).fetchPriority = 'high'
    img.onload = () => { frameCache.set(n, img); resolve(img) }
    img.onerror = () => reject(new Error(`Frame ${n} failed to load`))
    img.src = url
  })
}

async function preloadFrames(
  from: number,
  to: number,
  batchSize: number,
  urls: string[],
  onFirstBatch?: () => void,
): Promise<void> {
  for (let i = from; i <= to; i += batchSize) {
    const end = Math.min(i + batchSize - 1, to)
    await Promise.allSettled(
      Array.from({ length: end - i + 1 }, (_, j) => loadFrame(i + j, urls)),
    )
    if (i === from) onFirstBatch?.()
  }
}

function drawFrameCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement): void {
  const { width: cw, height: ch } = ctx.canvas
  const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
  const sw = img.naturalWidth * scale
  const sh = img.naturalHeight * scale
  ctx.drawImage(img, (cw - sw) / 2, (ch - sh) / 2, sw, sh)
}

function progressToFrame(progress: number, frameCount: number): number {
  return Math.max(1, Math.min(frameCount, Math.round(progress * (frameCount - 1)) + 1))
}

function buildScrollProgress(container: HTMLElement): number {
  const rect = container.getBoundingClientRect()
  const total = window.innerHeight + rect.height
  const scrolled = window.innerHeight - rect.top
  return Math.max(0, Math.min(1, scrolled / total))
}

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

export const ScrollCanvas = (): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const pendingRaf   = useRef(false)
  const lastFrame    = useRef(-1)
  const frameUrls    = useRef<string[]>([])
  const [frameCount, setFrameCount] = useState(0)
  const [ready, setReady] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    fetch('/api/video-frames')
      .then((r) => r.json())
      .then(({ frames }: { frames: string[] }) => {
        frameUrls.current = frames
        setFrameCount(frames.length)
      })
      .catch(() => {})
  }, [])

  const syncCanvasSize = useCallback((): void => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    // Use the parent element's client dimensions — this is the actual CSS box
    // size and never exceeds the viewport, preventing overflow on mobile.
    const w = canvas.parentElement?.clientWidth ?? window.innerWidth
    const h = canvas.parentElement?.clientHeight ?? window.innerHeight
    canvas.width  = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
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

  useEffect(() => {
    if (prefersReducedMotion || frameCount === 0) return
    const urls = frameUrls.current
    loadFrame(1, urls)
      .then(() => {
        setReady(true)
        preloadFrames(2, frameCount, PRELOAD_BATCH_SIZE, urls)
      })
      .catch(() => {
        preloadFrames(1, frameCount, PRELOAD_BATCH_SIZE, urls, () => setReady(true))
      })
  }, [prefersReducedMotion, frameCount])

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
      touchMultiplier: 1.2,
    })

    const onScroll = (): void => {
      if (pendingRaf.current) return
      pendingRaf.current = true
      requestAnimationFrame(() => {
        pendingRaf.current = false
        const progress = buildScrollProgress(container)
        const frameIndex = progressToFrame(progress, frameCount)
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
  }, [prefersReducedMotion, ready, frameCount, drawFrame])

  if (prefersReducedMotion) return <StaticGradientFallback />

  return (
    <div ref={containerRef} className="relative w-full h-[300vh]">
      <div className="sticky top-0 h-screen w-full bg-black overflow-hidden">
        {!ready && <CanvasSkeleton />}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: ready ? 0.4 : 0,
            transform: 'translateZ(0)',
            willChange: 'transform',
            display: 'block',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />
      </div>
    </div>
  )
}