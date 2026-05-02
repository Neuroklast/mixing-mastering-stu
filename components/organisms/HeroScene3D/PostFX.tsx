'use client'

import { useMemo } from 'react'
import { EffectComposer, DepthOfField, Bloom } from '@react-three/postprocessing'

/**
 * Post-processing pass: Depth of Field + subtle Bloom.
 * DoF keeps the model in focus while edges bleed into bokeh, separating
 * the 3D background from foreground text.
 * Bloom fires only on bright red hotspots (luminanceThreshold 0.8).
 * On mobile devices DoF is skipped to preserve frame rate.
 */
export function PostFX(): JSX.Element {
  const isMobile = useMemo(
    () => typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent),
    [],
  )

  if (isMobile) {
    return (
      <EffectComposer>
        <Bloom intensity={0.3} luminanceThreshold={0.9} luminanceSmoothing={0.9} />
      </EffectComposer>
    )
  }

  return (
    <EffectComposer>
      <DepthOfField focusDistance={0} focalLength={0.05} bokehScale={3} height={480} />
      <Bloom intensity={0.5} luminanceThreshold={0.8} luminanceSmoothing={0.9} />
    </EffectComposer>
  )
}
