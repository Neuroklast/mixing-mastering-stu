import { describe, it, expect } from 'vitest'
import { uploadFileSchema } from '@/services/fileService'

describe('uploadFileSchema', () => {
  it('accepts valid WAV file metadata', () => {
    const result = uploadFileSchema.safeParse({
      orderId: '550e8400-e29b-41d4-a716-446655440000',
      mimeType: 'audio/wav',
      fileSizeBytes: 1024 * 1024 * 10,
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid MP3 file metadata', () => {
    const result = uploadFileSchema.safeParse({
      orderId: '550e8400-e29b-41d4-a716-446655440000',
      mimeType: 'audio/mpeg',
      fileSizeBytes: 1024 * 1024 * 5,
    })
    expect(result.success).toBe(true)
  })

  it('rejects disallowed MIME type', () => {
    const result = uploadFileSchema.safeParse({
      orderId: '550e8400-e29b-41d4-a716-446655440000',
      mimeType: 'video/mp4',
      fileSizeBytes: 1024,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Only WAV and MP3 files are supported')
    }
  })

  it('rejects file exceeding 200 MB', () => {
    const oversizedBytes = 201 * 1024 * 1024
    const result = uploadFileSchema.safeParse({
      orderId: '550e8400-e29b-41d4-a716-446655440000',
      mimeType: 'audio/wav',
      fileSizeBytes: oversizedBytes,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('File must not exceed 200 MB')
    }
  })

  it('rejects invalid UUID for orderId', () => {
    const result = uploadFileSchema.safeParse({
      orderId: 'not-a-uuid',
      mimeType: 'audio/wav',
      fileSizeBytes: 1024,
    })
    expect(result.success).toBe(false)
  })
})
