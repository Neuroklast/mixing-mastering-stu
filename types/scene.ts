/** Normalized page scroll progress [0, 1] */
export type ScrollProgress = number

export interface HeroSceneConfig {
  /** Path to the GLTF/GLB model relative to /public */
  modelPath: string
  /** Camera field-of-view in degrees */
  fov: number
  /** Max tilt in radians on X and Y axes */
  maxTiltRad: number
  /** Exponential-decay damping lambda (higher = faster response) */
  dampingLambda: number
}
