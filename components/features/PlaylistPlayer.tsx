'use client'

import { useState, useCallback } from 'react'
import { MasteringPlayer } from '@/components/features/MasteringPlayer'
import type { ShowcaseTrack } from '@/lib/schemas/showcase'

interface PlaylistPlayerProps {
  tracks: ShowcaseTrack[]
}

/**
 * Manages playlist state for a list of showcase tracks.
 * Wraps MasteringPlayer with a track-selector dropdown and prev/next controls.
 * The audio engine handles URL switching in the background — the player
 * never fully remounts, giving a seamless UX.
 */
export const PlaylistPlayer = ({ tracks }: PlaylistPlayerProps): JSX.Element | null => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const selectTrack = useCallback(
    (index: number): void => {
      if (index === currentIndex) return
      if (index < 0 || index >= tracks.length) return
      setCurrentIndex(index)
    },
    [currentIndex, tracks.length],
  )

  const currentTrack = tracks[currentIndex]
  if (!currentTrack) return null

  return (
    <MasteringPlayer
      track={currentTrack}
      tracks={tracks}
      currentTrackIndex={currentIndex}
      onSelectTrack={selectTrack}
    />
  )
}
