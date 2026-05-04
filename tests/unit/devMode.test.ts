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

describe('hideDemoFallback flag', () => {
  const ORIGINAL = process.env.NEXT_PUBLIC_HIDE_DEMO_FALLBACK

  afterEach(() => {
    if (ORIGINAL === undefined) {
      delete process.env.NEXT_PUBLIC_HIDE_DEMO_FALLBACK
    } else {
      process.env.NEXT_PUBLIC_HIDE_DEMO_FALLBACK = ORIGINAL
    }
    vi.resetModules()
  })

  it('is false by default (env var absent)', async () => {
    delete process.env.NEXT_PUBLIC_HIDE_DEMO_FALLBACK
    const { hideDemoFallback } = await import('@/lib/devMode')
    expect(hideDemoFallback).toBe(false)
  })

  it('is true when NEXT_PUBLIC_HIDE_DEMO_FALLBACK=true', async () => {
    process.env.NEXT_PUBLIC_HIDE_DEMO_FALLBACK = 'true'
    const { hideDemoFallback } = await import('@/lib/devMode')
    expect(hideDemoFallback).toBe(true)
  })

  it('is false when NEXT_PUBLIC_HIDE_DEMO_FALLBACK=false', async () => {
    process.env.NEXT_PUBLIC_HIDE_DEMO_FALLBACK = 'false'
    const { hideDemoFallback } = await import('@/lib/devMode')
    expect(hideDemoFallback).toBe(false)
  })
})
