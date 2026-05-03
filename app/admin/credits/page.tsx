import Link from 'next/link'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { deleteCredit } from './_actions'

export default async function CreditsAdminPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('credits')
    .select('id, name, role, year, featured')
    .order('featured', { ascending: false })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Credits</h1>
        <Link href="/admin/credits/new" style={{ padding: '0.6rem 1.2rem', background: '#7c3aed', borderRadius: '6px', color: '#fff', textDecoration: 'none' }}>
          + New
        </Link>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
            <th style={{ padding: '0.75rem' }}>Name</th>
            <th style={{ padding: '0.75rem' }}>Role</th>
            <th style={{ padding: '0.75rem' }}>Year</th>
            <th style={{ padding: '0.75rem' }}>Featured</th>
            <th style={{ padding: '0.75rem' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((row) => (
            <tr key={String(row.id)} style={{ borderBottom: '1px solid #1a1a1a' }}>
              <td style={{ padding: '0.75rem' }}>{String(row.name ?? '')}</td>
              <td style={{ padding: '0.75rem' }}>{String(row.role ?? '')}</td>
              <td style={{ padding: '0.75rem' }}>{String(row.year ?? '')}</td>
              <td style={{ padding: '0.75rem' }}>{row.featured ? '✓' : '–'}</td>
              <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <Link href={`/admin/credits/${String(row.id)}`} style={{ color: '#7c3aed' }}>Edit</Link>
                <form action={deleteCredit.bind(null, String(row.id))}>
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
