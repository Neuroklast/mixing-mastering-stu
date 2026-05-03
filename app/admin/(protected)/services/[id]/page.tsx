import { notFound } from 'next/navigation'
import Link from 'next/link'
import FormField from '@/app/admin/_components/FormField'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { updateService } from '../_actions'

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('services').select('*').eq('id', id).single()
  if (!data) notFound()

  const row = data as Record<string, unknown>
  const features = Array.isArray(row.features)
    ? (row.features as unknown[]).map(String).join('\n')
    : ''
  const update = updateService.bind(null, id)

  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/admin/services" style={{ color: '#7c3aed', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Back to Services
      </Link>
      <h1 style={{ marginBottom: '2rem' }}>Edit Service</h1>
      <form action={update}>
        <FormField label="Slug" name="slug" defaultValue={String(row.slug ?? '')} required />
        <FormField label="Title" name="title" defaultValue={String(row.title ?? '')} required />
        <FormField label="Description / Tagline" name="description" as="textarea" defaultValue={String(row.description ?? '')} />
        <FormField label="Price (cents)" name="price_cents" type="number" defaultValue={String(row.price_cents ?? 0)} required />
        <FormField label="Currency" name="currency" defaultValue={String(row.currency ?? 'eur')} />
        <FormField label="Duration" name="duration" defaultValue={String(row.duration ?? '')} />
        <FormField
          label="Features (one per line — only included features)"
          name="features"
          as="textarea"
          defaultValue={features}
        />
        <FormField label="Display Order" name="display_order" type="number" defaultValue={String(row.display_order ?? 0)} />
        <FormField label="Active" name="active" as="select" defaultValue={row.active ? 'true' : 'false'}>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </FormField>
        <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
          Save
        </button>
      </form>
    </div>
  )
}
