import { describe, it, expect } from 'vitest'
import { creditSchema } from '@/lib/schemas/credits'

describe('creditSchema', () => {
  const valid = { name: 'Bullet For My Valentine', role: 'Mix & Master' as const, year: 2022 }

  it('accepts valid credit', () => {
    expect(creditSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects empty name', () => {
    expect(creditSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
  })

  it('rejects invalid role', () => {
    expect(creditSchema.safeParse({ ...valid, role: 'Remixing' }).success).toBe(false)
  })

  it('accepts all valid roles', () => {
    for (const role of ['Mix', 'Master', 'Mix & Master', 'Producing'] as const) {
      expect(creditSchema.safeParse({ ...valid, role }).success).toBe(true)
    }
  })

  it('accepts optional spotifyUrl', () => {
    const r = creditSchema.safeParse({ ...valid, spotifyUrl: 'https://open.spotify.com/track/abc' })
    expect(r.success).toBe(true)
  })

  it('rejects invalid spotifyUrl', () => {
    const r = creditSchema.safeParse({ ...valid, spotifyUrl: 'not-a-url' })
    expect(r.success).toBe(false)
  })
})
