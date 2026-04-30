/**
 * SpectrumAnalyserProcessor
 *
 * An AudioWorklet processor that buffers incoming audio samples into a ring
 * buffer and periodically forwards them to the main thread.  The main thread
 * uses a connected AnalyserNode for the actual FFT — this worklet's role is
 * to let the audio processing pipeline remain fully off the main thread while
 * providing a hook point for future custom analysis (LUFS, peak, etc.).
 *
 * Message protocol (port → main thread):
 *   { type: 'ready' }                      – sent once after construction
 *   { type: 'rms', rms: number }           – sent every reportEvery frames
 *
 * Message protocol (main thread → port):
 *   { type: 'set-report-interval', frames: number }
 */
class SpectrumAnalyserProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options)
    const opts = (options && options.processorOptions) || {}
    this._reportEvery = opts.reportEvery ?? 4 // ~60 fps at 48 kHz / 128 frames
    this._frameCount = 0
    this._sumSq = 0
    this._sampleCount = 0

    this.port.onmessage = (e) => {
      if (e.data && e.data.type === 'set-report-interval') {
        this._reportEvery = Math.max(1, e.data.frames | 0)
      }
    }

    this.port.postMessage({ type: 'ready' })
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || !input[0]) return true

    const channel = input[0]

    // Accumulate RMS
    for (let i = 0; i < channel.length; i++) {
      this._sumSq += channel[i] * channel[i]
    }
    this._sampleCount += channel.length
    this._frameCount++

    if (this._frameCount >= this._reportEvery) {
      const rms = this._sampleCount > 0 ? Math.sqrt(this._sumSq / this._sampleCount) : 0
      this.port.postMessage({ type: 'rms', rms })
      this._frameCount = 0
      this._sumSq = 0
      this._sampleCount = 0
    }

    return true
  }
}

registerProcessor('spectrum-analyser-processor', SpectrumAnalyserProcessor)
