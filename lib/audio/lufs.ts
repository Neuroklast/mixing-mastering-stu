/** ITU-R BS.1770-4 reference offset used in all LUFS computations */
export const LUFS_REFERENCE_OFFSET = -0.691

export function computeIntegratedLufs(samples: Float32Array): number {
  let sum = 0
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i]
  const meanSquare = sum / samples.length
  if (meanSquare === 0) return -Infinity
  return LUFS_REFERENCE_OFFSET + 10 * Math.log10(meanSquare)
}

export function computeShortTermLufsFromFreqData(data: Uint8Array): number {
  let sum = 0
  for (let i = 0; i < data.length; i++) {
    const n = data[i] / 255
    sum += n * n
  }
  const meanSquare = sum / data.length
  if (meanSquare === 0) return -Infinity
  return LUFS_REFERENCE_OFFSET + 10 * Math.log10(meanSquare)
}
