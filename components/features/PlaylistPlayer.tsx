'use client'

import { useState, useCallback, useRef } from 'react'
import { MasteringPlayer } from '@/components/features/MasteringPlayer'
import type { ShowcaseTrack } from '@/lib/schemas/showcase'

interface PlaylistPlayerProps {
  tracks: ShowcaseTrack[]
}

const FADE_MS = 150

/**
 * Manages playlist state for a list of showcase tracks.
 * Wraps MasteringPlayer with Previous / Next navigation and a CSS fade
 * on track change.  The audio engine handles the actual URL switch in the
 * background — the player never fully remounts, giving a seamless UX.
 */
export const PlaylistPlayer = ({ tracks }: PlaylistPlayerProps): JSX.Element | null => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const navigate = useCallback(
    (delta: number): void => {
      if (transitioning) return

      setTransitioning(true)

      transitionTimerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + delta + tracks.length) % tracks.length)
        requestAnimationFrame(() => setTransitioning(false))
      }, FADE_MS)
    },
    [transitioning, tracks.length],
  )

  const handlePrev = useCallback(() => navigate(-1), [navigate])
  const handleNext = useCallback(() => navigate(1), [navigate])

  const currentTrack = tracks[currentIndex]
  if (!currentTrack) return null

  const hasMultiple = tracks.length > 1

  return (
    <div
      className="transition-opacity"
      style={{
        opacity: transitioning ? 0 : 1,
        transitionDuration: `${FADE_MS}ms`,
      }}
    >
      <MasteringPlayer
        track={currentTrack}
        currentTrackIndex={currentIndex}
        totalTracks={tracks.length}
        onPrev={hasMultiple ? handlePrev : undefined}
        onNext={hasMultiple ? handleNext : undefined}
      />
    </div>
  )
}
