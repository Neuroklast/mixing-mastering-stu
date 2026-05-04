'use client'

import { useRef, useState } from 'react'
import { createSignedUploadUrl, getPublicStorageUrl } from '@/app/admin/_actions/uploads'

interface ImageUploadFieldProps {
  /** Label shown above the field */
  label: string
  /** Hidden input name for the storage path (e.g. `storage_path`). Optional — omit when only the URL needs to be stored. */
  pathName?: string
  /** Hidden input name for the public URL (e.g. `image_url`) */
  urlName: string
  /** Default storage path when editing an existing record */
  defaultPath?: string
  /** Default image URL when editing an existing record */
  defaultUrl?: string
  /** Storage bucket name (default: 'sonorativa-media') */
  bucket?: string
  /** Path prefix inside the bucket (e.g. 'gallery', 'credits', 'members') */
  pathPrefix?: string
  /** Accepted MIME types */
  accept?: string
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export default function ImageUploadField({
  label,
  pathName,
  urlName,
  defaultPath = '',
  defaultUrl = '',
  bucket = 'sonorativa-media',
  pathPrefix = 'uploads',
  accept = 'image/jpeg,image/png,image/webp,image/avif',
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [storagePath, setStoragePath] = useState(defaultPath)
  const [imageUrl, setImageUrl] = useState(defaultUrl)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

  const reset = () => {
    setStatus('idle')
    setError(null)
    setProgress(0)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFileName(file.name)

    setStatus('uploading')
    setError(null)
    setProgress(0)

    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const objectPath = `${pathPrefix}/${Date.now()}.${ext}`

      // Get signed upload URL via server action (goes to R2)
      const { signedUrl } = await createSignedUploadUrl(bucket, objectPath)

      // Upload directly to R2 with progress tracking
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

      // Get the public URL from the server (uses R2_PUBLIC_HOST)
      const publicUrl = await getPublicStorageUrl(bucket, objectPath)

      setStoragePath(objectPath)
      setImageUrl(publicUrl)
      setStatus('success')
      setProgress(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setStatus('error')
    }
  }

  const progressPct = Math.round(progress * 100)
  const previewUrl = imageUrl || defaultUrl

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label
        style={{ display: 'block', marginBottom: '0.3rem', color: '#aaa', fontSize: '0.85rem' }}
      >
        {label}
      </label>

      {/* Thumbnail preview */}
      {previewUrl && (
        <div style={{ marginBottom: '0.5rem' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Preview"
            style={{
              width: '96px',
              height: '96px',
              objectFit: 'cover',
              borderRadius: '4px',
              border: '1px solid #333',
              display: 'block',
              marginBottom: '0.3rem',
            }}
          />
          <p style={{ fontSize: '0.75rem', color: '#666' }}>
            Path: <code style={{ color: '#888' }}>{storagePath || defaultPath}</code>
          </p>
        </div>
      )}

      {/* Hidden native file input — triggered by the styled button below */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        disabled={status === 'uploading'}
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
        aria-hidden="true"
        tabIndex={-1}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          disabled={status === 'uploading'}
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '0.45rem 1rem',
            background: '#27272a',
            border: '1px solid #52525b',
            borderRadius: '6px',
            color: '#d4d4d8',
            fontSize: '0.85rem',
            cursor: status === 'uploading' ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Choose file
        </button>
        <span style={{ fontSize: '0.8rem', color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '16rem' }}>
          {selectedFileName ?? 'No file chosen'}
        </span>
      </div>

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

      {/* Hidden fields for form action */}
      {pathName && <input type="hidden" name={pathName} value={storagePath} />}
      <input type="hidden" name={urlName} value={imageUrl} />
    </div>
  )
}
