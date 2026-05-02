'use client'

import { EffectComposer, DepthOfField, Bloom } from '@react-three/postprocessing'

/**
 * Post-processing pass: Depth of Field + subtle Bloom.
 * DoF keeps the model in focus while edges bleed into bokeh, separating
 * the 3D background from foreground text.
 * Bloom fires only on bright red hotspots (luminanceThreshold 0.8).
 */
export function PostFX(): JSX.Element {
  return (
    <EffectComposer>
      <DepthOfField focusDistance={0} focalLength={0.05} bokehScale={3} height={480} />
      <Bloom intensity={0.5} luminanceThreshold={0.8} luminanceSmoothing={0.9} />
    </EffectComposer>
  )
}
