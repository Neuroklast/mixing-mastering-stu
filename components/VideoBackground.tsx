'use client'

import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'

/**
 * Scroll-synchronised video background.
 *
 * – Uses **Lenis** `onScroll` to drive video.currentTime in sync with the
 *   smooth-scroll progress of the sticky container.
 * – Respects `prefers-reduced-motion`: shows a static gradient instead of video.
 * – Displays a skeleton while the video is loading.
 */
export function VideoBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Wire Lenis scroll → video currentTime
  useEffect(() => {
    if (reducedMotion) return

    const video = videoRef.current
    const container = containerRef.current
    if (!video || !container) return

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })

    function updateVideoTime({ scroll }: { scroll: number }) {
      if (!video || !container || !video.duration) return

      const rect = container.getBoundingClientRect()
      const viewportH = window.innerHeight
      // total scrollable distance of the sticky section
      const totalScrollDist = viewportH + rect.height
      const scrolled = viewportH - rect.top

      const progress = Math.max(0, Math.min(1, scrolled / totalScrollDist))
      const targetTime = progress * video.duration

      if (Math.abs(video.currentTime - targetTime) > 0.033) {
        video.currentTime = targetTime
      }
    }

    lenis.on('scroll', updateVideoTime)

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    const rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.off('scroll', updateVideoTime)
      lenis.destroy()
    }
  }, [reducedMotion, isVideoReady])

  if (reducedMotion) {
    return (
      <div className="relative w-full h-[300vh]">
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <div className="w-full h-full bg-gradient-to-b from-black via-[#1a0a0a] to-background opacity-60" />
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full h-[300vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        {/* Loading skeleton */}
        {!isVideoReady && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900" />
        )}

        <video
          ref={videoRef}
          src="/video/background.mp4"
          className="w-full h-full object-cover opacity-40"
          style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
          autoPlay={false}
          muted
          playsInline
          loop={false}
          preload="auto"
          onLoadedData={() => setIsVideoReady(true)}
        />

        {/* Gradient fade to page background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />
      </div>
    </div>
  )
}
