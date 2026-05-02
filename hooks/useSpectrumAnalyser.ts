'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { TRACK_LABELS } from '@/lib/constants'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ViewMode = 'bars' | 'curve'

interface UseSpectrumAnalyserOptions {
  analyserBefore: AnalyserNode | null
  analyserAfter: AnalyserNode | null
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  activeTrack: 'before' | 'after'
}

export interface UseSpectrumAnalyserReturn {
  viewMode: ViewMode
  setViewMode: (m: ViewMode) => void
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
const COLOR_DELTA = 'rgba(0, 242, 255, 0.7)'  // cyan #00f2ff – Δ (B − A)
const COLOR_ACTIVE_BAR = '#D94848'            // red accent – active track bars
const COLOR_INACTIVE_BAR = 'rgba(120,120,120,0.5)' // grey – inactive track bars

// Active curve colours
const COLOR_ACTIVE_STROKE = '#D94848'
const COLOR_ACTIVE_FILL = 'rgba(217,72,72,0.12)'
const COLOR_ACTIVE_LINE_WIDTH = 2

// Inactive curve colours
const COLOR_INACTIVE_STROKE = 'rgba(160,160,160,0.7)'
const COLOR_INACTIVE_FILL = 'rgba(160,160,160,0.08)'
const COLOR_INACTIVE_LINE_WIDTH = 1.5

// Frequency axis labels
const FREQ_AXIS_LABELS: { f: number; label: string }[] = [
  { f: 20, label: '20' },
  { f: 50, label: '50' },
  { f: 100, label: '100' },
  { f: 200, label: '200' },
  { f: 500, label: '500' },
  { f: 1000, label: '1k' },
  { f: 2000, label: '2k' },
  { f: 5000, label: '5k' },
  { f: 10000, label: '10k' },
  { f: 20000, label: '20k' },
]

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

// (gradient removed – inactive bars now use solid grey)

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSpectrumAnalyser({
  analyserBefore,
  analyserAfter,
  canvasRef,
  activeTrack,
}: UseSpectrumAnalyserOptions): UseSpectrumAnalyserReturn {
  const [viewMode, setViewMode] = useState<ViewMode>('bars')

  // Stable refs so the RAF loop never closes over stale state
  const viewModeRef = useRef<ViewMode>('bars')
  const activeTrackRef = useRef<'before' | 'after'>(activeTrack)

  // Keep refs in sync with state
  useEffect(() => { viewModeRef.current = viewMode }, [viewMode])
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
      fillStyle: string | CanvasGradient,
      alpha: number,
    ): void => {
      analyser.getFloatFrequencyData(freqBuf as Float32Array<ArrayBuffer>)
      const sampleRate = analyser.context.sampleRate
      const binWidth = sampleRate / 2 / analyser.frequencyBinCount
      const nBars = THIRD_OCTAVE_CENTRES.length
      const barW = w / nBars - 1

      ctx.globalAlpha = alpha
      ctx.fillStyle = fillStyle

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
          sum += (freqBuf[b] ?? -100)
          count++
        }
        const avgDb = count > 0 ? sum / count : -100
        const clamped = Math.max(-100, Math.min(0, avgDb))
        const barH = ((clamped + 100) / 100) * h

        const x = (i / nBars) * w
        ctx.fillRect(x, h - barH, barW, barH)

        // Peak hold
        if (avgDb > (peakBuf[i] ?? -100)) {
          peakBuf[i] = avgDb
          peakHoldBuf[i] = PEAK_HOLD_FRAMES
        } else if ((peakHoldBuf[i] ?? 0) > 0) {
          peakHoldBuf[i]!--
        } else {
          peakBuf[i] = Math.max(-100, (peakBuf[i] ?? -100) - PEAK_DECAY_DB)
        }
        const peakDb = Math.max(-100, Math.min(0, peakBuf[i] ?? -100))
        const peakY = h - ((peakDb + 100) / 100) * h
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
      lineWidth: number,
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
      ctx.lineWidth = lineWidth
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

      // ── Filled delta area between mix (A) and master (B) curves ──────────────
      // Green fill where master > mix (energy added), red where mix > master.
      // Draw as two separate filled paths for the two directions.

