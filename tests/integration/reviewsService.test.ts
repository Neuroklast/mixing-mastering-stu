import { describe, it, expect, beforeEach, vi } from 'vitest'

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
