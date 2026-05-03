import Link from 'next/link'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { deleteReview } from './_actions'

export default async function ReviewsAdminPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('reviews')
    .select('id, client_name, rating, service, date')
    .order('date', { ascending: false })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Reviews</h1>
        <Link href="/admin/reviews/new" style={{ padding: '0.6rem 1.2rem', background: '#7c3aed', borderRadius: '6px', color: '#fff', textDecoration: 'none' }}>
          + New
        </Link>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
            <th style={{ padding: '0.75rem' }}>Client</th>
            <th style={{ padding: '0.75rem' }}>Rating</th>
            <th style={{ padding: '0.75rem' }}>Service</th>
            <th style={{ padding: '0.75rem' }}>Date</th>
            <th style={{ padding: '0.75rem' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((row) => (
            <tr key={String(row.id)} style={{ borderBottom: '1px solid #1a1a1a' }}>
              <td style={{ padding: '0.75rem' }}>{String(row.client_name ?? '')}</td>
              <td style={{ padding: '0.75rem' }}>{String(row.rating ?? '')}</td>
              <td style={{ padding: '0.75rem' }}>{String(row.service ?? '')}</td>
              <td style={{ padding: '0.75rem' }}>{String(row.date ?? '')}</td>
              <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <Link href={`/admin/reviews/${String(row.id)}`} style={{ color: '#7c3aed' }}>Edit</Link>
                <form action={deleteReview.bind(null, String(row.id))}>
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
