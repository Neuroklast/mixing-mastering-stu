'use client'

/**
 * HeroScene3D – fixed full-screen WebGL background organism.
 *
 * Renders the hero GLB model with industrial red lighting and
 * scroll-driven parallax tilt. Uses a position:fixed Canvas at z-index:-1
 * so all page content sits on top.
 *
 * Consumes <ScrollProgressProvider> from contexts/ScrollProgressContext.
 * Must be imported via dynamic({ ssr: false }) in page.tsx.
 */

import { Canvas } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Scene } from './Scene'
import type { HeroSceneConfig } from '@/types/scene'

const SCENE_CONFIG: HeroSceneConfig = {
  modelPath: '/video/3d_hero_model.glb',
  fov: 40,
  maxTiltRad: 0.1,
  dampingLambda: 6,
}

export function HeroScene3D(): JSX.Element {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: false,
          stencil: false,
          depth: true,
          powerPreference: 'high-performance',
        }}
        shadows={false}
      >
        <Scene config={SCENE_CONFIG} />
      </Canvas>
    </div>
  )
}

// Warm up GLTF cache so the model starts loading before the component mounts
useGLTF.preload(SCENE_CONFIG.modelPath)
