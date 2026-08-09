import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('@/lib/supabaseServer', () => ({
  createClient: vi.fn().mockResolvedValue({}),
}))

describe('partnersService (dev mode)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_DEV_MODE = 'true'
    vi.resetModules()
  })

  it('returns demo partners in dev mode', async () => {
    const { getAllPartners } = await import('@/services/partnersService')
    const result = await getAllPartners()
    expect(result.success).toBe(true)
    const partners = result.success ? result.data : []
    expect(partners.length).toBeGreaterThan(0)
    expect(partners[0]).toHaveProperty('name')
    expect(partners[0]).toHaveProperty('category')
  })

  it('includes endorsement and partner categories', async () => {
    const { getAllPartners } = await import('@/services/partnersService')
    const result = await getAllPartners()
    expect(result.success).toBe(true)
    const partners = result.success ? result.data : []
    const categories = new Set(partners.map((p) => p.category))
    expect(categories.has('endorsement') || categories.has('partner')).toBe(true)
  })
})

describe('partnersService (production, empty DB)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_DEV_MODE = 'false'
    process.env.NEXT_PUBLIC_HIDE_DEMO_FALLBACK = 'false'
    vi.resetModules()
  })

  afterEach(() => {
    vi.resetModules()
    delete process.env.NEXT_PUBLIC_HIDE_DEMO_FALLBACK
  })

  it('falls back to demo data when Supabase returns empty array', async () => {
    vi.doMock('@/lib/supabaseServer', () => ({
      createClient: vi.fn().mockResolvedValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      }),
    }))
    vi.doMock('@/lib/storage', () => ({
      getStorageProvider: () => ({
        getPublicUrl: vi.fn(),
      }),
    }))

    const { getAllPartners } = await import('@/services/partnersService')
    const result = await getAllPartners()
    expect(result.success).toBe(true)
    const partners = result.success ? result.data : []
    expect(partners.length).toBeGreaterThan(0)
  })

  it('returns empty array when demo fallback is hidden', async () => {
    process.env.NEXT_PUBLIC_HIDE_DEMO_FALLBACK = 'true'
    vi.doMock('@/lib/supabaseServer', () => ({
      createClient: vi.fn().mockResolvedValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      }),
    }))
    vi.doMock('@/lib/storage', () => ({
      getStorageProvider: () => ({
        getPublicUrl: vi.fn(),
      }),
    }))

    const { getAllPartners } = await import('@/services/partnersService')
    const result = await getAllPartners()
    expect(result.success).toBe(true)
    const partners = result.success ? result.data : []
    expect(partners).toEqual([])
  })
})
