import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { deleteCredit } from './_actions'
import ConfirmDeleteButton from '@/app/admin/_components/ConfirmDeleteButton'

export default async function CreditsAdminPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('credits')
    .select('id, name, role, year, featured, cover_image_url')
    .order('featured', { ascending: false })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Credits</h1>
        <Link href="/admin/credits/new" style={{ padding: '0.6rem 1.2rem', background: '#7c3aed', borderRadius: '6px', color: '#fff', textDecoration: 'none' }}>
          + New
        </Link>
      </div>
      <div className="overflow-x-auto">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
            <th style={{ padding: '0.75rem' }}>Cover</th>
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
              <td style={{ padding: '0.75rem' }}>
                {row.cover_image_url ? (
                  <Image
                    src={String(row.cover_image_url)}
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
              <td style={{ padding: '0.75rem' }}>{String(row.role ?? '')}</td>
              <td style={{ padding: '0.75rem' }}>{String(row.year ?? '')}</td>
              <td style={{ padding: '0.75rem' }}>{row.featured ? '✓' : '–'}</td>
              <td style={{ padding: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Link href={`/admin/credits/${String(row.id)}`} style={{ color: '#7c3aed' }}>Edit</Link>
                  <ConfirmDeleteButton action={deleteCredit.bind(null, String(row.id))} />
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
