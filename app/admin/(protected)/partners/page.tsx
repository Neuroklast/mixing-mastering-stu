import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { getStorageProvider } from '@/lib/storage'
import { deletePartner } from './_actions'
import ConfirmDeleteButton from '@/app/admin/_components/ConfirmDeleteButton'

const MEDIA_BUCKET = process.env.R2_BUCKET_MEDIA ?? 'sonorativa-media'

export default async function PartnersAdminPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('partners')
    .select('id, name, url, category, display_order, active, logo_storage_path, logo_url, logo_white')
    .order('display_order', { ascending: true })

  const storage = getStorageProvider()
  const partners = (data ?? []).map((row) => {
    let logoUrl: string | null = null
    if (row.logo_storage_path) {
      try {
        logoUrl = storage.getPublicUrl(MEDIA_BUCKET, String(row.logo_storage_path))
      } catch {
        logoUrl = row.logo_url ? String(row.logo_url) : null
      }
    } else if (row.logo_url) {
      logoUrl = String(row.logo_url)
    }
    return {
      id: String(row.id),
      name: String(row.name ?? ''),
      category: String(row.category ?? 'partner'),
      display_order: Number(row.display_order ?? 0),
      active: Boolean(row.active),
      logoUrl,
    }
  })

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1>Partners &amp; Endorsements</h1>
          <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.35rem' }}>
            Logos on the public homepage grids (credits / endorsements / partners).
          </p>
        </div>
        <Link
          href="/admin/partners/new"
          style={{
            padding: '0.6rem 1.2rem',
            background: '#7c3aed',
            borderRadius: '6px',
            color: '#fff',
            textDecoration: 'none',
          }}
        >
          + New
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>Logo</th>
              <th style={{ padding: '0.75rem' }}>Name</th>
              <th style={{ padding: '0.75rem' }}>Section</th>
              <th style={{ padding: '0.75rem' }}>Order</th>
              <th style={{ padding: '0.75rem' }}>Active</th>
              <th style={{ padding: '0.75rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner) => (
              <tr key={partner.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '0.75rem' }}>
                  {partner.logoUrl ? (
                    <Image
                      src={partner.logoUrl}
                      alt={partner.name}
                      width={48}
                      height={48}
                      style={{
                        objectFit: 'contain',
                        borderRadius: '4px',
                        border: '1px solid #333',
                        background: '#111',
                      }}
                      unoptimized
                    />
                  ) : (
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        background: '#1a1a1a',
                        borderRadius: '4px',
                        border: '1px solid #333',
                      }}
                    />
                  )}
                </td>
                <td style={{ padding: '0.75rem' }}>{partner.name}</td>
                <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{partner.category}</td>
                <td style={{ padding: '0.75rem' }}>{partner.display_order}</td>
                <td style={{ padding: '0.75rem' }}>{partner.active ? '✓' : '–'}</td>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Link href={`/admin/partners/${partner.id}`} style={{ color: '#7c3aed' }}>
                      Edit
                    </Link>
                    <ConfirmDeleteButton action={deletePartner.bind(null, partner.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {partners.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '1.5rem', color: '#666' }}>
                  No partners yet. Add logos for endorsements and partners.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
