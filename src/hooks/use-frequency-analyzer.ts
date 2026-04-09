import { useState, useCallback, useRef } from 'react'

export interface FrequencyBand {
  min: number
  max: number
  label: string
}

export const FREQUENCY_BANDS: FrequencyBand[] = [
  { min: 20, max: 250, label: 'Bass' },
  { min: 250, max: 500, label: 'Low Mid' },
  { min: 500, max: 2000, label: 'Mid' },
  { min: 2000, max: 6000, label: 'High Mid' },
  { min: 6000, max: 20000, label: 'Treble' },
]

export function useFrequencyAnalyzer(analyser: AnalyserNode | null, sampleRate: number = 44100) {
  const [frequencyData, setFrequencyData] = useState<number[]>(new Array(FREQUENCY_BANDS.length).fill(0))
  const animationFrameRef = useRef<number>()

  const analyze = useCallback(() => {
    if (!analyser) {
      setFrequencyData(new Array(FREQUENCY_BANDS.length).fill(0))
      return
    }

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyser.getByteFrequencyData(dataArray)

    const nyquist = sampleRate / 2
    const binWidth = nyquist / bufferLength

    const bandValues = FREQUENCY_BANDS.map((band) => {
      const startBin = Math.floor(band.min / binWidth)
      const endBin = Math.floor(band.max / binWidth)
      let sum = 0
      let count = 0
      
      for (let i = startBin; i <= Math.min(endBin, bufferLength - 1); i++) {
        sum += dataArray[i]
        count++
      }
      
      return count > 0 ? (sum / count) / 255 : 0
    })

    setFrequencyData(bandValues)
    animationFrameRef.current = requestAnimationFrame(analyze)
  }, [analyser, sampleRate])

  const start = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    analyze()
  }, [analyze])

  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }
    setFrequencyData(new Array(FREQUENCY_BANDS.length).fill(0))
  }, [])

  return { frequencyData, start, stop }
}
