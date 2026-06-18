import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { deletePartner } from './_actions'
import ConfirmDeleteButton from '@/app/admin/_components/ConfirmDeleteButton'
import { getStorageProvider } from '@/lib/storage'

const MEDIA_BUCKET = process.env.R2_BUCKET_MEDIA ?? 'zardonic-media'

export default async function PartnersAdminPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('partners')
    .select('id, name, url, logo_url, logo_storage_path, active, display_order')
    .order('display_order', { ascending: true })

  const storage = getStorageProvider()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Partners</h1>
        <Link href="/admin/partners/new" style={{ padding: '0.6rem 1.2rem', background: '#7c3aed', borderRadius: '6px', color: '#fff', textDecoration: 'none' }}>
          + New
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>Logo</th>
              <th style={{ padding: '0.75rem' }}>Name</th>
              <th style={{ padding: '0.75rem' }}>URL</th>
              <th style={{ padding: '0.75rem' }}>Order</th>
              <th style={{ padding: '0.75rem' }}>Active</th>
              <th style={{ padding: '0.75rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => {
              const thumbUrl = row.logo_storage_path
                ? storage.getPublicUrl(MEDIA_BUCKET, String(row.logo_storage_path))
                : row.logo_url
                ? String(row.logo_url)
                : null
              return (
                <tr key={String(row.id)} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '0.75rem' }}>
                    {thumbUrl ? (
                      <Image
                        src={thumbUrl}
                        alt={String(row.name ?? '')}
                        width={48}
                        height={48}
                        style={{ objectFit: 'contain', borderRadius: '4px', border: '1px solid #333', background: '#fff' }}
                      />
                    ) : (
                      <div style={{ width: 48, height: 48, background: '#1a1a1a', borderRadius: '4px', border: '1px solid #333' }} />
                    )}
                  </td>
                  <td style={{ padding: '0.75rem' }}>{String(row.name ?? '')}</td>
                  <td style={{ padding: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.url ? (
                      <a href={String(row.url)} target="_blank" rel="noopener noreferrer" style={{ color: '#7c3aed' }}>
                        {String(row.url)}
                      </a>
                    ) : '–'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>{String(row.display_order ?? 0)}</td>
                  <td style={{ padding: '0.75rem' }}>{row.active ? '✓' : '–'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Link href={`/admin/partners/${String(row.id)}`} style={{ color: '#7c3aed' }}>Edit</Link>
                      <ConfirmDeleteButton action={deletePartner.bind(null, String(row.id))} />
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
