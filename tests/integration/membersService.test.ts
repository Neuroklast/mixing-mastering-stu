import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('@/lib/supabaseServer', () => ({
  createClient: vi.fn().mockResolvedValue({}),
}))

describe('membersService (dev mode)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_DEV_MODE = 'true'
    vi.resetModules()
  })

  it('returns demo members in dev mode', async () => {
    const { getActiveMembers } = await import('@/services/membersService')
    const result = await getActiveMembers()
    expect(result.success).toBe(true)
    const members = result.success ? result.data : []
    expect(members.length).toBeGreaterThan(0)
    expect(members[0]).toHaveProperty('name')
    expect(members[0]).toHaveProperty('role')
  })

  it('demo members include featured field and Zardonic is featured', async () => {
    const { getActiveMembers } = await import('@/services/membersService')
    const result = await getActiveMembers()
    expect(result.success).toBe(true)
    const members = result.success ? result.data : []
    expect(members[0]).toHaveProperty('featured')
    const zardonic = members.find((m) => m.name.toLowerCase().includes('zardonic'))
    expect(zardonic?.featured).toBe(true)
  })
})

describe('membersService (production, empty DB)', () => {
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
      getStorageProvider: vi.fn().mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue('https://r2.example.com/photo.jpg'),
      }),
    }))
    const { getActiveMembers } = await import('@/services/membersService')
    const result = await getActiveMembers()
    expect(result.success).toBe(true)
    const members = result.success ? result.data : []
    expect(members.length).toBeGreaterThan(0)
  })

  it('parses featured field from DB rows', async () => {
    vi.doMock('@/lib/supabaseServer', () => ({
      createClient: vi.fn().mockResolvedValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () =>
                Promise.resolve({
                  data: [
                    {
                      id: '00000000-0000-0000-0000-000000000001',
                      name: 'Test Engineer',
                      role: 'Engineer',
                      bio: 'A bio',
                      photo_url: null,
                      photo_storage_path: null,
                      social_links: {},
                      display_order: 0,
                      active: true,
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
    vi.doMock('@/lib/storage', () => ({
      getStorageProvider: vi.fn().mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue('https://r2.example.com/photo.jpg'),
      }),
    }))
    const { getActiveMembers } = await import('@/services/membersService')
    const result = await getActiveMembers()
    expect(result.success).toBe(true)
    const members = result.success ? result.data : []
    expect(members).toHaveLength(1)
    expect(members[0].featured).toBe(true)
  })

  it('builds photo_url from photo_storage_path via storage provider', async () => {
    const mockPhotoUrl = 'https://r2.example.com/members/photo.jpg'
    vi.doMock('@/lib/storage', () => ({
      getStorageProvider: vi.fn().mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue(mockPhotoUrl),
      }),
    }))
    vi.doMock('@/lib/supabaseServer', () => ({
      createClient: vi.fn().mockResolvedValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () =>
                Promise.resolve({
                  data: [
                    {
                      id: '00000000-0000-0000-0000-000000000002',
                      name: 'Photo Member',
                      role: 'Engineer',
                      bio: null,
                      photo_url: null,
                      photo_storage_path: 'members/photo.jpg',
                      social_links: {},
                      display_order: 0,
                      active: true,
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

    const { getActiveMembers } = await import('@/services/membersService')
    const result = await getActiveMembers()
    expect(result.success).toBe(true)
    const members = result.success ? result.data : []
    expect(members).toHaveLength(1)
    expect(members[0].photo_url).toBe(mockPhotoUrl)
  })

  it('respects hideDemoFallback: returns empty array when DB is empty', async () => {
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
      getStorageProvider: vi.fn().mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue('https://r2.example.com/photo.jpg'),
      }),
    }))

    const { getActiveMembers } = await import('@/services/membersService')
    const result = await getActiveMembers()
    expect(result.success).toBe(true)
    const members = result.success ? result.data : []
    expect(members).toHaveLength(0)
  })
})
