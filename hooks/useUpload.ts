'use client'

import { useState, useCallback } from 'react'
import { uploadAudio } from '@/app/actions/uploadAudio'

export type UploadStatus = 'idle' | 'dragging' | 'uploading' | 'success' | 'error'

export interface UploadState {
  status: UploadStatus
  progressPercent: number
  publicUrl: string | null
  errorMessage: string | null
}

export interface UploadHandlers {
  handleDragOver: (event: React.DragEvent<HTMLDivElement>) => void
  handleDragLeave: () => void
  handleDrop: (event: React.DragEvent<HTMLDivElement>) => void
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  reset: () => void
}

const ALLOWED_MIME_TYPES = new Set(['audio/wav', 'audio/mpeg'])
const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024

const validateAudioFile = (file: File): string | null => {
  if (!ALLOWED_MIME_TYPES.has(file.type)) return 'Only WAV and MP3 files are supported.'
  if (file.size > MAX_FILE_SIZE_BYTES) return 'File must not exceed 200 MB.'
  return null
}

const initialState: UploadState = {
  status: 'idle',
  progressPercent: 0,
  publicUrl: null,
  errorMessage: null,
}

export const useUpload = (orderId: string, onUploadComplete: (url: string) => void) => {
  const [uploadState, setUploadState] = useState<UploadState>(initialState)

  const setError = (errorMessage: string): void =>
    setUploadState({ status: 'error', progressPercent: 0, publicUrl: null, errorMessage })

  const processFile = useCallback(
    async (file: File): Promise<void> => {
      const validationError = validateAudioFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      setUploadState({ status: 'uploading', progressPercent: 0, publicUrl: null, errorMessage: null })

      const progressInterval = setInterval(() => {
        setUploadState((prev) => ({
          ...prev,
          progressPercent: Math.min(prev.progressPercent + 5, 90),
        }))
      }, 200)

      try {
        const formData = new FormData()
        formData.set('file', file)
        formData.set('orderId', orderId)

        const result = await uploadAudio(formData)
        clearInterval(progressInterval)

        if (!result.success) {
          setError(result.error)
          return
        }

        setUploadState({ status: 'success', progressPercent: 100, publicUrl: result.url, errorMessage: null })
        onUploadComplete(result.url)
      } catch {
        clearInterval(progressInterval)
        setError('An unexpected error occurred. Please try again.')
      }
    },
    [orderId, onUploadComplete],
  )

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    setUploadState((prev) => ({ ...prev, status: 'dragging' }))
  }, [])

  const handleDragLeave = useCallback((): void => {
    setUploadState((prev) =>
      prev.status === 'dragging' ? { ...prev, status: 'idle' } : prev,
    )
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>): void => {
      event.preventDefault()
      const droppedFile = event.dataTransfer.files[0]
      if (droppedFile) processFile(droppedFile)
    },
    [processFile],
  )

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const selectedFile = event.target.files?.[0]
      if (selectedFile) processFile(selectedFile)
    },
    [processFile],
  )

  const reset = useCallback((): void => setUploadState(initialState), [])

  return { uploadState, handleDragOver, handleDragLeave, handleDrop, handleFileChange, reset }
}
