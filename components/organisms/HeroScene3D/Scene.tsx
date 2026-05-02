'use client'

import { Suspense } from 'react'
import { PerspectiveCamera } from '@react-three/drei'
import { Lights } from './Lights'
import { Model } from './Model'
import { PostFX } from './PostFX'
import type { HeroSceneConfig } from '@/types/scene'

interface SceneProps {
  config: HeroSceneConfig
}

/** Inner canvas content. Separated from the Canvas wrapper so R3F hooks work correctly. */
export function Scene({ config }: SceneProps): JSX.Element {
  return (
    <>
      <PerspectiveCamera makeDefault fov={config.fov} position={[0, 0, 5]} near={0.1} far={100} />
      <Lights />
      <Suspense fallback={null}>
        <Model config={config} />
      </Suspense>
      <PostFX />
    </>
  )
}
