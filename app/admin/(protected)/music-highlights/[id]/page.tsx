import { notFound } from 'next/navigation'
import Link from 'next/link'
import FormField from '@/app/admin/_components/FormField'
import ImageUploadField from '@/app/admin/_components/ImageUploadField'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { updateHighlight } from '../_actions'

export default async function EditHighlightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('music_highlights').select('*').eq('id', id).single()
  if (!data) notFound()

  const row = data as Record<string, unknown>
  const update = updateHighlight.bind(null, id)

  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/admin/music-highlights" style={{ color: '#7c3aed', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Back to Music Highlights
      </Link>
      <h1 style={{ marginBottom: '2rem' }}>Edit Music Highlight</h1>
      <form action={update}>
        <FormField label="Title" name="title" defaultValue={String(row.title ?? '')} required />
        <FormField label="Artist" name="artist" defaultValue={String(row.artist ?? '')} />
        <FormField label="Description" name="description" as="textarea" defaultValue={String(row.description ?? '')} />
        <ImageUploadField
          label="Image"
          pathName="image_storage_path"
          urlName="image_url"
          defaultPath={String(row.image_storage_path ?? '')}
          defaultUrl={String(row.image_url ?? '')}
          pathPrefix="music-highlights"
        />
        <FormField label="Spotify URL" name="spotify_url" type="url" defaultValue={String(row.spotify_url ?? '')} />
        <FormField label="YouTube URL" name="youtube_url" type="url" defaultValue={String(row.youtube_url ?? '')} />
        <FormField label="Bandcamp URL" name="bandcamp_url" type="url" defaultValue={String(row.bandcamp_url ?? '')} />
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