      const getY = (buf: Float32Array, x: number): number => {
        const freq  = F_MIN * Math.pow(F_MAX / F_MIN, x / w)
        const binF  = (freq / nyquist) * binCount
        const binLo = Math.floor(binF)
        const binHi = Math.min(binCount - 1, binLo + 1)
        const t     = binF - binLo
        const dB    = (buf[binLo] ?? -100) + ((buf[binHi] ?? -100) - (buf[binLo] ?? -100)) * t
        const clamped = Math.max(-100, Math.min(0, dB))
        return h - ((clamped + 100) / 100) * h
      }

      // Build point arrays once
      const yA = new Float32Array(w)
      const yB = new Float32Array(w)
      for (let x = 0; x < w; x++) {
        yA[x] = getY(smoothA, x)
        yB[x] = getY(smoothB, x)
      }

      // Green fill: master (B) above mix (A), i.e. yB < yA in canvas coords
      ctx.beginPath()
      ctx.moveTo(0, yA[0]!)
      for (let x = 1; x < w; x++) ctx.lineTo(x, yA[x]!)
      for (let x = w - 1; x >= 0; x--) ctx.lineTo(x, yB[x]!)
      ctx.closePath()
      ctx.fillStyle = 'rgba(0,242,255,0.08)'
      ctx.fill()

      // Red fill: mix (A) above master (B)
      ctx.beginPath()
      ctx.moveTo(0, yB[0]!)
      for (let x = 1; x < w; x++) ctx.lineTo(x, yB[x]!)
      for (let x = w - 1; x >= 0; x--) ctx.lineTo(x, yA[x]!)
      ctx.closePath()
      ctx.fillStyle = 'rgba(217,72,72,0.10)'
      ctx.fill()

