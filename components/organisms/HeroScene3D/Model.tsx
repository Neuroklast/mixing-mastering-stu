'use client'

import { useRef, useEffect, useMemo } from 'react'
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
 * Minimum rotation delta (radians) below which damping is considered settled.
 * 0.0001 rad ≈ 0.006° — imperceptible to the eye but prevents the render loop
 * from running indefinitely on floating-point drift. Lowering this makes the
 * settle-check run longer; raising it causes a visible snap at the end of
 * the animation.
 */
const DAMP_SETTLE_THRESHOLD = 0.0001

/**
 * Loads the compressed hero GLB model and applies scroll-driven tilt.
 * Tilt is clamped to ±maxTiltRad and smoothed via exponential decay (MathUtils.damp).
 *
 * Works with `frameloop="demand"`: self-invalidates each frame while the
 * damping animation is still settling, then goes idle until the next scroll event.
 */
export function Model({ config }: ModelProps): JSX.Element {
  const groupRef = useRef<Group>(null)
  const { scene } = useGLTF(config.modelPath)
  const { viewport, invalidate } = useThree()
  const { getTargetRotation } = use3DScroll({ maxTiltRad: config.maxTiltRad })

  // Boost envMapIntensity on all MeshStandardMaterial meshes for hard metal reflections.
  // Return a cleanup that disposes geometries and materials when the component unmounts.
  useEffect(() => {
    const meshes: THREE.Mesh[] = []

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshes.push(child)
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        for (const mat of mats) {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.envMapIntensity = 2.5
            mat.needsUpdate = true
          }
        }
      }
    })

    return () => {
      for (const mesh of meshes) {
        mesh.geometry?.dispose()
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        for (const mat of mats) mat.dispose()
      }
    }
  }, [scene])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const { x, y } = getTargetRotation()

    const newX = THREE.MathUtils.damp(groupRef.current.rotation.x, x, config.dampingLambda, delta)
    const newY = THREE.MathUtils.damp(groupRef.current.rotation.y, y, config.dampingLambda, delta)

    groupRef.current.rotation.x = newX
    groupRef.current.rotation.y = newY

    // Keep requesting frames until the damping animation has settled so the
    // transition is smooth even with frameloop="demand".
    if (
      Math.abs(newX - x) > DAMP_SETTLE_THRESHOLD ||
      Math.abs(newY - y) > DAMP_SETTLE_THRESHOLD
    ) {
      invalidate()
    }
  })

  // Responsive scale: shrink proportionally on narrow viewports
  const scale = useMemo(
    () => Math.min(1, viewport.width / 6) * 0.3,
    [viewport.width],
  )

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={[scale, scale, scale]} />
    </group>
  )
}
