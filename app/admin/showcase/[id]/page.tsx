import { notFound } from 'next/navigation'
import FormField from '@/app/admin/_components/FormField'
import AudioUploadField from '@/app/admin/_components/AudioUploadField'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { updateShowcase } from '../_actions'

export default async function EditShowcasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('showcase').select('*').eq('id', id).single()
  if (!data) notFound()

  const row = data as Record<string, unknown>
  const update = updateShowcase.bind(null, id)

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ marginBottom: '2rem' }}>Edit Showcase Track</h1>
      <form action={update}>
        <FormField label="Title" name="title" defaultValue={String(row.title ?? '')} required />
        <FormField label="Artist" name="artist" defaultValue={String(row.artist ?? '')} />
        <FormField label="Genre" name="genre" defaultValue={String(row.genre ?? '')} />
        <FormField label="Equipment" name="equipment" defaultValue={String(row.equipment ?? '')} />
        <FormField label="Label Before" name="label_before" defaultValue={String(row.label_before ?? 'Demo')} />
        <FormField label="Label After" name="label_after" defaultValue={String(row.label_after ?? 'Final')} />
        <FormField label="Start Marker (s)" name="start_marker" type="number" defaultValue={String(row.start_marker ?? 0)} />
        <FormField label="LUFS Target" name="lufs_target" type="number" defaultValue={String(row.lufs_target ?? -14)} />
        <FormField label="Display Order" name="display_order" type="number" defaultValue={String(row.display_order ?? 0)} />
        <FormField label="Active" name="active" as="select" defaultValue={row.active ? 'true' : 'false'}>
          <option value="false">No</option>
          <option value="true">Yes</option>
        </FormField>
        <AudioUploadField label="Before Audio" name="before_storage_path" defaultValue={String(row.before_storage_path ?? '')} />
        <AudioUploadField label="After Audio" name="after_storage_path" defaultValue={String(row.after_storage_path ?? '')} />
        <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
          Save
        </button>
      </form>
    </div>
  )
}
