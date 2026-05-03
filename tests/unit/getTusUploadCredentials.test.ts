/**
 * Smoke tests for getTusUploadCredentials server action.
 *
 * Verifies that the action throws when no admin session is present.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Mock requireAdmin ─────────────────────────────────────────────────────────
// The action calls requireAdmin() which redirects if not authenticated.
// We test the two cases: admin present (happy path) and no session (throws).

vi.mock('@/app/admin/_actions/auth', () => ({
  requireAdmin: vi.fn(),
}))

vi.mock('@/lib/supabaseServer', () => ({
  createClient: vi.fn(),
}))

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('getTusUploadCredentials', () => {
  const originalEnv = process.env.NEXT_PUBLIC_SUPABASE_URL

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
    vi.resetModules()
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv
  })

  it('throws when there is no active session (even after passing requireAdmin)', async () => {
    const { requireAdmin } = await import('@/app/admin/_actions/auth')
    const { createClient } = await import('@/lib/supabaseServer')

    vi.mocked(requireAdmin).mockResolvedValue({
      id: 'user-id',
      email: 'admin@test.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '',
    })

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const { getTusUploadCredentials } = await import('@/app/admin/_actions/uploads')

    await expect(getTusUploadCredentials()).rejects.toThrow('Unauthorized')
  })

  it('returns endpoint, token and bucketName when session exists', async () => {
    const { requireAdmin } = await import('@/app/admin/_actions/auth')
    const { createClient } = await import('@/lib/supabaseServer')

    vi.mocked(requireAdmin).mockResolvedValue({
      id: 'user-id',
      email: 'admin@test.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '',
    })

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { access_token: 'test-token-abc' } },
        }),
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const { getTusUploadCredentials } = await import('@/app/admin/_actions/uploads')
    const creds = await getTusUploadCredentials()

    expect(creds.token).toBe('test-token-abc')
    expect(creds.bucketName).toBe('audio-files')
    expect(creds.endpoint).toContain('/storage/v1/upload/resumable')
  })
})
