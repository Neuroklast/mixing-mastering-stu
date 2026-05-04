import Link from 'next/link'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { deleteReview } from './_actions'
import ConfirmDeleteButton from '@/app/admin/_components/ConfirmDeleteButton'
import SendInviteForm from './_components/SendInviteForm'
import ToggleActiveButton from './_components/ToggleActiveButton'

export default async function ReviewsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const invited = params.invited === '1'

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('reviews')
    .select('id, client_name, rating, service, date, active')
    .order('date', { ascending: false })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Reviews</h1>
          <p style={{ color: '#888', fontSize: '0.85rem' }}>
            Manage client reviews. Send a personal invite link so clients can submit reviews directly.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <SendInviteForm />
          <Link
            href="/admin/reviews/new"
            style={{ padding: '0.6rem 1.2rem', background: '#7c3aed', borderRadius: '6px', color: '#fff', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}
          >
            + New
          </Link>
        </div>
      </div>

      {invited && (
        <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: '#052e16', border: '1px solid #166534', borderRadius: '6px', color: '#4ade80', fontSize: '0.9rem' }}>
          ✓ Review invite sent successfully.
        </div>
      )}

      <div className="overflow-x-auto">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
            <th style={{ padding: '0.75rem' }}>Client</th>
            <th style={{ padding: '0.75rem' }}>Rating</th>
            <th style={{ padding: '0.75rem' }}>Service</th>
            <th style={{ padding: '0.75rem' }}>Date</th>
            <th style={{ padding: '0.75rem' }}>Status</th>
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
              <td style={{ padding: '0.75rem' }}>
                <ToggleActiveButton id={String(row.id)} active={Boolean(row.active)} />
              </td>
              <td style={{ padding: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Link href={`/admin/reviews/${String(row.id)}`} style={{ color: '#7c3aed' }}>Edit</Link>
                  <ConfirmDeleteButton action={deleteReview.bind(null, String(row.id))} />
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
