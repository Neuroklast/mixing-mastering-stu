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
})
