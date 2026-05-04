import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('@/lib/supabaseServer', () => ({
  createClient: vi.fn().mockResolvedValue({}),
}))

describe('galleryService (dev mode)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_DEV_MODE = 'true'
    vi.resetModules()
  })

  it('returns an array in dev mode (may be empty)', async () => {
    const { getAllGalleryImages } = await import('@/services/galleryService')
    const result = await getAllGalleryImages()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(Array.isArray(result.data)).toBe(true)
    }
  })
})

describe('galleryService (production)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_DEV_MODE = 'false'
    process.env.NEXT_PUBLIC_HIDE_DEMO_FALLBACK = 'false'
    vi.resetModules()
  })

  afterEach(() => {
    vi.resetModules()
    delete process.env.NEXT_PUBLIC_HIDE_DEMO_FALLBACK
  })

  it('prefers storage_path over image_url when both are present', async () => {
    const mockPublicUrl = 'https://r2.example.com/gallery/image.jpg'
    vi.doMock('@/lib/storage', () => ({
      getStorageProvider: vi.fn().mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue(mockPublicUrl),
      }),
    }))
    vi.doMock('@/lib/supabaseServer', () => ({
      createClient: vi.fn().mockResolvedValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () =>
                  Promise.resolve({
                    data: [
                      {
                        id: '1',
                        image_url: 'https://legacy.supabase.co/old-url.jpg',
                        storage_path: 'gallery/image.jpg',
                        alt: 'Test image',
                        caption: null,
                        display_order: 0,
                        active: true,
                      },
                    ],
                    error: null,
                  }),
              }),
            }),
          }),
        }),
      }),
    }))

    const { getAllGalleryImages } = await import('@/services/galleryService')
    const result = await getAllGalleryImages()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(1)
      expect(result.data[0].url).toBe(mockPublicUrl)
    }
  })

  it('skips rows with legacy Supabase image_url and no storage_path', async () => {
    vi.doMock('@/lib/storage', () => ({
      getStorageProvider: vi.fn().mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue('https://r2.example.com/x.jpg'),
      }),
    }))
    vi.doMock('@/lib/supabaseServer', () => ({
      createClient: vi.fn().mockResolvedValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () =>
                  Promise.resolve({
                    data: [
                      {
                        id: '2',
                        image_url: 'https://owmsqgug.supabase.co/storage/v1/image.jpg',
                        storage_path: null,
                        alt: 'Legacy',
                        caption: null,
                        display_order: 0,
                        active: true,
                      },
                    ],
                    error: null,
                  }),
              }),
            }),
          }),
        }),
      }),
    }))

    const { getAllGalleryImages } = await import('@/services/galleryService')
    const result = await getAllGalleryImages()
    // Legacy-only row is skipped; falls back to DEMO_GALLERY (empty array)
    expect(result.success).toBe(true)
    if (result.success) {
      // The skipped row is not included in the output
      const legacyRows = result.data.filter((img) => img.url.includes('supabase.co'))
      expect(legacyRows).toHaveLength(0)
    }
  })

  it('respects hideDemoFallback: returns empty array when DB is empty', async () => {
    process.env.NEXT_PUBLIC_HIDE_DEMO_FALLBACK = 'true'
    vi.doMock('@/lib/storage', () => ({
      getStorageProvider: vi.fn().mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue('https://r2.example.com/x.jpg'),
      }),
    }))
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

    const { getAllGalleryImages } = await import('@/services/galleryService')
    const result = await getAllGalleryImages()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(0)
    }
  })
})
