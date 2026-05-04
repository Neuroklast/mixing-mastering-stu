import { describe, it, expect, afterEach, vi } from 'vitest'

// Re-import the config with a clean module registry so env changes take effect.
async function loadConfig(env: Record<string, string | undefined> = {}) {
  vi.resetModules()
  const saved: Record<string, string | undefined> = {}
  for (const [k, v] of Object.entries(env)) {
    saved[k] = process.env[k]
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
  const mod = await import('../../next.config.mjs')
  // Restore
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
  return mod.default
}

describe('next.config.mjs remotePatterns', () => {
  afterEach(() => {
    vi.resetModules()
  })

  it('always includes *.r2.cloudflarestorage.com (R2 default S3 endpoint)', async () => {
    const config = await loadConfig({ R2_PUBLIC_HOST: undefined })
    const patterns = config.images?.remotePatterns ?? []
    const r2Pattern = patterns.find(
      (p: { hostname: string }) => p.hostname === '*.r2.cloudflarestorage.com',
    )
    expect(r2Pattern).toBeDefined()
    expect(r2Pattern?.protocol).toBe('https')
  })

  it('includes legacy *.supabase.co pattern', async () => {
    const config = await loadConfig({ R2_PUBLIC_HOST: undefined })
    const patterns = config.images?.remotePatterns ?? []
    expect(patterns.some((p: { hostname: string }) => p.hostname === '*.supabase.co')).toBe(true)
  })

  it('adds R2_PUBLIC_HOST when set as a full URL', async () => {
    const config = await loadConfig({ R2_PUBLIC_HOST: 'https://pub-abc123.r2.dev' })
    const patterns = config.images?.remotePatterns ?? []
    expect(patterns.some((p: { hostname: string }) => p.hostname === 'pub-abc123.r2.dev')).toBe(true)
  })

  it('adds R2_PUBLIC_HOST when set as a bare hostname', async () => {
    const config = await loadConfig({ R2_PUBLIC_HOST: 'media.example.com' })
    const patterns = config.images?.remotePatterns ?? []
    expect(patterns.some((p: { hostname: string }) => p.hostname === 'media.example.com')).toBe(true)
  })

  it('does not crash when R2_PUBLIC_HOST is unset', async () => {
    await expect(loadConfig({ R2_PUBLIC_HOST: undefined })).resolves.toBeDefined()
  })

  it('strips trailing slash from R2_PUBLIC_HOST', async () => {
    const config = await loadConfig({ R2_PUBLIC_HOST: 'https://media.example.com/' })
    const patterns = config.images?.remotePatterns ?? []
    expect(patterns.some((p: { hostname: string }) => p.hostname === 'media.example.com')).toBe(true)
  })
})
