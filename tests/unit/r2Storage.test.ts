import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { _resetStorageProvider } from '@/lib/storage'

// Re-import r2StorageProvider with fresh env on each test
async function loadR2Provider(env: Record<string, string | undefined> = {}) {
  vi.resetModules()
  const saved: Record<string, string | undefined> = {}
  for (const [k, v] of Object.entries(env)) {
    saved[k] = process.env[k]
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
  const mod = await import('@/lib/storage/r2')
  // Restore
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
  return mod.r2StorageProvider
}

describe('r2StorageProvider.getPublicUrl', () => {
  afterEach(() => {
    vi.resetModules()
    _resetStorageProvider()
  })

  it('returns correct URL when R2_PUBLIC_HOST is a bare hostname', async () => {
    const provider = await loadR2Provider({ R2_PUBLIC_HOST: 'pub-xyz.r2.dev' })
    expect(provider.getPublicUrl('sonorativa-media', 'gallery/foo.jpg')).toBe(
      'https://pub-xyz.r2.dev/gallery/foo.jpg',
    )
  })

  it('strips https:// protocol prefix from R2_PUBLIC_HOST', async () => {
    const provider = await loadR2Provider({ R2_PUBLIC_HOST: 'https://pub-xyz.r2.dev' })
    expect(provider.getPublicUrl('sonorativa-media', 'gallery/foo.jpg')).toBe(
      'https://pub-xyz.r2.dev/gallery/foo.jpg',
    )
  })

  it('strips http:// protocol prefix from R2_PUBLIC_HOST', async () => {
    const provider = await loadR2Provider({ R2_PUBLIC_HOST: 'http://media.example.com/' })
    expect(provider.getPublicUrl('sonorativa-media', 'gallery/foo.jpg')).toBe(
      'https://media.example.com/gallery/foo.jpg',
    )
  })

  it('strips trailing slash from bare hostname', async () => {
    const provider = await loadR2Provider({ R2_PUBLIC_HOST: 'media.example.com/' })
    expect(provider.getPublicUrl('sonorativa-media', 'gallery/foo.jpg')).toBe(
      'https://media.example.com/gallery/foo.jpg',
    )
  })

  it('preserves path prefix in R2_PUBLIC_HOST', async () => {
    const provider = await loadR2Provider({ R2_PUBLIC_HOST: 'pub-xyz.r2.dev/cdn' })
    expect(provider.getPublicUrl('sonorativa-media', 'gallery/foo.jpg')).toBe(
      'https://pub-xyz.r2.dev/cdn/gallery/foo.jpg',
    )
  })

  it('preserves path prefix even when protocol is stripped', async () => {
    const provider = await loadR2Provider({ R2_PUBLIC_HOST: 'https://pub-xyz.r2.dev/cdn/' })
    expect(provider.getPublicUrl('sonorativa-media', 'gallery/foo.jpg')).toBe(
      'https://pub-xyz.r2.dev/cdn/gallery/foo.jpg',
    )
  })

  it('URL-encodes path segments with special characters', async () => {
    const provider = await loadR2Provider({ R2_PUBLIC_HOST: 'pub-xyz.r2.dev' })
    expect(provider.getPublicUrl('sonorativa-media', 'gallery/my photo.jpg')).toBe(
      'https://pub-xyz.r2.dev/gallery/my%20photo.jpg',
    )
  })

  it('throws when R2_PUBLIC_HOST is not set', async () => {
    const provider = await loadR2Provider({ R2_PUBLIC_HOST: undefined })
    expect(() => provider.getPublicUrl('sonorativa-media', 'gallery/foo.jpg')).toThrow(
      'Missing R2_PUBLIC_HOST',
    )
  })
})
