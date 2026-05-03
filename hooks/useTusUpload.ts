'use client'

import { useState, useCallback } from 'react'
import * as tus from 'tus-js-client'
import { getTusUploadCredentials } from '@/app/admin/_actions/uploads'

export interface TusUploadState {
  progress: number // 0..1
  status: 'idle' | 'uploading' | 'success' | 'error'
  error: string | null
  url: string | null // objectPath within bucket on success
}

const initialState: TusUploadState = {
  progress: 0,
  status: 'idle',
  error: null,
  url: null,
}

/**
 * Hook for TUS resumable uploads to Supabase Storage.
 *
 * Use for large audio files (WAVs up to 5 GB). Uploads in 6 MB chunks
 * directly from the browser to Supabase — never through a Next.js route.
 * Supports resuming interrupted uploads.
 *
 * @example
 * const { status, progress, url, upload, reset } = useTusUpload()
 * await upload(file, `${showcaseId}/before-${Date.now()}.wav`)
 */
export function useTusUpload() {
  const [state, setState] = useState<TusUploadState>(initialState)

  const upload = useCallback(async (file: File, objectPath: string): Promise<void> => {
    setState({ progress: 0, status: 'uploading', error: null, url: null })

    try {
      const creds = await getTusUploadCredentials()

      await new Promise<void>((resolve, reject) => {
        const tusUpload = new tus.Upload(file, {
          endpoint: creds.endpoint,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            authorization: `Bearer ${creds.token}`,
            'x-upsert': 'true', // overwrite if exists
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: creds.bucketName,
            objectName: objectPath,
            contentType: file.type || 'audio/wav',
            cacheControl: '3600',
          },
          // Supabase requires minimum 6 MB chunks for TUS (except the last chunk)
          chunkSize: 6 * 1024 * 1024,
          onError: (err) => {
            setState((s) => ({ ...s, status: 'error', error: err.message }))
            reject(err)
          },
          onProgress: (sent, total) => {
            setState((s) => ({ ...s, progress: sent / total }))
          },
          onSuccess: () => {
            setState({ progress: 1, status: 'success', error: null, url: objectPath })
            resolve()
          },
        })

        // Resume previous upload if interrupted
        tusUpload.findPreviousUploads().then((previous) => {
          if (previous.length > 0 && previous[0]) {
            tusUpload.resumeFromPreviousUpload(previous[0])
          }
          tusUpload.start()
        })
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setState({ progress: 0, status: 'error', error: msg, url: null })
      throw err
    }
  }, [])

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  return { ...state, upload, reset }
}
