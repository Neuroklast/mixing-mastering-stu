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

describe('creditsService (production)', () => {
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

  it('prefers cover_storage_path over cover_image_url', async () => {
    const mockCoverUrl = 'https://r2.example.com/covers/album.jpg'
    vi.doMock('@/lib/storage', () => ({
      getStorageProvider: vi.fn().mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue(mockCoverUrl),
      }),
    }))
    vi.doMock('@/lib/supabaseServer', () => ({
      createClient: vi.fn().mockResolvedValue({
        from: () => ({
          select: () => ({
            order: () => ({
              limit: () =>
                Promise.resolve({
                  data: [
                    {
                      id: '10',
                      name: 'Test Band',
                      role: 'Mix & Master',
                      year: 2025,
                      spotify_url: null,
                      cover_image_url: 'https://legacy-url.example.com/cover.jpg',
                      cover_storage_path: 'covers/album.jpg',
                      featured: true,
                    },
                  ],
                  error: null,
                }),
            }),
          }),
        }),
      }),
    }))

    const { getAllCredits } = await import('@/services/creditsService')
    const result = await getAllCredits()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(1)
      expect(result.data[0].coverImage?.url).toBe(mockCoverUrl)
    }
  })

  it('falls back to cover_image_url when cover_storage_path is null', async () => {
    const legacyUrl = 'https://old-host.example.com/cover.jpg'
    vi.doMock('@/lib/storage', () => ({
      getStorageProvider: vi.fn().mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue('https://r2.example.com/x.jpg'),
      }),
    }))
    vi.doMock('@/lib/supabaseServer', () => ({
      createClient: vi.fn().mockResolvedValue({
        from: () => ({
          select: () => ({
            order: () => ({
              limit: () =>
                Promise.resolve({
                  data: [
                    {
                      id: '11',
                      name: 'Legacy Band',
                      role: 'Master',
                      year: 2024,
                      spotify_url: null,
                      cover_image_url: legacyUrl,
                      cover_storage_path: null,
                      featured: false,
                    },
                  ],
                  error: null,
                }),
            }),
          }),
        }),
      }),
    }))

    const { getAllCredits } = await import('@/services/creditsService')
    const result = await getAllCredits()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(1)
      expect(result.data[0].coverImage?.url).toBe(legacyUrl)
    }
  })

  it('respects hideDemoFallback: returns empty array when DB is empty', async () => {
    process.env.NEXT_PUBLIC_HIDE_DEMO_FALLBACK = 'true'
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
        getPublicUrl: vi.fn().mockReturnValue('https://r2.example.com/x.jpg'),
      }),
    }))

    const { getAllCredits } = await import('@/services/creditsService')
    const result = await getAllCredits()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(0)
    }
  })
})
