import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('@/lib/supabaseServer', () => ({
  createClient: vi.fn().mockResolvedValue({}),
}))

describe('showcaseService (dev mode)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_DEV_MODE = 'true'
    vi.resetModules()
  })

  it('getActiveShowcaseTrack returns mock track', async () => {
    const { getActiveShowcaseTrack } = await import('@/services/showcaseService')
    const result = await getActiveShowcaseTrack()
    expect(result.success).toBe(true)
    const track = result.success ? result.data : null
    expect(track).not.toBeNull()
    expect(track?.beforeUrl).toBeDefined()
    expect(track?.afterUrl).toBeDefined()
  })

  it('getAllShowcaseTracks returns array with at least one track', async () => {
    const { getAllShowcaseTracks } = await import('@/services/showcaseService')
    const result = await getAllShowcaseTracks()
    expect(result.success).toBe(true)
    const tracks = result.success ? result.data : []
    expect(tracks.length).toBeGreaterThan(0)
  })
})

describe('showcaseService (production, with storage paths)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_DEV_MODE = 'false'
    vi.resetModules()
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('getActiveShowcaseTrack generates signed URLs via R2 storage provider', async () => {
    const mockSignedUrl = 'https://r2.example.com/signed-url'
    vi.doMock('@/lib/storage', () => ({
      getStorageProvider: vi.fn().mockReturnValue({
        createSignedDownloadUrl: vi.fn().mockResolvedValue(mockSignedUrl),
        getPublicUrl: vi.fn(),
      }),
    }))
    vi.doMock('@/lib/supabaseServer', () => ({
      createClient: vi.fn().mockResolvedValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: () =>
                    Promise.resolve({
                      data: {
                        id: 1,
                        title: 'IGNITE',
                        artist: 'Test Artist',
                        before_storage_path: 'track/before-1777907171440.wav',
                        after_storage_path: 'track/after-1777907165593.wav',
                        before_url: null,
                        after_url: null,
                        active: true,
                        display_order: 0,
                        label_before: 'Raw',
                        label_after: 'Mastered',
                        start_marker: 0,
                        lufs_target: -14,
                      },
                      error: null,
                    }),
                }),
              }),
            }),
          }),
        }),
      }),
    }))

    const { getActiveShowcaseTrack } = await import('@/services/showcaseService')
    const result = await getActiveShowcaseTrack()

    expect(result.success).toBe(true)
    const track = result.success ? result.data : null
    expect(track).not.toBeNull()
    expect(track?.title).toBe('IGNITE')
    expect(track?.beforeUrl).toBe(mockSignedUrl)
    expect(track?.afterUrl).toBe(mockSignedUrl)
  })

  it('getActiveShowcaseTrack returns null when storage paths missing and no direct URLs', async () => {
    vi.doMock('@/lib/storage', () => ({
      getStorageProvider: vi.fn().mockReturnValue({
        createSignedDownloadUrl: vi.fn().mockResolvedValue('https://r2.example.com/url'),
        getPublicUrl: vi.fn(),
      }),
    }))
    vi.doMock('@/lib/supabaseServer', () => ({
      createClient: vi.fn().mockResolvedValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: () =>
                    Promise.resolve({
                      data: {
                        id: 2,
                        title: 'No Audio',
                        before_storage_path: null,
                        after_storage_path: null,
                        before_url: null,
                        after_url: null,
                        active: true,
                        display_order: 0,
                      },
                      error: null,
                    }),
                }),
              }),
            }),
          }),
        }),
      }),
    }))

    const { getActiveShowcaseTrack } = await import('@/services/showcaseService')
    const result = await getActiveShowcaseTrack()
    const track = result.success ? result.data : null
    expect(track).toBeNull()
  })

  it('getAllShowcaseTracks builds signed URLs for all tracks with storage paths', async () => {
    const mockSignedUrl = 'https://r2.example.com/track-signed'
    vi.doMock('@/lib/storage', () => ({
      getStorageProvider: vi.fn().mockReturnValue({
        createSignedDownloadUrl: vi.fn().mockResolvedValue(mockSignedUrl),
        getPublicUrl: vi.fn(),
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
                        id: 1,
                        title: 'IGNITE',
                        before_storage_path: 'track/before.wav',
                        after_storage_path: 'track/after.wav',
                        before_url: null,
                        after_url: null,
                        active: true,
                        display_order: 0,
                        label_before: 'Demo',
                        label_after: 'Final',
                        start_marker: 0,
                        lufs_target: -14,
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

    const { getAllShowcaseTracks } = await import('@/services/showcaseService')
    const result = await getAllShowcaseTracks()

    expect(result.success).toBe(true)
    const tracks = result.success ? result.data : []
    expect(tracks).toHaveLength(1)
    expect(tracks[0].beforeUrl).toBe(mockSignedUrl)
    expect(tracks[0].afterUrl).toBe(mockSignedUrl)
  })
})

describe('showcaseService (regression: no direct supabase.storage calls)', () => {
  it('showcaseService source does not import supabase.storage directly', async () => {
    // Read source and assert it doesn't contain direct supabase storage calls
    const fs = await import('fs')
    const path = await import('path')
    const src = fs.readFileSync(
      path.resolve(process.cwd(), 'services/showcaseService.ts'),
      'utf-8',
    )
    expect(src).not.toContain('supabase.storage')
    expect(src).not.toContain("from('audio-files')")
    expect(src).not.toContain('.createSignedUrl(')
  })
})
