/**
 * StereoFieldProcessor
 *
 * AudioWorklet processor for real-time multiband phase-correlation analysis.
 *
 * Expected input: 1 input, 6 channels
 *   ch 0  Low-band  L
 *   ch 1  Low-band  R
 *   ch 2  Mid-band  L
 *   ch 3  Mid-band  R
 *   ch 4  High-band L
 *   ch 5  High-band R
 *
 * Pearson correlation formula applied per band:
 *   r = Σ(L·R) / √(Σ(L²)·Σ(R²))
 *
 * Edge cases:
 *   – Silent R channel (mono source → splitter output[1] = 0): treated as
 *     perfect mono correlation (+1).
 *   – Both channels silent: reported as 0.
 *
 * Outputs { type: 'corr', low, mid, high } every ~60 ms.
 *
 * Message protocol (worklet → main thread):
 *   { type: 'ready' }
 *   { type: 'corr', low: number, mid: number, high: number }
 */
class StereoFieldProcessor extends AudioWorkletProcessor {
  constructor (options) {
    super(options)
    // ~60 ms interval: ceil(0.060 × sampleRate / 128 frames per quantum)
    this._framesPerReport = Math.max(1, Math.ceil((sampleRate * 0.060) / 128))
    this._frameCount = 0
    // Accumulator objects for cross-products and squared values per band
    this._acc = [
      { lr: 0, ll: 0, rr: 0 },  // low
      { lr: 0, ll: 0, rr: 0 },  // mid
      { lr: 0, ll: 0, rr: 0 },  // high
    ]
    this.port.postMessage({ type: 'ready' })
  }

  /** Pearson r from accumulated sums; handles degenerate silent-channel case. */
  _corr (a) {
    if (a.rr < 1e-10) return a.ll > 1e-10 ? 1 : 0
    const d = Math.sqrt(a.ll * a.rr)
    return d < 1e-10 ? 0 : Math.max(-1, Math.min(1, a.lr / d))
  }

  process (inputs) {
    const input = inputs[0]
    // Require all 6 channels; keep processor alive even if not yet connected
    if (!input || input.length < 6) return true

    const [chLL, chLR, chML, chMR, chHL, chHR] = input
    if (!chLL || !chLR || !chML || !chMR || !chHL || !chHR) return true

    const n = chLL.length
    const [aLow, aMid, aHigh] = this._acc

    for (let i = 0; i < n; i++) {
      const ll = chLL[i]; const lr = chLR[i]
      aLow.lr  += ll * lr;  aLow.ll  += ll * ll;  aLow.rr  += lr * lr

      const ml = chML[i]; const mr = chMR[i]
      aMid.lr  += ml * mr;  aMid.ll  += ml * ml;  aMid.rr  += mr * mr

      const hl = chHL[i]; const hr = chHR[i]
      aHigh.lr += hl * hr;  aHigh.ll += hl * hl;  aHigh.rr += hr * hr
    }

    if (++this._frameCount >= this._framesPerReport) {
      this.port.postMessage({
        type: 'corr',
        low:  this._corr(aLow),
        mid:  this._corr(aMid),
        high: this._corr(aHigh),
      })
      aLow.lr  = 0; aLow.ll  = 0; aLow.rr  = 0
      aMid.lr  = 0; aMid.ll  = 0; aMid.rr  = 0
      aHigh.lr = 0; aHigh.ll = 0; aHigh.rr = 0
      this._frameCount = 0
    }

    return true
  }
}

registerProcessor('stereo-field-processor', StereoFieldProcessor)
