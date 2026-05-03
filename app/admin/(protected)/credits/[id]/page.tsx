import { notFound } from 'next/navigation'
import FormField from '@/app/admin/_components/FormField'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { updateCredit } from '../_actions'

export default async function EditCreditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('credits').select('*').eq('id', id).single()
  if (!data) notFound()

  const row = data as Record<string, unknown>
  const update = updateCredit.bind(null, id)

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ marginBottom: '2rem' }}>Edit Credit</h1>
      <form action={update}>
        <FormField label="Name" name="name" defaultValue={String(row.name ?? '')} required />
        <FormField label="Role" name="role" as="select" defaultValue={String(row.role ?? 'Mix')} required>
          <option value="Mix">Mix</option>
          <option value="Master">Master</option>
          <option value="Mix & Master">Mix & Master</option>
          <option value="Producing">Producing</option>
        </FormField>
        <FormField label="Year" name="year" type="number" defaultValue={String(row.year ?? '')} />
        <FormField label="Spotify URL" name="spotify_url" type="url" defaultValue={String(row.spotify_url ?? '')} />
        <FormField label="Cover Image URL" name="cover_image_url" type="url" defaultValue={String(row.cover_image_url ?? '')} />
        <FormField label="Cover Storage Path" name="cover_storage_path" defaultValue={String(row.cover_storage_path ?? '')} />
        <FormField label="Featured" name="featured" as="select" defaultValue={row.featured ? 'true' : 'false'}>
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
