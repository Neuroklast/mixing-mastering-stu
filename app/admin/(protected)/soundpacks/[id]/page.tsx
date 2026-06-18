import { notFound } from 'next/navigation'
import Link from 'next/link'
import FormField from '@/app/admin/_components/FormField'
import ImageUploadField from '@/app/admin/_components/ImageUploadField'
import AudioUploadField from '@/app/admin/_components/AudioUploadField'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { updateSoundpack } from '../_actions'

export default async function EditSoundpackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('soundpacks').select('*').eq('id', id).single()
  if (!data) notFound()

  const row = data as Record<string, unknown>
  const update = updateSoundpack.bind(null, id)

  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/admin/soundpacks" style={{ color: '#7c3aed', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Back to Soundpacks
      </Link>
      <h1 style={{ marginBottom: '2rem' }}>Edit Soundpack</h1>
      <form action={update}>
        <FormField label="Name" name="name" defaultValue={String(row.name ?? '')} required />
        <FormField label="Description" name="description" as="textarea" defaultValue={String(row.description ?? '')} />
        <FormField label="Genre" name="genre" defaultValue={String(row.genre ?? '')} />
        <FormField label="BPM Range (e.g. 120–140)" name="bpm_range" defaultValue={String(row.bpm_range ?? '')} />
        <FormField label="Sample Count" name="sample_count" type="number" defaultValue={String(row.sample_count ?? '')} />
        <FormField label="Price (cents)" name="price_cents" type="number" defaultValue={String(row.price_cents ?? 0)} required />
        <FormField label="Currency" name="currency" defaultValue={String(row.currency ?? 'eur')} />
        <ImageUploadField
          label="Cover Image"
          pathName="cover_storage_path"
          urlName="cover_image_url"
          defaultPath={String(row.cover_storage_path ?? '')}
          defaultUrl={String(row.cover_image_url ?? '')}
          pathPrefix="soundpacks"
        />
        <AudioUploadField
          label="Preview Audio (.wav / .flac)"
          name="preview_storage_path"
          defaultValue={String(row.preview_storage_path ?? '')}
          showcaseId={id}
        />
        <FormField label="Shop / Download URL" name="shop_url" type="url" defaultValue={String(row.shop_url ?? '')} />
        <FormField label="Display Order" name="display_order" type="number" defaultValue={String(row.display_order ?? 0)} />
        <FormField label="Featured" name="featured" as="select" defaultValue={row.featured ? 'true' : 'false'}>
          <option value="false">No</option>
          <option value="true">Yes</option>
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
