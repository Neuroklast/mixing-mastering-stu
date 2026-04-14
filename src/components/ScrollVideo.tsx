import { useEffect, useRef } from 'react'
import videoSrc from '@/assets/video/grok-video-33b51fe3-f265-45c6-a316-fd7c52d3d7b5.mp4'

export function ScrollVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const video = videoRef.current
    const container = containerRef.current
    if (!video || !container) return

    let animationFrameId: number

    const handleScroll = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }

      animationFrameId = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect()
        const scrollProgress = Math.max(0, Math.min(1, 
          (window.innerHeight - rect.top) / (window.innerHeight + rect.height)
        ))
        
        if (video.duration) {
          const targetTime = scrollProgress * video.duration
          video.currentTime = targetTime
        }
      })
    }

    const onVideoLoad = () => {
      video.pause()
      handleScroll()
    }

    video.addEventListener('loadedmetadata', onVideoLoad)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      video.removeEventListener('loadedmetadata', onVideoLoad)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative w-full h-[300vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="auto"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />
      </div>
    </div>
  )
}
