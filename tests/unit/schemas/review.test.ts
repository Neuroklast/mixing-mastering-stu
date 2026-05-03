import { describe, it, expect } from 'vitest'
import { reviewSchema } from '@/lib/schemas/review'

describe('reviewSchema', () => {
  const valid = {
    clientName: 'Marcus T.',
    rating: 5,
    text: 'Amazing job.',
    service: 'Master' as const,
    date: '2025-11-12',
  }

  it('accepts a fully valid review', () => {
    expect(reviewSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects empty clientName', () => {
    const r = reviewSchema.safeParse({ ...valid, clientName: '' })
    expect(r.success).toBe(false)
  })

  it('rejects rating below 1', () => {
    const r = reviewSchema.safeParse({ ...valid, rating: 0 })
    expect(r.success).toBe(false)
  })

  it('rejects rating above 5', () => {
    const r = reviewSchema.safeParse({ ...valid, rating: 6 })
    expect(r.success).toBe(false)
  })

  it('rejects invalid service value', () => {
    const r = reviewSchema.safeParse({ ...valid, service: 'Production' })
    expect(r.success).toBe(false)
  })

  it('accepts optional fields as undefined', () => {
    const r = reviewSchema.safeParse({ clientName: 'X', rating: 4, text: 'Good' })
    expect(r.success).toBe(true)
  })

  it('rejects invalid projectLink', () => {
    const r = reviewSchema.safeParse({ ...valid, projectLink: 'not-a-url' })
    expect(r.success).toBe(false)
  })

  it('accepts empty string projectLink', () => {
    const r = reviewSchema.safeParse({ ...valid, projectLink: '' })
    expect(r.success).toBe(true)
  })

  it('accepts valid URL projectLink', () => {
    const r = reviewSchema.safeParse({ ...valid, projectLink: 'https://example.com/project' })
    expect(r.success).toBe(true)
  })
})
