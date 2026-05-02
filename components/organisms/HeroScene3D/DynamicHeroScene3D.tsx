'use client'

import dynamic from 'next/dynamic'

/**
 * Client-side dynamic wrapper for HeroScene3D.
 * `ssr: false` must be called from a Client Component in Next.js 15.
 */
const HeroScene3D = dynamic(
  () => import('./index').then((m) => ({ default: m.HeroScene3D })),
  { ssr: false },
)

export { HeroScene3D as DynamicHeroScene3D }
