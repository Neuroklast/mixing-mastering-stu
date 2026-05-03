// @vitest-environment jsdom

/**
 * Unit tests for useTusUpload hook.
 *
 * tus-js-client is mocked so these tests run without a real Supabase project.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// ── Mock tus-js-client ────────────────────────────────────────────────────────

const mockStart = vi.fn()
const mockFindPreviousUploads = vi.fn().mockResolvedValue([])
const mockResumeFromPreviousUpload = vi.fn()

let capturedOptions: Record<string, unknown> = {}

vi.mock('tus-js-client', () => ({
  Upload: vi.fn().mockImplementation((_file: unknown, options: Record<string, unknown>) => {
    capturedOptions = options
    return {
      start: mockStart,
      findPreviousUploads: mockFindPreviousUploads,
      resumeFromPreviousUpload: mockResumeFromPreviousUpload,
    }
  }),
}))

// ── Mock server action ────────────────────────────────────────────────────────

vi.mock('@/app/admin/_actions/uploads', () => ({
  getTusUploadCredentials: vi.fn().mockResolvedValue({
    endpoint: 'https://project.supabase.co/storage/v1/upload/resumable',
    token: 'mock-access-token',
    bucketName: 'audio-files',
  }),
}))

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useTusUpload', () => {
  beforeEach(() => {
    capturedOptions = {}
    mockStart.mockClear()
    mockFindPreviousUploads.mockClear().mockResolvedValue([])
    mockResumeFromPreviousUpload.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('starts in idle state', async () => {
    const { useTusUpload } = await import('@/hooks/useTusUpload')
    const { result } = renderHook(() => useTusUpload())

    expect(result.current.status).toBe('idle')
    expect(result.current.progress).toBe(0)
    expect(result.current.error).toBeNull()
    expect(result.current.url).toBeNull()
  })

  it('sets status to uploading when upload starts', async () => {
    const { useTusUpload } = await import('@/hooks/useTusUpload')
    const { result } = renderHook(() => useTusUpload())

    const file = new File(['audio data'], 'test.wav', { type: 'audio/wav' })

    // Start upload but don't resolve it yet
    let uploadPromise: Promise<void>
    await act(async () => {
      uploadPromise = result.current.upload(file, 'track-id/before-123.wav')
    })

    // Status should be uploading (tus has started but not completed)
    expect(result.current.status).toBe('uploading')

    // Simulate success via captured onSuccess callback
    await act(async () => {
      const onSuccess = capturedOptions.onSuccess as (() => void) | undefined
      onSuccess?.()
      await uploadPromise!
    })

    expect(result.current.status).toBe('success')
    expect(result.current.url).toBe('track-id/before-123.wav')
    expect(result.current.progress).toBe(1)
  })

  it('updates progress via onProgress callback', async () => {
    const { useTusUpload } = await import('@/hooks/useTusUpload')
    const { result } = renderHook(() => useTusUpload())

    const file = new File(['audio data'], 'test.wav', { type: 'audio/wav' })

    await act(async () => {
      result.current.upload(file, 'track-id/before-123.wav')
    })

    await act(async () => {
      const onProgress = capturedOptions.onProgress as
        | ((sent: number, total: number) => void)
        | undefined
      onProgress?.(3145728, 6291456) // 3 MB of 6 MB = 0.5
    })

    expect(result.current.progress).toBeCloseTo(0.5)
  })

  it('sets error state when upload fails', async () => {
    const { useTusUpload } = await import('@/hooks/useTusUpload')
    const { result } = renderHook(() => useTusUpload())

    const file = new File(['audio data'], 'test.wav', { type: 'audio/wav' })

    let uploadPromise: Promise<void>
    await act(async () => {
      uploadPromise = result.current.upload(file, 'track-id/before-123.wav')
    })

    const uploadError = new Error('Network error')
    await act(async () => {
      const onError = capturedOptions.onError as ((err: Error) => void) | undefined
      onError?.(uploadError)
      await uploadPromise!.catch(() => {})
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe('Network error')
  })

  it('reset() returns hook to idle state', async () => {
    const { useTusUpload } = await import('@/hooks/useTusUpload')
    const { result } = renderHook(() => useTusUpload())

    const file = new File(['audio data'], 'test.wav', { type: 'audio/wav' })

    let uploadPromise: Promise<void>
    await act(async () => {
      uploadPromise = result.current.upload(file, 'track-id/before-123.wav')
    })

    await act(async () => {
      const onSuccess = capturedOptions.onSuccess as (() => void) | undefined
      onSuccess?.()
      await uploadPromise!
    })

    expect(result.current.status).toBe('success')

    await act(async () => {
      result.current.reset()
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.progress).toBe(0)
    expect(result.current.url).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('resumes from a previous upload if one exists', async () => {
    const mockPreviousUpload = { uploadUrl: 'https://example.com/tus/123', metadata: {} }
    mockFindPreviousUploads.mockResolvedValueOnce([mockPreviousUpload])

    const { useTusUpload } = await import('@/hooks/useTusUpload')
    const { result } = renderHook(() => useTusUpload())

    const file = new File(['audio data'], 'test.wav', { type: 'audio/wav' })

    let uploadPromise: Promise<void>
    await act(async () => {
      uploadPromise = result.current.upload(file, 'track-id/before-123.wav')
    })

    await act(async () => {
      const onSuccess = capturedOptions.onSuccess as (() => void) | undefined
      onSuccess?.()
      await uploadPromise!
    })

    expect(mockResumeFromPreviousUpload).toHaveBeenCalledWith(mockPreviousUpload)
    expect(mockStart).toHaveBeenCalled()
  })

  it('uses 6 MB chunk size (Supabase minimum)', async () => {
    const { useTusUpload } = await import('@/hooks/useTusUpload')
    const { result } = renderHook(() => useTusUpload())

    const file = new File(['audio data'], 'test.wav', { type: 'audio/wav' })

    await act(async () => {
      result.current.upload(file, 'track-id/before-123.wav')
    })

    expect(capturedOptions.chunkSize).toBe(6 * 1024 * 1024)
  })
})
