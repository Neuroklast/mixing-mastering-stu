import Link from 'next/link'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { deleteGig } from './_actions'
import ConfirmDeleteButton from '@/app/admin/_components/ConfirmDeleteButton'

export default async function GigsAdminPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('gigs')
    .select('id, title, venue, city, country, date, featured, cancelled')
    .order('date', { ascending: false })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Gigs</h1>
        <Link href="/admin/gigs/new" style={{ padding: '0.6rem 1.2rem', background: '#7c3aed', borderRadius: '6px', color: '#fff', textDecoration: 'none' }}>
          + New
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>Date</th>
              <th style={{ padding: '0.75rem' }}>Title / Venue</th>
              <th style={{ padding: '0.75rem' }}>City</th>
              <th style={{ padding: '0.75rem' }}>Country</th>
              <th style={{ padding: '0.75rem' }}>Featured</th>
              <th style={{ padding: '0.75rem' }}>Status</th>
              <th style={{ padding: '0.75rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => (
              <tr key={String(row.id)} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.9rem' }}>{String(row.date ?? '')}</td>
                <td style={{ padding: '0.75rem' }}>
                  {row.title ? (
                    <span>
                      <span style={{ fontWeight: 600 }}>{String(row.title)}</span>
                      <br />
                      <span style={{ color: '#888', fontSize: '0.85rem' }}>{String(row.venue ?? '')}</span>
                    </span>
                  ) : (
                    String(row.venue ?? '')
                  )}
                </td>
                <td style={{ padding: '0.75rem' }}>{String(row.city ?? '')}</td>
                <td style={{ padding: '0.75rem' }}>{String(row.country ?? '')}</td>
                <td style={{ padding: '0.75rem' }}>{row.featured ? '★' : '–'}</td>
                <td style={{ padding: '0.75rem' }}>
                  {row.cancelled ? (
                    <span style={{ color: '#f87171', fontSize: '0.8rem' }}>Cancelled</span>
                  ) : (
                    <span style={{ color: '#4ade80', fontSize: '0.8rem' }}>Active</span>
                  )}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Link href={`/admin/gigs/${String(row.id)}`} style={{ color: '#7c3aed' }}>Edit</Link>
                    <ConfirmDeleteButton action={deleteGig.bind(null, String(row.id))} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
