import { useEffect, useRef, useState } from 'react'
import videoSrc from '@/assets/video/grok-video-33b51fe3-f265-45c6-a316-fd7c52d3d7b5.mp4'

export function ScrollVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const lastScrollTimeRef = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    const container = containerRef.current
    if (!video || !container) return

    const updateVideoTime = () => {
      if (!video || !container || !video.duration) {
        ticking.current = false
        return
      }

      const rect = container.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const totalScrollDistance = viewportHeight + rect.height
      const scrolledDistance = viewportHeight - rect.top
      
      const scrollProgress = Math.max(0, Math.min(1, scrolledDistance / totalScrollDistance))
      const targetTime = scrollProgress * video.duration

      const currentDiff = Math.abs(video.currentTime - targetTime)
      if (currentDiff > 0.033) {
        video.currentTime = targetTime
      }

      ticking.current = false
    }

    const handleScroll = () => {
      const now = performance.now()
      lastScrollTimeRef.current = now

      if (!ticking.current) {
        ticking.current = true
        requestAnimationFrame(updateVideoTime)
      }
    }

    const onVideoLoad = () => {
      video.pause()
      setIsVideoReady(true)
      updateVideoTime()
    }

    video.addEventListener('loadedmetadata', onVideoLoad)
    video.addEventListener('loadeddata', onVideoLoad)
    
    if (video.readyState >= 2) {
      onVideoLoad()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    if (isVideoReady) {
      handleScroll()
    }

    return () => {
      video.removeEventListener('loadedmetadata', onVideoLoad)
      video.removeEventListener('loadeddata', onVideoLoad)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isVideoReady])

  return (
    <div ref={containerRef} className="relative w-full h-[300vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-cover will-change-auto"
          muted
          playsInline
          preload="auto"
          style={{ 
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />
      </div>
    </div>
  )
}
