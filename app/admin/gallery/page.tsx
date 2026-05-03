import Link from 'next/link'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { deleteGallery } from './_actions'

export default async function GalleryAdminPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('gallery')
    .select('id, alt, display_order, active')
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
            <th style={{ padding: '0.75rem' }}>Alt</th>
            <th style={{ padding: '0.75rem' }}>Order</th>
            <th style={{ padding: '0.75rem' }}>Active</th>
            <th style={{ padding: '0.75rem' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((row) => (
            <tr key={String(row.id)} style={{ borderBottom: '1px solid #1a1a1a' }}>
              <td style={{ padding: '0.75rem' }}>{String(row.alt ?? '')}</td>
              <td style={{ padding: '0.75rem' }}>{String(row.display_order ?? '')}</td>
              <td style={{ padding: '0.75rem' }}>{row.active ? '✓' : '–'}</td>
              <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <Link href={`/admin/gallery/${String(row.id)}`} style={{ color: '#7c3aed' }}>Edit</Link>
                <form action={deleteGallery.bind(null, String(row.id))}>
                  <button type="submit" style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>Delete</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
