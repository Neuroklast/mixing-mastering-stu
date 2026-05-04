'use client'

import { useState } from 'react'
import { createSignedUploadUrl, getPublicStorageUrl } from '@/app/admin/_actions/uploads'

interface FileUploadFieldProps {
  /** Label shown above the field */
  label: string
  /** Hidden input name for the public URL */
  urlName: string
  /** Current URL value (shown as a link when set) */
  defaultUrl?: string
  /** Storage bucket name (default: 'sonorativa-media') */
  bucket?: string
  /** Path prefix inside the bucket (e.g. 'hero-model') */
  pathPrefix?: string
  /** Accepted MIME types / extensions */
  accept?: string
  /** Max file size in bytes (shown in error message) */
  maxBytes?: number
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export default function FileUploadField({
  label,
  urlName,
  defaultUrl = '',
  bucket = 'sonorativa-media',
  pathPrefix = 'uploads',
  accept = '*/*',
  maxBytes,
}: FileUploadFieldProps) {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [fileUrl, setFileUrl] = useState(defaultUrl)

  const reset = () => {
    setStatus('idle')
    setError(null)
    setProgress(0)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (maxBytes && file.size > maxBytes) {
      setError(`File is too large. Maximum size is ${Math.round(maxBytes / 1024 / 1024)} MB.`)
      setStatus('error')
      return
    }

    setStatus('uploading')
    setError(null)
    setProgress(0)

    try {
      const ext = file.name.split('.').pop() ?? 'bin'
      const objectPath = `${pathPrefix}/${Date.now()}.${ext}`

      const { signedUrl } = await createSignedUploadUrl(bucket, objectPath)

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', signedUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(ev.loaded / ev.total)
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(`Upload failed: ${xhr.statusText}`))
        }
        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.send(file)
      })

      const publicUrl = await getPublicStorageUrl(bucket, objectPath)

      setFileUrl(publicUrl)
      setStatus('success')
      setProgress(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setStatus('error')
    }
  }

  const progressPct = Math.round(progress * 100)
  const currentUrl = fileUrl || defaultUrl

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label
        style={{ display: 'block', marginBottom: '0.3rem', color: '#aaa', fontSize: '0.85rem' }}
      >
        {label}
      </label>

      {currentUrl && (
        <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem', wordBreak: 'break-all' }}>
          Current:{' '}
          <a href={currentUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#7c3aed' }}>
            {currentUrl}
          </a>
        </p>
      )}

      <input
        type="file"
        accept={accept}
        onChange={handleFile}
        disabled={status === 'uploading'}
        style={{ color: '#ccc', display: 'block', marginBottom: '0.4rem' }}
      />

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
          <p style={{ fontSize: '0.8rem', color: '#aaa' }}>Uploading… {progressPct}%</p>
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

      {/* Hidden field submitted with the form */}
      <input type="hidden" name={urlName} value={fileUrl} />
    </div>
  )
}
