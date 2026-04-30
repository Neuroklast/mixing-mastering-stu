'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { uploadAudio } from '@/app/actions/uploadAudio'

interface UploadZoneProps {
  orderId: string
  onUploadComplete: (url: string) => void
}

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error'

const ALLOWED_TYPES = ['audio/wav', 'audio/mpeg']
const MAX_BYTES = 200 * 1024 * 1024

export function UploadZone({ orderId, onUploadComplete }: UploadZoneProps) {
  const [state, setState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [publicUrl, setPublicUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    async (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setErrorMsg('Only WAV and MP3 files are supported.')
        setState('error')
        return
      }
      if (file.size > MAX_BYTES) {
        setErrorMsg('File must not exceed 200 MB.')
        setState('error')
        return
      }

      setState('uploading')
      setProgress(0)
      setErrorMsg(null)

      // Animate progress to 90% while uploading
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + 5, 90))
      }, 200)

      const formData = new FormData()
      formData.set('file', file)
      formData.set('orderId', orderId)

      const result = await uploadAudio(formData)
      clearInterval(interval)

      if (!result.success) {
        setErrorMsg(result.error)
        setState('error')
        setProgress(0)
        return
      }

      setProgress(100)
      setPublicUrl(result.url)
      setState('success')
      onUploadComplete(result.url)
    },
    [orderId, onUploadComplete],
  )

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setState('dragging')
  }, [])

  const onDragLeave = useCallback(() => {
    setState((s) => (s === 'dragging' ? 'idle' : s))
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  const reset = () => {
    setState('idle')
    setProgress(0)
    setPublicUrl(null)
    setErrorMsg(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const borderColor =
    state === 'dragging'
      ? 'border-accent'
      : state === 'success'
        ? 'border-green-500'
        : state === 'error'
          ? 'border-red-500'
          : 'border-border hover:border-accent/50'

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => state === 'idle' && inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${borderColor} ${
        state === 'uploading' ? 'pointer-events-none' : ''
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/wav,audio/mpeg"
        className="hidden"
        onChange={onFileChange}
      />

      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <p className="text-lg font-mono text-muted-foreground">
              Drop your audio file here
            </p>
            <p className="text-sm text-muted-foreground/60 font-mono">
              WAV · MP3 · max 200 MB
            </p>
          </motion.div>
        )}

        {state === 'dragging' && (
          <motion.div
            key="dragging"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-lg font-mono text-accent">Release to upload</p>
          </motion.div>
        )}

        {state === 'uploading' && (
          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
              Uploading… {progress}%
            </p>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}

        {state === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="text-lg font-mono text-green-400">Upload complete ✓</p>
            {publicUrl && (
              <p className="text-xs font-mono text-muted-foreground break-all">{publicUrl}</p>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                reset()
              }}
              className="text-xs font-mono text-accent hover:underline"
            >
              Upload another file
            </button>
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="text-lg font-mono text-red-400">Upload failed</p>
            {errorMsg && <p className="text-sm text-muted-foreground font-mono">{errorMsg}</p>}
            <button
              onClick={(e) => {
                e.stopPropagation()
                reset()
              }}
              className="text-xs font-mono text-accent hover:underline"
            >
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
