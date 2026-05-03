import Link from 'next/link'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { deleteLegal } from './_actions'

export default async function LegalAdminPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('legal')
    .select('id, title, slug, last_updated')
    .order('title', { ascending: true })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Legal Pages</h1>
        <Link href="/admin/legal/new" style={{ padding: '0.6rem 1.2rem', background: '#7c3aed', borderRadius: '6px', color: '#fff', textDecoration: 'none' }}>
          + New
        </Link>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
            <th style={{ padding: '0.75rem' }}>Title</th>
            <th style={{ padding: '0.75rem' }}>Slug</th>
            <th style={{ padding: '0.75rem' }}>Last Updated</th>
            <th style={{ padding: '0.75rem' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((row) => (
            <tr key={String(row.id)} style={{ borderBottom: '1px solid #1a1a1a' }}>
              <td style={{ padding: '0.75rem' }}>{String(row.title ?? '')}</td>
              <td style={{ padding: '0.75rem' }}>{String(row.slug ?? '')}</td>
              <td style={{ padding: '0.75rem' }}>{String(row.last_updated ?? '')}</td>
              <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <Link href={`/admin/legal/${String(row.id)}`} style={{ color: '#7c3aed' }}>Edit</Link>
                <form action={deleteLegal.bind(null, String(row.id))}>
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
