import { notFound } from 'next/navigation'
import Link from 'next/link'
import FormField from '@/app/admin/_components/FormField'
import ImageUploadField from '@/app/admin/_components/ImageUploadField'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { updateMerchandise } from '../_actions'

export default async function EditMerchandisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('merchandise').select('*').eq('id', id).single()
  if (!data) notFound()

  const row = data as Record<string, unknown>
  const update = updateMerchandise.bind(null, id)

  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/admin/merchandise" style={{ color: '#7c3aed', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Back to Merchandise
      </Link>
      <h1 style={{ marginBottom: '2rem' }}>Edit Merchandise Item</h1>
      <form action={update}>
        <FormField label="Name" name="name" defaultValue={String(row.name ?? '')} required />
        <FormField label="Category" name="category" as="select" defaultValue={String(row.category ?? 'other')}>
          <option value="clothing">Clothing</option>
          <option value="physical">Physical</option>
          <option value="digital">Digital</option>
          <option value="accessories">Accessories</option>
          <option value="other">Other</option>
        </FormField>
        <FormField label="Description" name="description" as="textarea" defaultValue={String(row.description ?? '')} />
        <FormField label="Price (cents)" name="price_cents" type="number" defaultValue={String(row.price_cents ?? 0)} required />
        <FormField label="Currency" name="currency" defaultValue={String(row.currency ?? 'eur')} />
        <ImageUploadField
          label="Product Image"
          pathName="image_storage_path"
          urlName="image_url"
          defaultPath={String(row.image_storage_path ?? '')}
          defaultUrl={String(row.image_url ?? '')}
          pathPrefix="merchandise"
        />
        <FormField label="Shop / Buy URL" name="shop_url" type="url" defaultValue={String(row.shop_url ?? '')} />
        <FormField label="Display Order" name="display_order" type="number" defaultValue={String(row.display_order ?? 0)} />
        <FormField label="In Stock" name="in_stock" as="select" defaultValue={row.in_stock ? 'true' : 'false'}>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </FormField>
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