      // Thin delta line (original)
      ctx.beginPath()
      let started = false
      for (let x = 0; x < w; x++) {
        const freq = F_MIN * Math.pow(F_MAX / F_MIN, x / w)
        const bin  = Math.min(binCount - 1, Math.round((freq / nyquist) * binCount))
        const delta = Math.max(-50, Math.min(50, (smoothB[bin] ?? -100) - (smoothA[bin] ?? -100)))
        const y = h / 2 - (delta / 50) * (h / 2)
        if (!started) { ctx.moveTo(x, y); started = true }
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = COLOR_DELTA
      ctx.lineWidth = 1.5
      ctx.stroke()
    },
    [],
  )

  const drawLegend = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, at: 'before' | 'after', vm: ViewMode): void => {
      const items: { color: string; label: string }[] = [
        { color: at === 'before' ? COLOR_ACTIVE_STROKE : COLOR_INACTIVE_STROKE, label: TRACK_LABELS.BEFORE },
        { color: at === 'after' ? COLOR_ACTIVE_STROKE : COLOR_INACTIVE_STROKE, label: TRACK_LABELS.AFTER },
      ]
      if (vm === 'curve') items.push({ color: COLOR_DELTA, label: 'Δ' })

      ctx.font = '10px monospace'
      let rx = w - 8
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i]!
        const tw = ctx.measureText(item.label).width
        ctx.globalAlpha = 1
        ctx.fillStyle = item.color
        ctx.fillText(item.label, rx - tw, 14)
        ctx.fillRect(rx - tw - 14, 7, 10, 3)
        rx -= tw + 22
      }
      ctx.globalAlpha = 1
    },
    [],
  )

  const drawFreqAxis = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number): void => {
      ctx.save()
      ctx.font = '9px monospace'
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.lineWidth = 1
      for (const { f, label } of FREQ_AXIS_LABELS) {
        const x = freqToX(f, w)
        // 4 px tick upward from h-14
        ctx.beginPath()
        ctx.moveTo(x, h - 14)
        ctx.lineTo(x, h - 18)
        ctx.stroke()
        // Label centred below tick
        const tw = ctx.measureText(label).width
        ctx.fillText(label, x - tw / 2, h - 3)
      }
      ctx.restore()
    },
    [],
  )

  /**
   * Draw a subtle background grid: horizontal dB lines and faint vertical
   * frequency lines.  Called once per frame, before the spectrum curves.
   */
  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number): void => {
      ctx.save()

      // ── Horizontal dB lines ────────────────────────────────────────────────
      const DB_LINES = [-20, -40, -60, -80]
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 1
      ctx.font = '8px monospace'
      ctx.fillStyle = 'rgba(255,255,255,0.22)'
      ctx.textAlign = 'left'

      for (const db of DB_LINES) {
        const y = h - ((db + 100) / 100) * h
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
        ctx.fillText(`${db}`, 3, y - 2)
      }

      // ── Vertical frequency lines ───────────────────────────────────────────
      const GRID_FREQS = [50, 100, 500, 1000, 5000, 10000]
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 1

      for (const f of GRID_FREQS) {
        const x = freqToX(f, w)
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }

      ctx.restore()
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
      const at = activeTrackRef.current

      // 18 px bottom padding reserved for frequency-axis labels
      const hDraw = h - 18

      // Draw background grid first (below spectrum curves)
      drawGrid(ctx2d, w, hDraw)

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
        if (at === 'before') {
          // Inactive (after) drawn first, active (before) on top
          if (aAfter && fbB && pkB && phB) {
            drawBars(ctx2d, aAfter, fbB, pkB, phB, w, hDraw, COLOR_INACTIVE_BAR, 1.0)
          }
          if (aBefore && fbA && pkA && phA) {
            drawBars(ctx2d, aBefore, fbA, pkA, phA, w, hDraw, COLOR_ACTIVE_BAR, 1.0)
          }
        } else {
          // Inactive (before) drawn first, active (after) on top
          if (aBefore && fbA && pkA && phA) {
            drawBars(ctx2d, aBefore, fbA, pkA, phA, w, hDraw, COLOR_INACTIVE_BAR, 1.0)
          }
          if (aAfter && fbB && pkB && phB) {
            drawBars(ctx2d, aAfter, fbB, pkB, phB, w, hDraw, COLOR_ACTIVE_BAR, 1.0)
          }
        }
      } else {
        // Curve mode – draw inactive first, active on top
        if (at === 'before') {
          if (aAfter && fbB && sbB) {
            drawCurve(ctx2d, aAfter, fbB, sbB, w, hDraw, COLOR_INACTIVE_STROKE, COLOR_INACTIVE_FILL, COLOR_INACTIVE_LINE_WIDTH)
          }
          if (aBefore && fbA && sbA) {
            drawCurve(ctx2d, aBefore, fbA, sbA, w, hDraw, COLOR_ACTIVE_STROKE, COLOR_ACTIVE_FILL, COLOR_ACTIVE_LINE_WIDTH)
          }
        } else {
          if (aBefore && fbA && sbA) {
            drawCurve(ctx2d, aBefore, fbA, sbA, w, hDraw, COLOR_INACTIVE_STROKE, COLOR_INACTIVE_FILL, COLOR_INACTIVE_LINE_WIDTH)
          }
          if (aAfter && fbB && sbB) {
            drawCurve(ctx2d, aAfter, fbB, sbB, w, hDraw, COLOR_ACTIVE_STROKE, COLOR_ACTIVE_FILL, COLOR_ACTIVE_LINE_WIDTH)
          }
        }
        // Delta: faint 0 dB reference line, then delta curve on top
        if (aBefore && sbA && sbB) {
          ctx2d.strokeStyle = 'rgba(255,255,255,0.15)'
          ctx2d.lineWidth = 1
          ctx2d.beginPath()
          ctx2d.moveTo(0, hDraw / 2)
          ctx2d.lineTo(w, hDraw / 2)
          ctx2d.stroke()
          drawDelta(ctx2d, sbA, sbB, aBefore, w, hDraw)
        }
      }

      drawLegend(ctx2d, w, at, vm)
      drawFreqAxis(ctx2d, w, h)

      rafIdRef.current = requestAnimationFrame(tick)
    }

    rafIdRef.current = requestAnimationFrame(tick)
  }, [analyserBefore, analyserAfter, canvasRef, drawBars, drawCurve, drawDelta, drawFreqAxis, drawGrid, drawLegend])

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
  }
}
