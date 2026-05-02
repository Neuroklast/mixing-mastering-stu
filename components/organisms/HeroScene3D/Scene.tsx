'use client'

import { useEffect, Suspense } from 'react'
import { useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { Lights } from './Lights'
import { Model } from './Model'
import { PostFX } from './PostFX'
import { useScrollInvalidateRef } from '@/contexts/ScrollProgressContext'
import type { HeroSceneConfig } from '@/types/scene'

interface SceneProps {
  config: HeroSceneConfig
}

/**
 * Registers the R3F `invalidate` callback with the scroll-progress context so
 * that scrolling triggers a new frame even when `frameloop="demand"` is active.
 */
function InvalidateOnScroll(): null {
  const { invalidate } = useThree()
  const invalidateRef  = useScrollInvalidateRef()

  useEffect(() => {
    invalidateRef.current = invalidate
    return () => { invalidateRef.current = null }
  }, [invalidate, invalidateRef])

  return null
}

/** Inner canvas content. Separated from the Canvas wrapper so R3F hooks work correctly. */
export function Scene({ config }: SceneProps): JSX.Element {
  return (
    <>
      <InvalidateOnScroll />
      <PerspectiveCamera makeDefault fov={config.fov} position={[0, 0, 5]} near={0.1} far={20} />
      <Lights />
      <Suspense fallback={null}>
        <Model config={config} />
      </Suspense>
      <PostFX />
    </>
  )
}
