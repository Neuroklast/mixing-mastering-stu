'use client'

import { useState } from 'react'

interface AudioUploadFieldProps {
  label: string
  name: string
  defaultValue?: string
  bucket?: string
}

export default function AudioUploadField({
  label,
  name,
  defaultValue = '',
  bucket = 'audio-files',
}: AudioUploadFieldProps) {
  const [storagePath, setStoragePath] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', bucket)

    const res = await fetch('/api/admin/upload-audio', { method: 'POST', body: formData })
    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      setError(body.error ?? 'Upload failed')
    } else {
      const body = (await res.json()) as { path?: string }
      setStoragePath(body.path ?? '')
    }
    setUploading(false)
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.3rem', color: '#aaa', fontSize: '0.85rem' }}>{label}</label>
      {defaultValue && (
        <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.4rem' }}>Current: {defaultValue}</p>
      )}
      <input type="file" accept="audio/*" onChange={handleFile} disabled={uploading} style={{ color: '#ccc' }} />
      {uploading && <p style={{ fontSize: '0.8rem', color: '#aaa' }}>Uploading…</p>}
      {error && <p style={{ fontSize: '0.8rem', color: '#f87171' }}>{error}</p>}
      <input type="hidden" name={name} value={storagePath || defaultValue} />
    </div>
  )
}
