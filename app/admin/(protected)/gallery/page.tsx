import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { deleteGallery } from './_actions'
import ConfirmDeleteButton from '@/app/admin/_components/ConfirmDeleteButton'

export default async function GalleryAdminPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('gallery')
    .select('id, alt, display_order, active, image_url')
    .order('display_order', { ascending: true })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Gallery</h1>
        <Link href="/admin/gallery/new" style={{ padding: '0.6rem 1.2rem', background: '#7c3aed', borderRadius: '6px', color: '#fff', textDecoration: 'none' }}>
          + New
        </Link>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
            <th style={{ padding: '0.75rem' }}>Image</th>
            <th style={{ padding: '0.75rem' }}>Alt</th>
            <th style={{ padding: '0.75rem' }}>Order</th>
            <th style={{ padding: '0.75rem' }}>Active</th>
            <th style={{ padding: '0.75rem' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((row) => (
            <tr key={String(row.id)} style={{ borderBottom: '1px solid #1a1a1a' }}>
              <td style={{ padding: '0.75rem' }}>
                {row.image_url ? (
                  <Image
                    src={String(row.image_url)}
                    alt={String(row.alt ?? '')}
                    width={48}
                    height={48}
                    style={{ objectFit: 'cover', borderRadius: '4px', border: '1px solid #333' }}
                  />
                ) : (
                  <div style={{ width: 48, height: 48, background: '#1a1a1a', borderRadius: '4px', border: '1px solid #333' }} />
                )}
              </td>
              <td style={{ padding: '0.75rem' }}>{String(row.alt ?? '')}</td>
              <td style={{ padding: '0.75rem' }}>{String(row.display_order ?? '')}</td>
              <td style={{ padding: '0.75rem' }}>{row.active ? '✓' : '–'}</td>
              <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Link href={`/admin/gallery/${String(row.id)}`} style={{ color: '#7c3aed' }}>Edit</Link>
                <ConfirmDeleteButton action={deleteGallery.bind(null, String(row.id))} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
