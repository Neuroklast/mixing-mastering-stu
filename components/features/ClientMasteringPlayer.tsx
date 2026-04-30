'use client'

import dynamic from 'next/dynamic'
import type { ShowcaseTrack } from '@/lib/schemas/showcase'

const MasteringPlayerLazy = dynamic(
  () =>
    import('@/components/features/MasteringPlayer').then((m) => ({ default: m.MasteringPlayer })),
  { ssr: false },
)

interface ClientMasteringPlayerProps {
  track: ShowcaseTrack
}

export const ClientMasteringPlayer = ({ track }: ClientMasteringPlayerProps): JSX.Element => (
  <MasteringPlayerLazy track={track} />
)
