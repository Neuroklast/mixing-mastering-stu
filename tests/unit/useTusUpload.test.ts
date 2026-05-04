/**
 * @deprecated TUS uploads have been replaced by S3 Multipart via useR2MultipartUpload.
 * useTusUpload now re-exports useR2MultipartUpload for backward compatibility.
 * The real tests for multipart upload logic live in tests/unit/useR2MultipartUpload.test.ts.
 */

import { describe, it, expect } from 'vitest'

describe('useTusUpload (deprecated re-export)', () => {
  it('re-exports useR2MultipartUpload as useTusUpload', async () => {
    const { useTusUpload } = await import('@/hooks/useTusUpload')
    expect(typeof useTusUpload).toBe('function')
  })
})
