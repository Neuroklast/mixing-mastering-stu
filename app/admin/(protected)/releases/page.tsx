import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { deleteRelease } from './_actions'
import ConfirmDeleteButton from '@/app/admin/_components/ConfirmDeleteButton'
import { getStorageProvider } from '@/lib/storage'

const MEDIA_BUCKET = process.env.R2_BUCKET_MEDIA ?? 'zardonic-media'

export default async function ReleasesAdminPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('releases')
    .select('id, title, artist, release_type, release_date, featured, active, cover_image_url, cover_storage_path')
    .order('display_order', { ascending: true })

  const storage = getStorageProvider()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Releases</h1>
        <Link href="/admin/releases/new" style={{ padding: '0.6rem 1.2rem', background: '#7c3aed', borderRadius: '6px', color: '#fff', textDecoration: 'none' }}>
          + New
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>Cover</th>
              <th style={{ padding: '0.75rem' }}>Title</th>
              <th style={{ padding: '0.75rem' }}>Artist</th>
              <th style={{ padding: '0.75rem' }}>Type</th>
              <th style={{ padding: '0.75rem' }}>Date</th>
              <th style={{ padding: '0.75rem' }}>Featured</th>
              <th style={{ padding: '0.75rem' }}>Active</th>
              <th style={{ padding: '0.75rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => {
              const thumbUrl = row.cover_storage_path
                ? storage.getPublicUrl(MEDIA_BUCKET, String(row.cover_storage_path))
                : row.cover_image_url
                ? String(row.cover_image_url)
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
                  <td style={{ padding: '0.75rem' }}>{String(row.artist ?? '')}</td>
                  <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{String(row.release_type ?? '')}</td>
                  <td style={{ padding: '0.75rem' }}>{String(row.release_date ?? '')}</td>
                  <td style={{ padding: '0.75rem' }}>{row.featured ? '★' : '–'}</td>
                  <td style={{ padding: '0.75rem' }}>{row.active ? '✓' : '–'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Link href={`/admin/releases/${String(row.id)}`} style={{ color: '#7c3aed' }}>Edit</Link>
                      <ConfirmDeleteButton action={deleteRelease.bind(null, String(row.id))} />
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
