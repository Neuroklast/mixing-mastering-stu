'use client'

import { useScrollProgressRef } from '@/contexts/ScrollProgressContext'
import type { HeroSceneConfig } from '@/types/scene'

/**
 * Derives target X/Y rotation (in radians) for the 3D hero model
 * based on the current page scroll progress.
 *
 * Returns a stable callback (no re-renders) suitable for use inside useFrame.
 */
export function use3DScroll(config: Pick<HeroSceneConfig, 'maxTiltRad'>): {
  getTargetRotation: () => { x: number; y: number }
} {
  const progressRef = useScrollProgressRef()
  const { maxTiltRad } = config

  const getTargetRotation = (): { x: number; y: number } => {
    const sp = progressRef.current
    return {
      x: (sp - 0.5) * maxTiltRad * 2,   // -maxTiltRad → +maxTiltRad
      y: sp * maxTiltRad * 1.6 - maxTiltRad * 0.8,
    }
  }

  return { getTargetRotation }
}
