'use client'

/**
 * S3 Multipart Upload hook for Cloudflare R2.
 *
 * Replaces useTusUpload. Supports files of any size via 5 MB parts.
 * Resumable: stores { uploadId, completedParts } in sessionStorage keyed
 * by a hash of (fileName + fileSize) so a page refresh can resume.
 *
 * Compatible interface with the old useTusUpload:
 *   const { status, progress, url, error, upload, reset } = useR2MultipartUpload()
 *   await upload(file, 'track-id/before-1234567890.wav')
 *
 * The `url` field is the object key (storage path) within the audio bucket,
 * matching the shape stored in showcase.before_storage_path / after_storage_path.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  createMultipartUploadAction,
  signMultipartPartAction,
  completeMultipartUploadAction,
  abortMultipartUploadAction,
} from '@/app/admin/_actions/r2Multipart'

export interface R2UploadState {
  progress: number // 0..1
  status: 'idle' | 'uploading' | 'success' | 'error'
  error: string | null
  url: string | null // objectPath (key) within the audio bucket on success
}

const CHUNK_SIZE = 5 * 1024 * 1024 // 5 MB (R2 minimum part size)

function makeResumeKey(file: File): string {
  return `r2-multipart:${file.name}:${file.size}`
}

interface ResumeState {
  uploadId: string
  key: string
  completedParts: Array<{ PartNumber: number; ETag: string }>
}

const initialState: R2UploadState = {
  progress: 0,
  status: 'idle',
  error: null,
  url: null,
}

export function useR2MultipartUpload() {
  const [state, setState] = useState<R2UploadState>(initialState)
  // Keep a ref to the current uploadId so cancel() and beforeunload can abort it
  const [currentUpload, setCurrentUpload] = useState<{
    key: string
    uploadId: string
  } | null>(null)

  // Mirror currentUpload in a ref so the beforeunload handler (a closure) can
  // read the latest value without being stale.
  const currentUploadRef = useRef(currentUpload)
  useEffect(() => {
    currentUploadRef.current = currentUpload
  }, [currentUpload])

  // Abort in-flight upload when the user navigates away to prevent orphaned
  // multipart uploads that accumulate storage costs in R2.
  useEffect(() => {
    function handleBeforeUnload() {
      const upload = currentUploadRef.current
      if (!upload) return
      // Fire-and-forget: we can't await in beforeunload, but the server action
      // will complete asynchronously. The lifecycle rule is the final safety net.
      abortMultipartUploadAction(upload.key, upload.uploadId).catch(() => {
        // Intentionally ignore — lifecycle rule handles cleanup
      })
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  const upload = useCallback(async (file: File, objectKey: string): Promise<void> => {
    setState({ progress: 0, status: 'uploading', error: null, url: null })

    const resumeKey = makeResumeKey(file)
    let resumeState: ResumeState | null = null

    try {
      const stored = sessionStorage.getItem(resumeKey)
      if (stored) {
        resumeState = JSON.parse(stored) as ResumeState
        // Only resume if key matches (same logical upload target)
        if (resumeState.key !== objectKey) {
          resumeState = null
          sessionStorage.removeItem(resumeKey)
        }
      }
    } catch {
      // sessionStorage unavailable — proceed without resume
    }

    let uploadId: string
    let completedParts: Array<{ PartNumber: number; ETag: string }>
    let startPartNumber: number

    try {
      if (resumeState) {
        uploadId = resumeState.uploadId
        completedParts = resumeState.completedParts
        startPartNumber = completedParts.length + 1
      } else {
        const result = await createMultipartUploadAction(objectKey, file.type || 'audio/wav')
        uploadId = result.uploadId
        completedParts = []
        startPartNumber = 1
      }

      setCurrentUpload({ key: objectKey, uploadId })

      const totalParts = Math.ceil(file.size / CHUNK_SIZE)

      for (let partNumber = startPartNumber; partNumber <= totalParts; partNumber++) {
        const start = (partNumber - 1) * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        const chunk = file.slice(start, end)

        const { signedUrl } = await signMultipartPartAction(objectKey, uploadId, partNumber)

        const response = await fetch(signedUrl, {
          method: 'PUT',
          body: chunk,
          headers: { 'Content-Type': file.type || 'audio/wav' },
        })

        if (!response.ok) {
          throw new Error(`Part ${partNumber} upload failed: ${response.statusText}`)
        }

        // Strip surrounding quotes from ETag (S3/R2 returns `"abc123"`)
        const rawEtag = response.headers.get('ETag') ?? ''
        const etag = rawEtag.replace(/^"|"$/g, '')

        if (!etag) {
          // Empty ETag means R2 would reject the CompleteMultipartUpload call.
          // Abort cleanly rather than leaving a hung upload.
          throw new Error(`Part ${partNumber} returned no ETag — upload aborted`)
        }

        completedParts.push({ PartNumber: partNumber, ETag: etag })

        // Persist resume state
        try {
          sessionStorage.setItem(
            resumeKey,
            JSON.stringify({ uploadId, key: objectKey, completedParts }),
          )
        } catch {
          // best-effort
        }

        setState((s) => ({
          ...s,
          progress: partNumber / totalParts,
        }))
      }

      try {
        await completeMultipartUploadAction(objectKey, uploadId, completedParts)
      } catch (completeErr) {
        // CompleteMultipartUpload failed — abort to avoid a hung upload
        try {
          await abortMultipartUploadAction(objectKey, uploadId)
        } catch {
          // Abort is best-effort; lifecycle rule is the final safety net
        }
        throw completeErr
      }

      // Clean up resume state on success
      try {
        sessionStorage.removeItem(resumeKey)
      } catch {
        // ignore
      }

      setCurrentUpload(null)
      setState({ progress: 1, status: 'success', error: null, url: objectKey })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setState({ progress: 0, status: 'error', error: msg, url: null })
      setCurrentUpload(null)
      throw err
    }
  }, [])

  const cancel = useCallback(async (): Promise<void> => {
    if (!currentUpload) return
    const { key, uploadId } = currentUpload
    try {
      await abortMultipartUploadAction(key, uploadId)
    } catch (err) {
      // Log so admins know about orphaned multipart parts that may incur storage costs
      console.error('[useR2MultipartUpload] Failed to abort multipart upload:', err)
    }
    setCurrentUpload(null)
    setState(initialState)
  }, [currentUpload])

  const reset = useCallback(() => {
    setState(initialState)
    setCurrentUpload(null)
  }, [])

  return { ...state, upload, cancel, reset }
}
