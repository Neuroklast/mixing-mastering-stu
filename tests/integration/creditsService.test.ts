import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/lib/supabaseServer', () => ({
  createClient: vi.fn().mockResolvedValue({}),
}))

describe('creditsService (dev mode)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_DEV_MODE = 'true'
    vi.resetModules()
  })

  it('returns mock credits in dev mode', async () => {
    const { getAllCredits } = await import('@/services/creditsService')
    const result = await getAllCredits()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data[0]).toHaveProperty('name')
      expect(result.data[0]).toHaveProperty('role')
    }
  })
})
