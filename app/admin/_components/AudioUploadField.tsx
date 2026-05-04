'use client'

import { useState } from 'react'
import { useR2MultipartUpload } from '@/hooks/useR2MultipartUpload'

interface AudioUploadFieldProps {
  label: string
  name: string
  defaultValue?: string
  showcaseId?: string
}

export default function AudioUploadField({
  label,
  name,
  defaultValue = '',
  showcaseId = 'track',
}: AudioUploadFieldProps) {
  const { status, progress, url, error, upload, cancel, reset } = useR2MultipartUpload()
  const [currentPath, setCurrentPath] = useState(defaultValue)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fieldSuffix = name.includes('before') ? 'before' : 'after'
    const objectPath = `${showcaseId}/${fieldSuffix}-${Date.now()}.wav`

    try {
      await upload(file, objectPath)
      setCurrentPath(objectPath)
    } catch {
      // error already reflected in state.error
    }
  }

  const progressPct = Math.round(progress * 100)

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label
        style={{ display: 'block', marginBottom: '0.3rem', color: '#aaa', fontSize: '0.85rem' }}
      >
        {label}
      </label>

      {/* Current / successfully-uploaded file preview */}
      {currentPath && (
        <div style={{ marginBottom: '0.5rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.3rem' }}>
            Current: <code style={{ color: '#888' }}>{currentPath}</code>
          </p>
        </div>
      )}

      <input
        type="file"
        accept="audio/wav,audio/flac,audio/x-wav,.wav,.flac"
        onChange={handleFile}
        disabled={status === 'uploading'}
        style={{ color: '#ccc', display: 'block', marginBottom: '0.4rem' }}
      />

      {/* Progress bar */}
      {status === 'uploading' && (
        <div style={{ marginTop: '0.4rem' }}>
          <div
            style={{
              height: '4px',
              background: '#333',
              borderRadius: '2px',
              overflow: 'hidden',
              marginBottom: '0.3rem',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPct}%`,
                background: '#7c3aed',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.8rem', color: '#aaa' }}>Uploading… {progressPct}%</p>
            <button
              type="button"
              onClick={cancel}
              style={{
                fontSize: '0.75rem',
                color: '#f87171',
                background: 'none',
                border: '1px solid #444',
                borderRadius: '4px',
                padding: '0.2rem 0.5rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {status === 'success' && (
        <p style={{ fontSize: '0.8rem', color: '#4ade80' }}>✓ Upload complete</p>
      )}

      {error && (
        <div>
          <p style={{ fontSize: '0.8rem', color: '#f87171', marginBottom: '0.3rem' }}>
            Error: {error}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              fontSize: '0.75rem',
              color: '#aaa',
              background: 'none',
              border: '1px solid #444',
              borderRadius: '4px',
              padding: '0.2rem 0.6rem',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Hidden field — contains the storage path for the form action */}
      <input type="hidden" name={name} value={url ?? currentPath} />
    </div>
  )
}

