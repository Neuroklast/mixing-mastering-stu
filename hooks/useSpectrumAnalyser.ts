'use client'

import { useRef, useEffect, useCallback, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ViewMode = 'bars' | 'curve'
export type AbMode = 'A' | 'B' | 'AB'

interface UseSpectrumAnalyserOptions {
  analyserBefore: AnalyserNode | null
  analyserAfter: AnalyserNode | null
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  activeTrack: 'before' | 'after'
}

export interface UseSpectrumAnalyserReturn {
  viewMode: ViewMode
  setViewMode: (m: ViewMode) => void
  abMode: AbMode
  setAbMode: (m: AbMode) => void
  showDelta: boolean
  setShowDelta: (v: boolean) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Standard 1/3-octave centre frequencies (31 bands, 20 Hz – 20 kHz)
const THIRD_OCTAVE_CENTRES = [
  20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630,
  800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000,
  12500, 16000, 20000,
]

const F_MIN = 20
const F_MAX = 20000

// Colours matching the industrial/cyber aesthetic
const COLOR_A = 'rgba(0, 212, 255, 0.9)'     // cyan  – Mixdown
const COLOR_B = 'rgba(255, 107, 53, 0.9)'     // orange – Master
const COLOR_DELTA = 'rgba(0, 255, 128, 0.7)'  // green  – Δ (B − A)

// Peak-hold parameters
const PEAK_HOLD_FRAMES = 60   // frames to hold before decay
const PEAK_DECAY_DB = 2       // dB/frame decay rate

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Map a frequency (Hz) to a canvas X pixel using logarithmic scale. */
const freqToX = (f: number, width: number): number =>
  (Math.log(f / F_MIN) / Math.log(F_MAX / F_MIN)) * width

/** Convert AnalyserNode byte value (0–255) to approximate dB (−100 – 0). */
const byteToDb = (v: number): number => (v / 255) * 100 - 100

/** dB value (−100 – 0) → canvas Y pixel (top = loud, bottom = quiet). */
const dbToY = (db: number, height: number): number =>
  ((db + 100) / 100) * height

/** Apply a simple 3-tap moving average to smooth a Float32Array in place. */
const smoothArray = (arr: Float32Array): void => {
  const len = arr.length
  if (len < 3) return
  let prev = arr[0]
  for (let i = 1; i < len - 1; i++) {
    const cur = (prev + arr[i] + arr[i + 1]) / 3
    prev = arr[i]
    arr[i] = cur
  }
}

// ─── Bar-gradient cache ───────────────────────────────────────────────────────

let cachedGradientWidth = 0
let cachedGradient: CanvasGradient | null = null

const getBarGradient = (ctx: CanvasRenderingContext2D, width: number): CanvasGradient => {
  if (cachedGradient && cachedGradientWidth === width) return cachedGradient
  const g = ctx.createLinearGradient(0, 0, width, 0)
  g.addColorStop(0, '#ff6b35')   // bass – orange
  g.addColorStop(1, '#00d4ff')   // highs – cyan
  cachedGradient = g
  cachedGradientWidth = width
  return g
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSpectrumAnalyser({
  analyserBefore,
  analyserAfter,
  canvasRef,
  activeTrack,
}: UseSpectrumAnalyserOptions): UseSpectrumAnalyserReturn {
  const [viewMode, setViewMode] = useState<ViewMode>('bars')
  const [abMode, setAbMode] = useState<AbMode>('AB')
  const [showDelta, setShowDelta] = useState(false)

  // Stable refs so the RAF loop never closes over stale state
  const viewModeRef = useRef<ViewMode>('bars')
  const abModeRef = useRef<AbMode>('AB')
  const showDeltaRef = useRef(false)
  const activeTrackRef = useRef<'before' | 'after'>(activeTrack)

  // Keep refs in sync with state
  useEffect(() => { viewModeRef.current = viewMode }, [viewMode])
  useEffect(() => { abModeRef.current = abMode }, [abMode])
  useEffect(() => { showDeltaRef.current = showDelta }, [showDelta])
  useEffect(() => { activeTrackRef.current = activeTrack }, [activeTrack])

  // Pre-allocated Float32Array buffers (allocated once, never inside RAF)
  const freqBufARef = useRef<Float32Array | null>(null)
  const freqBufBRef = useRef<Float32Array | null>(null)
  const smoothBufARef = useRef<Float32Array | null>(null)
  const smoothBufBRef = useRef<Float32Array | null>(null)

  // Peak-hold state (per-bar): value (dB) and hold counter
  const peakARef = useRef<Float32Array | null>(null)
  const peakBRef = useRef<Float32Array | null>(null)
  const peakHoldARef = useRef<Int32Array | null>(null)
  const peakHoldBRef = useRef<Int32Array | null>(null)

  const rafIdRef = useRef<number | undefined>(undefined)

  // ── Initialise / resize buffers whenever analysers change ──────────────────
  useEffect(() => {
    const nBars = THIRD_OCTAVE_CENTRES.length

    const initBuf = (n: number): Float32Array => new Float32Array(n)
    const initInt = (n: number): Int32Array => new Int32Array(n)

    if (analyserBefore) {
      freqBufARef.current = initBuf(analyserBefore.frequencyBinCount)
      smoothBufARef.current = initBuf(analyserBefore.frequencyBinCount)
    }
    if (analyserAfter) {
      freqBufBRef.current = initBuf(analyserAfter.frequencyBinCount)
      smoothBufBRef.current = initBuf(analyserAfter.frequencyBinCount)
    }
    peakARef.current = initBuf(nBars)
    peakBRef.current = initBuf(nBars)
    peakHoldARef.current = initInt(nBars)
    peakHoldBRef.current = initInt(nBars)
  }, [analyserBefore, analyserAfter])

  // ── Draw helpers ─────────────────────────────────────────────────────────────

  const drawBars = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      analyser: AnalyserNode,
      freqBuf: Float32Array,
      peakBuf: Float32Array,
      peakHoldBuf: Int32Array,
      w: number,
      h: number,
      gradient: CanvasGradient,
      alpha: number,
    ): void => {
      analyser.getByteFrequencyData(freqBuf as unknown as Uint8Array)
      const sampleRate = analyser.context.sampleRate
      const binWidth = sampleRate / 2 / analyser.frequencyBinCount
      const nBars = THIRD_OCTAVE_CENTRES.length
      const barW = w / nBars - 1

      ctx.globalAlpha = alpha
      ctx.fillStyle = gradient

      for (let i = 0; i < nBars; i++) {
        const fc = THIRD_OCTAVE_CENTRES[i]!
        // Band edges at ±0.5 semitone (1/6 octave)
        const fLo = fc / Math.pow(2, 1 / 6)
        const fHi = fc * Math.pow(2, 1 / 6)
        const binLo = Math.max(0, Math.floor(fLo / binWidth))
        const binHi = Math.min(analyser.frequencyBinCount - 1, Math.ceil(fHi / binWidth))

        let sum = 0
        let count = 0
        for (let b = binLo; b <= binHi; b++) {
          sum += (freqBuf[b] ?? 0)
          count++
        }
        const avg = count > 0 ? sum / count : 0
        const norm = avg / 255
        const barH = norm * h

        const x = (i / nBars) * w
        ctx.fillRect(x, h - barH, barW, barH)

        // Peak hold
        const db = byteToDb(avg)
        if (db > (peakBuf[i] ?? -100)) {
          peakBuf[i] = db
          peakHoldBuf[i] = PEAK_HOLD_FRAMES
        } else if ((peakHoldBuf[i] ?? 0) > 0) {
          peakHoldBuf[i]!--
        } else {
          peakBuf[i] = Math.max(-100, (peakBuf[i] ?? -100) - PEAK_DECAY_DB)
        }
        const peakY = h - dbToY(peakBuf[i] ?? -100, h)
        ctx.fillRect(x, peakY - 1, barW, 2)
      }

      ctx.globalAlpha = 1
    },
    [],
  )

  const drawCurve = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      analyser: AnalyserNode,
      freqBuf: Float32Array,
      smoothBuf: Float32Array,
      w: number,
      h: number,
      strokeColor: string,
      fillColor: string,
    ): void => {
      analyser.getFloatFrequencyData(freqBuf)

      // Copy to smooth buffer and apply moving average
      smoothBuf.set(freqBuf)
      smoothArray(smoothBuf)

      const binCount = analyser.frequencyBinCount
      const sampleRate = analyser.context.sampleRate
      const nyquist = sampleRate / 2

      ctx.beginPath()
      let started = false

      for (let x = 0; x < w; x++) {
        const freq = F_MIN * Math.pow(F_MAX / F_MIN, x / w)
        const binF = (freq / nyquist) * binCount
        const binLo = Math.floor(binF)
        const binHi = Math.min(binCount - 1, binLo + 1)
        const t = binF - binLo
        const dBLo = smoothBuf[binLo] ?? -100
        const dBHi = smoothBuf[binHi] ?? -100
        const dB = dBLo + (dBHi - dBLo) * t

        // Clamp to [−100, 0] dB and map to canvas Y
        const clamped = Math.max(-100, Math.min(0, dB))
        const y = h - ((clamped + 100) / 100) * h

        if (!started) {
          ctx.moveTo(x, y)
          started = true
        } else {
          ctx.lineTo(x, y)
        }
      }

      // Fill under curve
      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.closePath()

      ctx.fillStyle = fillColor
      ctx.fill()

      ctx.beginPath()
      started = false
      for (let x = 0; x < w; x++) {
        const freq = F_MIN * Math.pow(F_MAX / F_MIN, x / w)
        const binF = (freq / nyquist) * binCount
        const binLo = Math.floor(binF)
        const binHi = Math.min(binCount - 1, binLo + 1)
        const t = binF - binLo
        const dBLo = smoothBuf[binLo] ?? -100
        const dBHi = smoothBuf[binHi] ?? -100
        const dB = dBLo + (dBHi - dBLo) * t
        const clamped = Math.max(-100, Math.min(0, dB))
        const y = h - ((clamped + 100) / 100) * h

        if (!started) {
          ctx.moveTo(x, y)
          started = true
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = 1.5
      ctx.stroke()
    },
    [],
  )

  const drawDelta = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      smoothA: Float32Array,
      smoothB: Float32Array,
      analyserA: AnalyserNode,
      w: number,
      h: number,
    ): void => {
      const binCount = analyserA.frequencyBinCount
      const sampleRate = analyserA.context.sampleRate
      const nyquist = sampleRate / 2

      ctx.beginPath()
      let started = false
      for (let x = 0; x < w; x++) {
        const freq = F_MIN * Math.pow(F_MAX / F_MIN, x / w)
        const bin = Math.min(binCount - 1, Math.round((freq / nyquist) * binCount))
        const delta = Math.max(-50, Math.min(50, (smoothB[bin] ?? -100) - (smoothA[bin] ?? -100)))
        // Map delta: centre = h/2, ±50dB = top/bottom
        const y = h / 2 - (delta / 50) * (h / 2)
        if (!started) {
          ctx.moveTo(x, y)
          started = true
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.strokeStyle = COLOR_DELTA
      ctx.lineWidth = 1.5
      ctx.stroke()
    },
    [],
  )

  const drawLegend = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, abMode: AbMode, showDelta: boolean): void => {
      const items: { color: string; label: string }[] = []
      if (abMode === 'A' || abMode === 'AB') items.push({ color: COLOR_A, label: 'A (Mix)' })
      if (abMode === 'B' || abMode === 'AB') items.push({ color: COLOR_B, label: 'B (Master)' })
      if (showDelta && abMode === 'AB') items.push({ color: COLOR_DELTA, label: 'Δ' })

      ctx.font = '10px monospace'
      let rx = w - 8
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i]!
        const tw = ctx.measureText(item.label).width
        ctx.fillStyle = item.color
        ctx.fillText(item.label, rx - tw, 14)
        ctx.fillRect(rx - tw - 14, 7, 10, 3)
        rx -= tw + 22
      }
    },
    [],
  )

  // ── RAF draw loop ─────────────────────────────────────────────────────────────

  const startRaf = useCallback(() => {
    if (rafIdRef.current !== undefined) cancelAnimationFrame(rafIdRef.current)

    const tick = (): void => {
      const canvas = canvasRef.current
      if (!canvas) {
        rafIdRef.current = requestAnimationFrame(tick)
        return
      }

      const ctx2d = canvas.getContext('2d')
      if (!ctx2d) {
        rafIdRef.current = requestAnimationFrame(tick)
        return
      }

      const dpr = window.devicePixelRatio || 1
      const w = canvas.width / dpr
      const h = canvas.height / dpr

      // Clear every frame
      ctx2d.clearRect(0, 0, w, h)

      const vm = viewModeRef.current
      const ab = abModeRef.current
      const delta = showDeltaRef.current

      const aBefore = analyserBefore
      const aAfter = analyserAfter
      const fbA = freqBufARef.current
      const fbB = freqBufBRef.current
      const sbA = smoothBufARef.current
      const sbB = smoothBufBRef.current
      const pkA = peakARef.current
      const pkB = peakBRef.current
      const phA = peakHoldARef.current
      const phB = peakHoldBRef.current

      if (vm === 'bars') {
        const grad = getBarGradient(ctx2d, w)
        if ((ab === 'A' || ab === 'AB') && aBefore && fbA && pkA && phA) {
          drawBars(ctx2d, aBefore, fbA as unknown as Float32Array, pkA, phA, w, h, grad, ab === 'AB' ? 0.6 : 1)
        }
        if ((ab === 'B' || ab === 'AB') && aAfter && fbB && pkB && phB) {
          drawBars(ctx2d, aAfter, fbB as unknown as Float32Array, pkB, phB, w, h, grad, ab === 'AB' ? 0.9 : 1)
        }
      } else {
        // Curve mode
        if ((ab === 'A' || ab === 'AB') && aBefore && fbA && sbA) {
          drawCurve(ctx2d, aBefore, fbA, sbA, w, h, COLOR_A, 'rgba(0,212,255,0.15)')
        }
        if ((ab === 'B' || ab === 'AB') && aAfter && fbB && sbB) {
          drawCurve(ctx2d, aAfter, fbB, sbB, w, h, COLOR_B, 'rgba(255,107,53,0.15)')
        }
        if (delta && ab === 'AB' && aBefore && sbA && sbB) {
          drawDelta(ctx2d, sbA, sbB, aBefore, w, h)
        }
      }

      drawLegend(ctx2d, w, ab, delta)

      rafIdRef.current = requestAnimationFrame(tick)
    }

    rafIdRef.current = requestAnimationFrame(tick)
  }, [analyserBefore, analyserAfter, canvasRef, drawBars, drawCurve, drawDelta, drawLegend])

  const stopRaf = useCallback((): void => {
    if (rafIdRef.current !== undefined) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = undefined
    }
  }, [])

  // ── Start / stop RAF loop ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!analyserBefore && !analyserAfter) return
    startRaf()
    return stopRaf
  }, [analyserBefore, analyserAfter, startRaf, stopRaf])

  return {
    viewMode,
    setViewMode,
    abMode,
    setAbMode,
    showDelta,
    setShowDelta,
  }
}
