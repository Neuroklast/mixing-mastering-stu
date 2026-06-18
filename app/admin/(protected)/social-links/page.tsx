import Link from 'next/link'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { deleteSocialLink } from './_actions'
import ConfirmDeleteButton from '@/app/admin/_components/ConfirmDeleteButton'

export default async function SocialLinksAdminPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('social_links')
    .select('id, platform, url, label, active, display_order')
    .order('display_order', { ascending: true })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Social Links</h1>
        <Link href="/admin/social-links/new" style={{ padding: '0.6rem 1.2rem', background: '#7c3aed', borderRadius: '6px', color: '#fff', textDecoration: 'none' }}>
          + New
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>Platform</th>
              <th style={{ padding: '0.75rem' }}>Label</th>
              <th style={{ padding: '0.75rem' }}>URL</th>
              <th style={{ padding: '0.75rem' }}>Order</th>
              <th style={{ padding: '0.75rem' }}>Active</th>
              <th style={{ padding: '0.75rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => (
              <tr key={String(row.id)} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{String(row.platform ?? '')}</td>
                <td style={{ padding: '0.75rem' }}>{String(row.label ?? '–')}</td>
                <td style={{ padding: '0.75rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <a href={String(row.url ?? '')} target="_blank" rel="noopener noreferrer" style={{ color: '#7c3aed' }}>
                    {String(row.url ?? '')}
                  </a>
                </td>
                <td style={{ padding: '0.75rem' }}>{String(row.display_order ?? 0)}</td>
                <td style={{ padding: '0.75rem' }}>{row.active ? '✓' : '–'}</td>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Link href={`/admin/social-links/${String(row.id)}`} style={{ color: '#7c3aed' }}>Edit</Link>
                    <ConfirmDeleteButton action={deleteSocialLink.bind(null, String(row.id))} />
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
