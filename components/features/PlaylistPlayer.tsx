'use client'

import { useState, useCallback, useRef } from 'react'
import { MasteringPlayer } from '@/components/features/MasteringPlayer'
import type { ShowcaseTrack } from '@/lib/schemas/showcase'

interface PlaylistPlayerProps {
  tracks: ShowcaseTrack[]
}

const CROSSFADE_MS = 50

/**
 * Manages playlist state for a list of showcase tracks.
 * Wraps MasteringPlayer with Previous / Next navigation, a 50 ms CSS
 * crossfade on track change, and loop-back behaviour at list boundaries.
 */
export const PlaylistPlayer = ({ tracks }: PlaylistPlayerProps): JSX.Element | null => {
  const [currentIndex, setCurrentIndex] = useState(0)
  // Incrementing this key forces useAudioEngine to fully remount for a clean audio context
  const [engineKey, setEngineKey] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const navigate = useCallback(
    (delta: number): void => {
      if (transitioning) return

      setTransitioning(true)

      // After the CSS fade-out completes, swap the track and trigger a fade-in
      transitionTimerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => {
          const next = (prev + delta + tracks.length) % tracks.length
          return next
        })
        setEngineKey((k) => k + 1)
        // Small additional tick to allow React to paint before fading back in
        requestAnimationFrame(() => {
          setTransitioning(false)
        })
      }, CROSSFADE_MS)
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
        transitionDuration: `${CROSSFADE_MS}ms`,
      }}
    >
      <MasteringPlayer
        key={engineKey}
        track={currentTrack}
        currentTrackIndex={currentIndex}
        totalTracks={tracks.length}
        onPrev={hasMultiple ? handlePrev : undefined}
        onNext={hasMultiple ? handleNext : undefined}
      />
    </div>
  )
}
