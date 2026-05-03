import { describe, it, expect, afterEach, vi } from 'vitest'

describe('isDev flag', () => {
  const ORIGINAL = process.env.NEXT_PUBLIC_DEV_MODE

  afterEach(() => {
    process.env.NEXT_PUBLIC_DEV_MODE = ORIGINAL
    // Clear module cache so re-import picks up the new env value
    vi.resetModules()
  })

  it('is true when NEXT_PUBLIC_DEV_MODE=true', async () => {
    process.env.NEXT_PUBLIC_DEV_MODE = 'true'
    const { isDev } = await import('@/lib/devMode')
    expect(isDev).toBe(true)
  })

  it('is false when NEXT_PUBLIC_DEV_MODE=false', async () => {
    process.env.NEXT_PUBLIC_DEV_MODE = 'false'
    const { isDev } = await import('@/lib/devMode')
    expect(isDev).toBe(false)
  })
})
