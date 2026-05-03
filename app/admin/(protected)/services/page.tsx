import Link from 'next/link'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { deleteService } from './_actions'
import ConfirmDeleteButton from '@/app/admin/_components/ConfirmDeleteButton'

export default async function ServicesAdminPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('services')
    .select('id, title, slug, price_cents, currency, active, display_order')
    .order('display_order', { ascending: true })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Services</h1>
        <Link href="/admin/services/new" style={{ padding: '0.6rem 1.2rem', background: '#7c3aed', borderRadius: '6px', color: '#fff', textDecoration: 'none' }}>
          + New
        </Link>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
            <th style={{ padding: '0.75rem' }}>Title</th>
            <th style={{ padding: '0.75rem' }}>Slug</th>
            <th style={{ padding: '0.75rem' }}>Price</th>
            <th style={{ padding: '0.75rem' }}>Order</th>
            <th style={{ padding: '0.75rem' }}>Active</th>
            <th style={{ padding: '0.75rem' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((row) => {
            const priceCents = typeof row.price_cents === 'number' ? row.price_cents : 0
            const currency = String(row.currency ?? 'eur').toUpperCase()
            const priceDisplay = `${currency} ${(priceCents / 100).toFixed(2)}`
            return (
              <tr key={String(row.id)} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '0.75rem' }}>{String(row.title ?? '')}</td>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{String(row.slug ?? '')}</td>
                <td style={{ padding: '0.75rem' }}>{priceDisplay}</td>
                <td style={{ padding: '0.75rem' }}>{String(row.display_order ?? '')}</td>
                <td style={{ padding: '0.75rem' }}>{row.active ? '✓' : '–'}</td>
                <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Link href={`/admin/services/${String(row.id)}`} style={{ color: '#7c3aed' }}>Edit</Link>
                  <ConfirmDeleteButton action={deleteService.bind(null, String(row.id))} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
