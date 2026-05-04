import Link from 'next/link'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { deleteShowcase } from './_actions'
import ConfirmDeleteButton from '@/app/admin/_components/ConfirmDeleteButton'

export default async function ShowcaseAdminPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('showcase')
    .select('id, title, artist, active, display_order, before_storage_path')
    .order('display_order', { ascending: true })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Showcase</h1>
        <Link href="/admin/showcase/new" style={{ padding: '0.6rem 1.2rem', background: '#7c3aed', borderRadius: '6px', color: '#fff', textDecoration: 'none' }}>
          + New
        </Link>
      </div>
      <div className="overflow-x-auto">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
            <th style={{ padding: '0.75rem' }}>Title</th>
            <th style={{ padding: '0.75rem' }}>Artist</th>
            <th style={{ padding: '0.75rem' }}>Audio</th>
            <th style={{ padding: '0.75rem' }}>Order</th>
            <th style={{ padding: '0.75rem' }}>Active</th>
            <th style={{ padding: '0.75rem' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((row) => (
            <tr key={String(row.id)} style={{ borderBottom: '1px solid #1a1a1a' }}>
              <td style={{ padding: '0.75rem' }}>{String(row.title ?? '')}</td>
              <td style={{ padding: '0.75rem' }}>{String(row.artist ?? '')}</td>
              <td style={{ padding: '0.75rem' }}>
                {row.before_storage_path ? (
                  <span title="Audio uploaded" aria-label="Audio uploaded" style={{ fontSize: '1rem' }}>▶</span>
                ) : (
                  <span style={{ color: '#666', fontSize: '0.75rem' }}>—</span>
                )}
              </td>
              <td style={{ padding: '0.75rem' }}>{String(row.display_order ?? '')}</td>
              <td style={{ padding: '0.75rem' }}>{row.active ? '✓' : '–'}</td>
              <td style={{ padding: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Link href={`/admin/showcase/${String(row.id)}`} style={{ color: '#7c3aed' }}>Edit</Link>
                  <ConfirmDeleteButton action={deleteShowcase.bind(null, String(row.id))} />
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
