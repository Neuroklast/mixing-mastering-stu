import { notFound } from 'next/navigation'
import Link from 'next/link'
import FormField from '@/app/admin/_components/FormField'
import ImageUploadField from '@/app/admin/_components/ImageUploadField'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { updateGallery } from '../_actions'

export default async function EditGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('gallery').select('*').eq('id', id).single()
  if (!data) notFound()

  const row = data as Record<string, unknown>
  const update = updateGallery.bind(null, id)

  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/admin/gallery" style={{ color: '#7c3aed', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Back to Gallery
      </Link>
      <h1 style={{ marginBottom: '2rem' }}>Edit Gallery Image</h1>
      <form action={update}>
        <ImageUploadField
          label="Image"
          pathName="storage_path"
          urlName="image_url"
          defaultPath={String(row.storage_path ?? '')}
          defaultUrl={String(row.image_url ?? '')}
          pathPrefix="gallery"
        />
        <FormField label="Alt Text" name="alt" defaultValue={String(row.alt ?? '')} required />
        <FormField label="Caption" name="caption" defaultValue={String(row.caption ?? '')} />
        <FormField label="Display Order" name="display_order" type="number" defaultValue={String(row.display_order ?? 0)} />
        <FormField label="Active" name="active" as="select" defaultValue={row.active ? 'true' : 'false'}>
          <option value="false">No</option>
          <option value="true">Yes</option>
        </FormField>
        <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
          Save
        </button>
      </form>
    </div>
  )
}
