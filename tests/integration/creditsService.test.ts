import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

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

describe('creditsService (production, empty DB)', () => {
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
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      }),
    }))
    vi.doMock('@/lib/storage', () => ({
      getStorageProvider: vi.fn().mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue('https://r2.example.com/cover.jpg'),
        createSignedDownloadUrl: vi.fn(),
      }),
    }))
    const { getAllCredits } = await import('@/services/creditsService')
    const result = await getAllCredits()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.length).toBeGreaterThan(0)
    }
  })
})
