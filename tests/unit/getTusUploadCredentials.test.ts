/**
 * @deprecated getTusUploadCredentials was removed (TUS is no longer used).
 * Audio uploads now use S3 Multipart via useR2MultipartUpload.
 * This file is kept as a stub to avoid breaking imports; it simply passes.
 */

import { describe, it, expect } from 'vitest'

describe('createSignedUploadUrl (replaces getTusUploadCredentials)', () => {
  it('exports createSignedUploadUrl from uploads.ts', async () => {
    const { createSignedUploadUrl } = await import('@/app/admin/_actions/uploads')
    expect(typeof createSignedUploadUrl).toBe('function')
  })

  it('does not export getTusUploadCredentials (removed)', async () => {
    const uploads = await import('@/app/admin/_actions/uploads')
    expect((uploads as Record<string, unknown>).getTusUploadCredentials).toBeUndefined()
  })
})
