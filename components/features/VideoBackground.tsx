'use client'

import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'

const buildScrollProgress = (container: HTMLDivElement): number => {
  const rect = container.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const totalScrollDistance = viewportHeight + rect.height
  const scrolledDistance = viewportHeight - rect.top
  return Math.max(0, Math.min(1, scrolledDistance / totalScrollDistance))
}

const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    const handler = (event: MediaQueryListEvent): void => setPrefersReducedMotion(event.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return prefersReducedMotion
}

const StaticGradientFallback = (): JSX.Element => (
  <div className="relative w-full h-[300vh]">
    <div className="sticky top-0 h-screen w-full overflow-hidden">
      <div className="w-full h-full bg-gradient-to-b from-black via-[#1a0808] to-background opacity-60" />
    </div>
  </div>
)

const VideoSkeleton = (): JSX.Element => (
  <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900" />
)

export const VideoBackground = (): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const pendingRafRef = useRef<boolean>(false)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) return

    const video = videoRef.current
    const container = containerRef.current
    if (!video || !container) return

    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.5,
    })

    const syncVideoToScroll = (): void => {
      if (!video.duration) return
      if (pendingRafRef.current) return
      pendingRafRef.current = true
      requestAnimationFrame(() => {
        pendingRafRef.current = false
        if (!video.duration) return
        const scrollProgress = buildScrollProgress(container)
        const targetTime = scrollProgress * video.duration
        if (Math.abs(video.currentTime - targetTime) > 0.033) {
          video.currentTime = targetTime
        }
      })
    }

    lenis.on('scroll', syncVideoToScroll)

    let rafId: number
    const tick = (time: number): void => {
      lenis.raf(time)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.off('scroll', syncVideoToScroll)
      lenis.destroy()
    }
  }, [prefersReducedMotion, isVideoReady])

  if (prefersReducedMotion) return <StaticGradientFallback />

  return (
    <div ref={containerRef} className="relative w-full h-[300vh]">
      <div
        className="sticky top-0 h-screen overflow-hidden bg-black"
        style={{ transform: 'translateZ(0)', width: '100%', left: 0, position: 'sticky' }}
      >
        {!isVideoReady && <VideoSkeleton />}
        <video
          ref={videoRef}
          src="/video/background.mp4"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          style={{ transform: 'translateZ(0)', willChange: 'transform', backfaceVisibility: 'hidden' }}
          autoPlay={false}
          muted
          playsInline
          loop={false}
          preload="auto"
          onLoadedData={() => setIsVideoReady(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />
      </div>
    </div>
  )
}
