'use client'

import dynamic from 'next/dynamic'
import type { ShowcaseTrack } from '@/lib/schemas/showcase'

const PlaylistPlayerLazy = dynamic(
  () =>
    import('@/components/features/PlaylistPlayer').then((m) => ({ default: m.PlaylistPlayer })),
  { ssr: false },
)

interface ClientMasteringPlayerProps {
  tracks: ShowcaseTrack[]
}

export const ClientMasteringPlayer = ({ tracks }: ClientMasteringPlayerProps): JSX.Element => (
  <PlaylistPlayerLazy tracks={tracks} />
)
