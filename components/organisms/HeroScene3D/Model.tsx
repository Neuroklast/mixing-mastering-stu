'use client'

import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { Group } from 'three'
import { use3DScroll } from '@/hooks/use3DScroll'
import type { HeroSceneConfig } from '@/types/scene'

interface ModelProps {
  config: Pick<HeroSceneConfig, 'modelPath' | 'maxTiltRad' | 'dampingLambda'>
}

/**
 * Loads the compressed hero GLB model and applies scroll-driven tilt.
 * Tilt is clamped to ±maxTiltRad and smoothed via exponential decay (MathUtils.damp).
 */
export function Model({ config }: ModelProps): JSX.Element {
  const groupRef = useRef<Group>(null)
  const { scene } = useGLTF(config.modelPath)
  const { viewport } = useThree()
  const { getTargetRotation } = use3DScroll({ maxTiltRad: config.maxTiltRad })

  // Boost envMapIntensity on all MeshStandardMaterial meshes for hard metal reflections
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        for (const mat of mats) {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.envMapIntensity = 2.5
            mat.needsUpdate = true
          }
        }
      }
    })
  }, [scene])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const { x, y } = getTargetRotation()
    groupRef.current.rotation.x = THREE.MathUtils.damp(
      groupRef.current.rotation.x,
      x,
      config.dampingLambda,
      delta,
    )
    groupRef.current.rotation.y = THREE.MathUtils.damp(
      groupRef.current.rotation.y,
      y,
      config.dampingLambda,
      delta,
    )
  })

  // Responsive scale: shrink proportionally on narrow viewports
  const scale = Math.min(1, viewport.width / 6) * 1.2

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={[scale, scale, scale]} />
    </group>
  )
}
