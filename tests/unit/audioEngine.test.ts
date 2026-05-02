import { describe, it, expect } from 'vitest'
import { showcaseTrackSchema } from '@/lib/schemas/showcase'
import { computeIntegratedLufs } from '@/hooks/useAudioEngine'

// ─── Schema validation tests ──────────────────────────────────────────────────

describe('showcaseTrackSchema', () => {
  const base = {
    title: 'Test Track',
    beforeUrl: '/demo/before.wav',
    afterUrl: '/demo/after.wav',
  }

  it('accepts root-relative paths starting with /', () => {
    const result = showcaseTrackSchema.safeParse(base)
    expect(result.success).toBe(true)
  })

  it('accepts absolute http URLs', () => {
    const result = showcaseTrackSchema.safeParse({
      ...base,
      beforeUrl: 'http://example.com/before.wav',
      afterUrl: 'http://example.com/after.wav',
    })
    expect(result.success).toBe(true)
  })

  it('accepts absolute https URLs', () => {
    const result = showcaseTrackSchema.safeParse({
      ...base,
      beforeUrl: 'https://cdn.example.com/before.wav',
      afterUrl: 'https://cdn.example.com/after.wav',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty string URLs', () => {
    const result = showcaseTrackSchema.safeParse({ ...base, beforeUrl: '' })
    expect(result.success).toBe(false)
  })

  it('rejects relative paths not starting with /', () => {
    const result = showcaseTrackSchema.safeParse({ ...base, beforeUrl: 'demo/before.wav' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toMatch(/root-relative path/)
    }
  })

  it('accepts protocol-relative paths starting with //', () => {
    // Protocol-relative URLs start with / so they pass the root-relative check
    const result = showcaseTrackSchema.safeParse({ ...base, beforeUrl: '//cdn.example.com/a.wav' })
    expect(result.success).toBe(true)
  })

  it('accepts all optional fields', () => {
    const result = showcaseTrackSchema.safeParse({
      ...base,
      id: 'abc123',
      artist: 'Artist Name',
      genre: 'Metal',
      equipment: 'FL Studio · SSL',
      labelBefore: 'Raw Mix',
      labelAfter: 'Zardonic Master',
      startMarker: 84,
      lufsTarget: -14,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.startMarker).toBe(84)
      expect(result.data.labelBefore).toBe('Raw Mix')
      expect(result.data.labelAfter).toBe('Zardonic Master')
      expect(result.data.lufsTarget).toBe(-14)
    }
  })

  it('rejects startMarker below 0', () => {
    const result = showcaseTrackSchema.safeParse({ ...base, startMarker: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects empty title', () => {
    const result = showcaseTrackSchema.safeParse({ ...base, title: '' })
    expect(result.success).toBe(false)
  })
})

// ─── LUFS computation tests ───────────────────────────────────────────────────

describe('computeIntegratedLufs', () => {
  it('returns -Infinity for a silent (all-zero) buffer', () => {
    const silence = new Float32Array(1024)
    const result = computeIntegratedLufs(silence)
    expect(result).toBe(-Infinity)
  })

  it('returns a finite negative value for a non-silent buffer', () => {
    const signal = new Float32Array(1024).fill(0.5)
    const result = computeIntegratedLufs(signal)
    expect(isFinite(result)).toBe(true)
    expect(result).toBeLessThan(0)
  })

  it('louder signal yields higher (less negative) LUFS value', () => {
    const quiet = new Float32Array(1024).fill(0.1)
    const loud = new Float32Array(1024).fill(0.9)
    expect(computeIntegratedLufs(loud)).toBeGreaterThan(computeIntegratedLufs(quiet))
  })

  it('full-scale signal produces expected LUFS ballpark', () => {
    // Math.SQRT1_2 ≈ 0.7071; meanSquare = 0.5
    // LUFS = −0.691 + 10*log10(0.5) ≈ −0.691 + (−3.010) ≈ −3.70 LUFS
    const signal = new Float32Array(1024).fill(Math.SQRT1_2)
    const lufs = computeIntegratedLufs(signal)
    expect(lufs).toBeCloseTo(-3.70, 1)
  })

  it('single-sample buffer returns a finite value for non-zero input', () => {
    const single = new Float32Array([0.5])
    const result = computeIntegratedLufs(single)
    // meanSquare = 0.25; LUFS = -0.691 + 10*log10(0.25) ≈ -6.72
    expect(isFinite(result)).toBe(true)
    expect(result).toBeCloseTo(-6.72, 1)
  })

  it('alternating +1/-1 buffer (full-scale AC) yields same LUFS as DC +1', () => {
    // Both have meanSquare = 1.0, so LUFS should be identical
    const ac = new Float32Array(1024)
    for (let i = 0; i < ac.length; i++) ac[i] = i % 2 === 0 ? 1 : -1
    const dc = new Float32Array(1024).fill(1)
    expect(computeIntegratedLufs(ac)).toBeCloseTo(computeIntegratedLufs(dc), 5)
  })

  it('very long buffer (65536 samples) still computes correctly', () => {
    // Fill with 0.5 → meanSquare = 0.25 → LUFS ≈ -6.72
    const long = new Float32Array(65536).fill(0.5)
    const result = computeIntegratedLufs(long)
    expect(isFinite(result)).toBe(true)
    expect(result).toBeCloseTo(-6.72, 1)
  })
})
