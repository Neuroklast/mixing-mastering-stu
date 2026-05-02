/**
 * StereoFieldAnalyzer
 *
 * Encapsulates Linkwitz–Riley 4th-order (LR4) multiband frequency splitting and
 * off-main-thread phase-correlation computation via an AudioWorklet.
 *
 * LR4 = two cascaded 2nd-order Butterworth filters at the same cutoff frequency
 * (Q = 1/√2 ≈ 0.707), giving 24 dB/oct roll-off and in-phase summing at the
 * crossover points.
 *
 * Signal routing (per L/R channel):
 *
 *   source → ChannelSplitter(2)
 *     ch 0 (L) ──→ [LPF×2]_200Hz ───────────────────── ch 0 ─┐
 *     ch 1 (R) ──→ [LPF×2]_200Hz ───────────────────── ch 1 ──┤
 *     ch 0 (L) ──→ [HPF×2]_200Hz → [LPF×2]_5kHz ───── ch 2 ──┤ ChannelMerger(6) → AudioWorkletNode
 *     ch 1 (R) ──→ [HPF×2]_200Hz → [LPF×2]_5kHz ───── ch 3 ──┤
 *     ch 0 (L) ──→ [HPF×2]_5kHz ────────────────────── ch 4 ──┤
 *     ch 1 (R) ──→ [HPF×2]_5kHz ────────────────────── ch 5 ──┘
 */

export interface CorrResult {
  low: number
  mid: number
  high: number
}

// Per-AudioContext worklet-module registration guard (singleton – avoids
// DOMException "already registered" when the same context is reused).
const workletRegistered = new WeakSet<AudioContext>()

/** Create a single 2nd-order Butterworth BiquadFilterNode. */
function butter2 (ctx: AudioContext, type: BiquadFilterType, freq: number): BiquadFilterNode {
  const f = ctx.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  f.Q.value = Math.SQRT1_2  // 1/√2 — maximally flat Butterworth
  return f
}

export class StereoFieldAnalyzer {
  private readonly ctx: AudioContext
  private attached = false
  private workletNode: AudioWorkletNode | null = null

  constructor (ctx: AudioContext) {
    this.ctx = ctx
  }

  /** Register the worklet module on the AudioContext (idempotent). */
  private async ensureWorklet (): Promise<void> {
    if (workletRegistered.has(this.ctx)) return
    await this.ctx.audioWorklet.addModule('/worklets/stereo-field-worklet.js')
    workletRegistered.add(this.ctx)
  }

  /**
   * Build the LR4 filter bank for `source`, connect it to the AudioWorklet,
   * and begin posting correlation results via `onCorr`.
   *
   * This method is idempotent: subsequent calls on the same instance are no-ops.
   */
  async attach (source: AudioNode, onCorr: (r: CorrResult) => void): Promise<void> {
    if (this.attached) return
    this.attached = true

    try {
      await this.ensureWorklet()
    } catch (err) {
      // AudioWorklet is unavailable (insecure context, old browser, etc.).
      console.warn('[StereoFieldAnalyzer] AudioWorklet unavailable:', err)
      this.attached = false
      return
    }

    const ctx = this.ctx
    const splitter = ctx.createChannelSplitter(2)
    source.connect(splitter)

    // ── Low band: LR4 lowpass @ 200 Hz ────────────────────────────────────────
    const lpf200aL = butter2(ctx, 'lowpass', 200); splitter.connect(lpf200aL, 0)
    const lpf200bL = butter2(ctx, 'lowpass', 200); lpf200aL.connect(lpf200bL)

    const lpf200aR = butter2(ctx, 'lowpass', 200); splitter.connect(lpf200aR, 1)
    const lpf200bR = butter2(ctx, 'lowpass', 200); lpf200aR.connect(lpf200bR)

    // ── Mid band: LR4 highpass @ 200 Hz → LR4 lowpass @ 5000 Hz ──────────────
    const hpf200aL = butter2(ctx, 'highpass', 200); splitter.connect(hpf200aL, 0)
    const hpf200bL = butter2(ctx, 'highpass', 200); hpf200aL.connect(hpf200bL)
    const lpf5kaL  = butter2(ctx, 'lowpass', 5000); hpf200bL.connect(lpf5kaL)
    const lpf5kbL  = butter2(ctx, 'lowpass', 5000); lpf5kaL.connect(lpf5kbL)

    const hpf200aR = butter2(ctx, 'highpass', 200); splitter.connect(hpf200aR, 1)
    const hpf200bR = butter2(ctx, 'highpass', 200); hpf200aR.connect(hpf200bR)
    const lpf5kaR  = butter2(ctx, 'lowpass', 5000); hpf200bR.connect(lpf5kaR)
    const lpf5kbR  = butter2(ctx, 'lowpass', 5000); lpf5kaR.connect(lpf5kbR)

    // ── High band: LR4 highpass @ 5000 Hz ─────────────────────────────────────
    const hpf5kaL = butter2(ctx, 'highpass', 5000); splitter.connect(hpf5kaL, 0)
    const hpf5kbL = butter2(ctx, 'highpass', 5000); hpf5kaL.connect(hpf5kbL)

    const hpf5kaR = butter2(ctx, 'highpass', 5000); splitter.connect(hpf5kaR, 1)
    const hpf5kbR = butter2(ctx, 'highpass', 5000); hpf5kaR.connect(hpf5kbR)

    // ── Merge 6 mono band signals into one 6-channel signal ───────────────────
    const merger = ctx.createChannelMerger(6)
    lpf200bL.connect(merger, 0, 0)  // ch 0: low  L
    lpf200bR.connect(merger, 0, 1)  // ch 1: low  R
    lpf5kbL.connect(merger, 0, 2)   // ch 2: mid  L
    lpf5kbR.connect(merger, 0, 3)   // ch 3: mid  R
    hpf5kbL.connect(merger, 0, 4)   // ch 4: high L
    hpf5kbR.connect(merger, 0, 5)   // ch 5: high R

    // ── AudioWorklet node (analysis sink – no audio output) ───────────────────
    const wn = new AudioWorkletNode(ctx, 'stereo-field-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 0,
      channelCount: 6,
      channelCountMode: 'explicit',
      channelInterpretation: 'discrete',
    })
    merger.connect(wn)
    this.workletNode = wn

    wn.port.onmessage = (e: MessageEvent) => {
      const d = e.data as { type?: string; low?: number; mid?: number; high?: number } | null
      if (d?.type === 'corr' && d.low !== undefined && d.mid !== undefined && d.high !== undefined) {
        onCorr({ low: d.low, mid: d.mid, high: d.high })
      }
    }
  }

  /** Detach the correlation callback (e.g. on component unmount). */
  dispose (): void {
    if (this.workletNode) {
      this.workletNode.port.onmessage = null
    }
  }
}
