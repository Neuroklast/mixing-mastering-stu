import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({
    find: vi.fn().mockResolvedValue({ docs: [] }),
  }),
}))

describe('showcaseService (dev mode)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_DEV_MODE = 'true'
    vi.resetModules()
  })

  it('getActiveShowcaseTrack returns mock track', async () => {
    const { getActiveShowcaseTrack } = await import('@/services/showcaseService')
    const track = await getActiveShowcaseTrack()
    expect(track).not.toBeNull()
    expect(track?.beforeUrl).toBeDefined()
    expect(track?.afterUrl).toBeDefined()
  })

  it('getAllShowcaseTracks returns array with at least one track', async () => {
    const { getAllShowcaseTracks } = await import('@/services/showcaseService')
    const tracks = await getAllShowcaseTracks()
    expect(tracks.length).toBeGreaterThan(0)
  })
})
