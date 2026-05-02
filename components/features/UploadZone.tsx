'use client'

import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUpload, type UploadStatus } from '@/hooks/useUpload'

interface UploadZoneProps {
  orderId: string
  onUploadComplete: (publicUrl: string) => void
}

const BORDER_COLOR_BY_STATUS: Record<UploadStatus, string> = {
  idle: 'border-border hover:border-accent/50',
  dragging: 'border-accent',
  uploading: 'border-accent/50',
  success: 'border-[var(--color-accent)]',
  error: 'border-red-500',
}

const IdlePrompt = (): JSX.Element => (
  <div className="space-y-3">
    <p className="text-lg font-mono text-muted-foreground">Drop your audio file here</p>
    <p className="text-sm text-muted-foreground/60 font-mono">WAV · MP3 · max 200 MB</p>
  </div>
)

const DraggingPrompt = (): JSX.Element => (
  <p className="text-lg font-mono text-accent">Release to upload</p>
)

interface UploadProgressProps { progressPercent: number }
const UploadProgress = ({ progressPercent }: UploadProgressProps): JSX.Element => (
  <div className="space-y-4">
    <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
      Uploading… {progressPercent}%
    </p>
    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
      <motion.div
        className="h-full bg-accent rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progressPercent}%` }}
        transition={{ ease: 'easeOut' }}
      />
    </div>
  </div>
)

interface SuccessMessageProps { publicUrl: string | null; onReset: () => void }
const SuccessMessage = ({ publicUrl, onReset }: SuccessMessageProps): JSX.Element => (
  <div className="space-y-3">
    <p className="text-lg font-mono text-[var(--color-accent)]">Upload complete ✓</p>
    {publicUrl && (
      <p className="text-xs font-mono text-muted-foreground break-all">{publicUrl}</p>
    )}
    <button onClick={onReset} className="text-xs font-mono text-accent hover:underline">
      Upload another file
    </button>
  </div>
)

interface ErrorMessageProps { errorMessage: string | null; onReset: () => void }
const ErrorMessage = ({ errorMessage, onReset }: ErrorMessageProps): JSX.Element => (
  <div className="space-y-3">
    <p className="text-lg font-mono text-red-400">Upload failed</p>
    {errorMessage && (
      <p className="text-sm text-muted-foreground font-mono">{errorMessage}</p>
    )}
    <button onClick={onReset} className="text-xs font-mono text-accent hover:underline">
      Try again
    </button>
  </div>
)

export const UploadZone = ({ orderId, onUploadComplete }: UploadZoneProps): JSX.Element => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadState, handleDragOver, handleDragLeave, handleDrop, handleFileChange, reset } =
    useUpload(orderId, onUploadComplete)

  const { status, progressPercent, publicUrl, errorMessage } = uploadState
  const isClickable = status === 'idle'

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => isClickable && fileInputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-lg p-10 text-center transition-colors
        ${BORDER_COLOR_BY_STATUS[status]}
        ${isClickable ? 'cursor-pointer' : 'pointer-events-none'}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/wav,audio/mpeg"
        className="hidden"
        onChange={handleFileChange}
      />

      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <IdlePrompt />
          </motion.div>
        )}
        {status === 'dragging' && (
          <motion.div key="dragging" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <DraggingPrompt />
          </motion.div>
        )}
        {status === 'uploading' && (
          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <UploadProgress progressPercent={progressPercent} />
          </motion.div>
        )}
        {status === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <SuccessMessage publicUrl={publicUrl} onReset={reset} />
          </motion.div>
        )}
        {status === 'error' && (
          <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <ErrorMessage errorMessage={errorMessage} onReset={reset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
