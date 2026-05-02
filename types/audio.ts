export type PlayerStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'switching' | 'error'

export interface AudioTrack {
  label: 'before' | 'after'
  url: string
}

export interface MultibandCorrelation {
  low: number
  mid: number
  high: number
}

/** Phase correlation result — consumed by visualizer components via interface, not direct hook access */
export interface CorrResult {
  low: number
  mid: number
  high: number
}

export interface AudioEngineState {
  status: PlayerStatus
  isPlaying: boolean
  activeTrack: 'before' | 'after'
  currentTime: number
  duration: number
  lufsIntegrated: number | null
  lufsIntegratedBefore: number | null
  lufsShortTerm: number | null
  frequencyData: Uint8Array | null
  errorMessage: string | null
  analyserBefore: AnalyserNode | null
  analyserAfter: AnalyserNode | null
  multibandCorrelation: MultibandCorrelation | null
}

export interface AudioEngineControls {
  play: () => Promise<void>
  pause: () => void
  seek: (time: number) => void
  switchTrack: (track: 'before' | 'after') => void
}
