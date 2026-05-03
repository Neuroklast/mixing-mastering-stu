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
    const members = await getActiveMembers()
    expect(members.length).toBeGreaterThan(0)
    expect(members[0]).toHaveProperty('name')
    expect(members[0]).toHaveProperty('role')
  })

  it('demo members include featured field and Zardonic is featured', async () => {
    const { getActiveMembers } = await import('@/services/membersService')
    const members = await getActiveMembers()
    expect(members[0]).toHaveProperty('featured')
    const zardonic = members.find((m) => m.name.toLowerCase().includes('zardonic'))
    expect(zardonic?.featured).toBe(true)
  })
})

describe('membersService (production, empty DB)', () => {
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
            eq: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      }),
    }))
    const { getActiveMembers } = await import('@/services/membersService')
    const members = await getActiveMembers()
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
    const { getActiveMembers } = await import('@/services/membersService')
    const members = await getActiveMembers()
    expect(members).toHaveLength(1)
    expect(members[0].featured).toBe(true)
  })
})
