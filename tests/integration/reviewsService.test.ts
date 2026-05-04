import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('@/lib/supabaseServer', () => ({
  createClient: vi.fn().mockResolvedValue({}),
}))

describe('reviewsService (dev mode)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_DEV_MODE = 'true'
    vi.resetModules()
  })

  it('returns mock reviews in dev mode', async () => {
    const { getAllReviews } = await import('@/services/reviewsService')
    const result = await getAllReviews()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data[0]).toHaveProperty('clientName')
      expect(result.data[0]).toHaveProperty('rating')
      expect(result.data[0]).toHaveProperty('text')
    }
  })
})

describe('reviewsService (production, empty DB)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_DEV_MODE = 'false'
    vi.resetModules()
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('falls back to demo data when Supabase returns empty array', async () => {
    vi.doMock('@/lib/supabaseServer', () => ({
      createClient: vi.fn().mockResolvedValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          }),
        }),
      }),
    }))
    const { getAllReviews } = await import('@/services/reviewsService')
    const result = await getAllReviews()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.length).toBeGreaterThan(0)
    }
  })
})
