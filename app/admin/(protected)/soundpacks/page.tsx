import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { deleteSoundpack } from './_actions'
import ConfirmDeleteButton from '@/app/admin/_components/ConfirmDeleteButton'
import { getStorageProvider } from '@/lib/storage'

const MEDIA_BUCKET = process.env.R2_BUCKET_MEDIA ?? 'zardonic-media'

export default async function SoundpacksAdminPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('soundpacks')
    .select('id, name, genre, price_cents, currency, featured, active, cover_image_url, cover_storage_path')
    .order('display_order', { ascending: true })

  const storage = getStorageProvider()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Soundpacks</h1>
        <Link href="/admin/soundpacks/new" style={{ padding: '0.6rem 1.2rem', background: '#7c3aed', borderRadius: '6px', color: '#fff', textDecoration: 'none' }}>
          + New
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>Cover</th>
              <th style={{ padding: '0.75rem' }}>Name</th>
              <th style={{ padding: '0.75rem' }}>Genre</th>
              <th style={{ padding: '0.75rem' }}>Price</th>
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
              const priceCents = Number(row.price_cents ?? 0)
              const currency = String(row.currency ?? 'eur').toUpperCase()
              const priceDisplay = priceCents > 0
                ? `${currency} ${(priceCents / 100).toFixed(2)}`
                : 'Free'
              return (
                <tr key={String(row.id)} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '0.75rem' }}>
                    {thumbUrl ? (
                      <Image
                        src={thumbUrl}
                        alt={String(row.name ?? '')}
                        width={48}
                        height={48}
                        style={{ objectFit: 'cover', borderRadius: '4px', border: '1px solid #333' }}
                      />
                    ) : (
                      <div style={{ width: 48, height: 48, background: '#1a1a1a', borderRadius: '4px', border: '1px solid #333' }} />
                    )}
                  </td>
                  <td style={{ padding: '0.75rem' }}>{String(row.name ?? '')}</td>
                  <td style={{ padding: '0.75rem' }}>{String(row.genre ?? '–')}</td>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{priceDisplay}</td>
                  <td style={{ padding: '0.75rem' }}>{row.featured ? '★' : '–'}</td>
                  <td style={{ padding: '0.75rem' }}>{row.active ? '✓' : '–'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Link href={`/admin/soundpacks/${String(row.id)}`} style={{ color: '#7c3aed' }}>Edit</Link>
                      <ConfirmDeleteButton action={deleteSoundpack.bind(null, String(row.id))} />
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
