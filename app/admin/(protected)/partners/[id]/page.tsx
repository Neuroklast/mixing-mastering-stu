import { notFound } from 'next/navigation'
import Link from 'next/link'
import FormField from '@/app/admin/_components/FormField'
import ImageUploadField from '@/app/admin/_components/ImageUploadField'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { updatePartner } from '../_actions'

export default async function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('partners').select('*').eq('id', id).single()
  if (!data) notFound()

  const row = data as Record<string, unknown>
  const update = updatePartner.bind(null, id)

  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/admin/partners" style={{ color: '#7c3aed', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Back to Partners
      </Link>
      <h1 style={{ marginBottom: '2rem' }}>Edit Partner</h1>
      <form action={update}>
        <FormField label="Name" name="name" defaultValue={String(row.name ?? '')} required />
        <FormField label="Website URL" name="url" type="url" defaultValue={String(row.url ?? '')} />
        <ImageUploadField
          label="Logo"
          pathName="logo_storage_path"
          urlName="logo_url"
          defaultPath={String(row.logo_storage_path ?? '')}
          defaultUrl={String(row.logo_url ?? '')}
          pathPrefix="partners"
        />
        <FormField label="Description" name="description" as="textarea" defaultValue={String(row.description ?? '')} />
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
