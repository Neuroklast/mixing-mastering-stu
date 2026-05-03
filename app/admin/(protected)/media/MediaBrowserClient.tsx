'use client'

import { useState } from 'react'
import ConfirmDeleteButton from '@/app/admin/_components/ConfirmDeleteButton'
import { deleteMediaFile } from './_actions'

interface MediaFile {
  name: string
  size: number
  created_at: string
  publicUrl?: string
}

interface AudioFile {
  name: string
  size: number
  created_at: string
}

interface MediaBrowserClientProps {
  mediaFiles: MediaFile[]
  audioFiles: AudioFile[]
  supabaseUrl: string
}

export default function MediaBrowserClient({ mediaFiles, audioFiles, supabaseUrl }: MediaBrowserClientProps) {
  const [activeTab, setActiveTab] = useState<'media' | 'audio'>('media')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const handleCopyUrl = (url: string) => {
    void navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const tabStyle = (tab: 'media' | 'audio') => ({
    padding: '0.5rem 1.2rem',
    background: activeTab === tab ? '#7c3aed' : '#1a1a1a',
    border: '1px solid',
    borderColor: activeTab === tab ? '#7c3aed' : '#333',
    borderRadius: '6px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: activeTab === tab ? 600 : 400,
  })

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Media</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button type="button" style={tabStyle('media')} onClick={() => setActiveTab('media')}>
          Media ({mediaFiles.length})
        </button>
        <button type="button" style={tabStyle('audio')} onClick={() => setActiveTab('audio')}>
          Audio Files ({audioFiles.length})
        </button>
      </div>

      {activeTab === 'media' && (
        <div>
          <p style={{ color: '#aaa', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Public images in the <code>media</code> bucket.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Preview</th>
                <th style={{ padding: '0.75rem' }}>Name</th>
                <th style={{ padding: '0.75rem' }}>Size</th>
                <th style={{ padding: '0.75rem' }}>Created</th>
                <th style={{ padding: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mediaFiles.map((file) => {
                const publicUrl = `${supabaseUrl}/storage/v1/object/public/media/${file.name}`
                const isCopied = copiedUrl === publicUrl
                return (
                  <tr key={file.name} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '0.75rem' }}>
                      {/\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(file.name) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={publicUrl}
                          alt={file.name}
                          style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '4px', border: '1px solid #333' }}
                        />
                      ) : (
                        <div style={{ width: 48, height: 48, background: '#1a1a1a', borderRadius: '4px', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#666' }}>
                          file
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{file.name}</td>
                    <td style={{ padding: '0.75rem' }}>{file.size > 0 ? `${Math.round(file.size / 1024)} KB` : '–'}</td>
                    <td style={{ padding: '0.75rem' }}>{file.created_at.slice(0, 10)}</td>
                    <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(publicUrl)}
                        style={{ background: 'none', border: '1px solid #444', borderRadius: '4px', padding: '0.2rem 0.6rem', color: isCopied ? '#4ade80' : '#aaa', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        {isCopied ? '✓ Copied' : 'Copy URL'}
                      </button>
                      <ConfirmDeleteButton action={deleteMediaFile.bind(null, 'media', file.name)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'audio' && (
        <div>
          <p style={{ color: '#aaa', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Private WAV files in the <code>audio-files</code> bucket. URLs expire after 1 hour.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Name</th>
                <th style={{ padding: '0.75rem' }}>Size</th>
                <th style={{ padding: '0.75rem' }}>Created</th>
                <th style={{ padding: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {audioFiles.map((file) => (
                <tr key={file.name} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{file.name}</td>
                  <td style={{ padding: '0.75rem' }}>{file.size > 0 ? `${Math.round(file.size / (1024 * 1024))} MB` : '–'}</td>
                  <td style={{ padding: '0.75rem' }}>{file.created_at.slice(0, 10)}</td>
                  <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <ConfirmDeleteButton action={deleteMediaFile.bind(null, 'audio-files', file.name)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
