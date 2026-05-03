import { describe, it, expect, beforeEach, vi } from 'vitest'

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
