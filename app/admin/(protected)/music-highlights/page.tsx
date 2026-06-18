import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { deleteHighlight } from './_actions'
import ConfirmDeleteButton from '@/app/admin/_components/ConfirmDeleteButton'
import { getStorageProvider } from '@/lib/storage'

const MEDIA_BUCKET = process.env.R2_BUCKET_MEDIA ?? 'zardonic-media'

export default async function MusicHighlightsAdminPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('music_highlights')
    .select('id, title, artist, image_url, image_storage_path, active, display_order')
    .order('display_order', { ascending: true })

  const storage = getStorageProvider()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Music Highlights</h1>
        <Link href="/admin/music-highlights/new" style={{ padding: '0.6rem 1.2rem', background: '#7c3aed', borderRadius: '6px', color: '#fff', textDecoration: 'none' }}>
          + New
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>Image</th>
              <th style={{ padding: '0.75rem' }}>Title</th>
              <th style={{ padding: '0.75rem' }}>Artist</th>
              <th style={{ padding: '0.75rem' }}>Order</th>
              <th style={{ padding: '0.75rem' }}>Active</th>
              <th style={{ padding: '0.75rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => {
              const thumbUrl = row.image_storage_path
                ? storage.getPublicUrl(MEDIA_BUCKET, String(row.image_storage_path))
                : row.image_url
                ? String(row.image_url)
                : null
              return (
                <tr key={String(row.id)} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '0.75rem' }}>
                    {thumbUrl ? (
                      <Image
                        src={thumbUrl}
                        alt={String(row.title ?? '')}
                        width={48}
                        height={48}
                        style={{ objectFit: 'cover', borderRadius: '4px', border: '1px solid #333' }}
                      />
                    ) : (
                      <div style={{ width: 48, height: 48, background: '#1a1a1a', borderRadius: '4px', border: '1px solid #333' }} />
                    )}
                  </td>
                  <td style={{ padding: '0.75rem' }}>{String(row.title ?? '')}</td>
                  <td style={{ padding: '0.75rem' }}>{String(row.artist ?? '–')}</td>
                  <td style={{ padding: '0.75rem' }}>{String(row.display_order ?? 0)}</td>
                  <td style={{ padding: '0.75rem' }}>{row.active ? '✓' : '–'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Link href={`/admin/music-highlights/${String(row.id)}`} style={{ color: '#7c3aed' }}>Edit</Link>
                      <ConfirmDeleteButton action={deleteHighlight.bind(null, String(row.id))} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
