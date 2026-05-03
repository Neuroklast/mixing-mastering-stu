import { describe, it, expect } from 'vitest'
import { galleryImageSchema } from '@/lib/schemas/gallery'

describe('galleryImageSchema', () => {
  it('accepts valid image with absolute url', () => {
    const r = galleryImageSchema.safeParse({ url: 'https://cdn.example.com/img.jpg', alt: 'Studio' })
    expect(r.success).toBe(true)
  })

  it('accepts relative url', () => {
    const r = galleryImageSchema.safeParse({ url: '/media/studio.jpg' })
    expect(r.success).toBe(true)
  })

  it('rejects empty url', () => {
    const r = galleryImageSchema.safeParse({ url: '' })
    expect(r.success).toBe(false)
  })

  it('accepts all optional fields', () => {
    const r = galleryImageSchema.safeParse({
      id: '1',
      url: '/img.jpg',
      alt: 'alt text',
      caption: 'caption',
      order: 3,
    })
    expect(r.success).toBe(true)
  })
})
