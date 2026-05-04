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

import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Scene } from './Scene'
import type { HeroSceneConfig } from '@/types/scene'

const DEFAULT_MODEL_PATH = '/video/3d_hero_model.glb'

const SCENE_CONFIG_BASE: Omit<HeroSceneConfig, 'modelPath'> = {
  fov: 40,
  maxTiltRad: 0.1,
  dampingLambda: 6,
}

/** Catches WebGL / GLTF load errors so a missing model doesn't crash the page. */
class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[HeroScene3D] 3D scene failed to load:', error.message, info.componentStack)
    }
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}

/** Cap DPR at 1.5 on high-DPI (>2) devices to reduce pixel fill rate on mobile GPUs. */
const MAX_DPR = typeof window !== 'undefined' && window.devicePixelRatio > 2 ? 1.5 : 2

interface HeroScene3DProps {
  /** Path to the GLTF/GLB model. Falls back to the bundled default when omitted or empty. */
  modelPath?: string | null
}

export function HeroScene3D({ modelPath }: HeroScene3DProps = {}): JSX.Element {
  const resolvedPath = modelPath || DEFAULT_MODEL_PATH
  const sceneConfig: HeroSceneConfig = { ...SCENE_CONFIG_BASE, modelPath: resolvedPath }
  return (
    <SceneErrorBoundary>
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
          frameloop="demand"
          dpr={[1, MAX_DPR]}
          gl={{
            antialias: false,
            stencil: false,
            depth: true,
            powerPreference: 'high-performance',
          }}
          shadows={false}
        >
          <Scene config={sceneConfig} />
        </Canvas>
      </div>
    </SceneErrorBoundary>
  )
}

// Warm up GLTF cache so the default model starts loading before the component mounts
useGLTF.preload(DEFAULT_MODEL_PATH)
