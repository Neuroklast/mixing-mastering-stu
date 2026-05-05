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
 * Wraps MasteringPlayer with a track-selector dropdown.
 * The audio engine handles URL switching in the background — the player
 * never fully remounts, giving a seamless UX.
 */
export const PlaylistPlayer = ({ tracks }: PlaylistPlayerProps): JSX.Element | null => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectTrack = useCallback(
    (index: number): void => {
      if (transitioning || index === currentIndex) return

      setTransitioning(true)

      transitionTimerRef.current = setTimeout(() => {
        setCurrentIndex(index)
        requestAnimationFrame(() => setTransitioning(false))
      }, FADE_MS)
    },
    [transitioning, currentIndex],
  )

  const currentTrack = tracks[currentIndex]
  if (!currentTrack) return null

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
        tracks={tracks}
        currentTrackIndex={currentIndex}
        onSelectTrack={selectTrack}
      />
    </div>
  )
}
