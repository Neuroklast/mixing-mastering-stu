import { notFound } from 'next/navigation'
import Link from 'next/link'
import FormField from '@/app/admin/_components/FormField'
import ImageUploadField from '@/app/admin/_components/ImageUploadField'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { updateRelease } from '../_actions'

export default async function EditReleasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('releases').select('*').eq('id', id).single()
  if (!data) notFound()

  const row = data as Record<string, unknown>
  const update = updateRelease.bind(null, id)

  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/admin/releases" style={{ color: '#7c3aed', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Back to Releases
      </Link>
      <h1 style={{ marginBottom: '2rem' }}>Edit Release</h1>
      <form action={update}>
        <FormField label="Title" name="title" defaultValue={String(row.title ?? '')} required />
        <FormField label="Artist" name="artist" defaultValue={String(row.artist ?? '')} />
        <FormField label="Type" name="release_type" as="select" defaultValue={String(row.release_type ?? 'album')}>
          <option value="album">Album</option>
          <option value="ep">EP</option>
          <option value="single">Single</option>
          <option value="compilation">Compilation</option>
        </FormField>
        <FormField label="Release Date" name="release_date" type="date" defaultValue={String(row.release_date ?? '').slice(0, 10)} />
        <FormField label="Label" name="label" defaultValue={String(row.label ?? '')} />
        <FormField label="Description" name="description" as="textarea" defaultValue={String(row.description ?? '')} />
        <ImageUploadField
          label="Cover Image"
          pathName="cover_storage_path"
          urlName="cover_image_url"
          defaultPath={String(row.cover_storage_path ?? '')}
          defaultUrl={String(row.cover_image_url ?? '')}
          pathPrefix="releases"
        />
        <FormField label="Spotify URL" name="spotify_url" type="url" defaultValue={String(row.spotify_url ?? '')} />
        <FormField label="Bandcamp URL" name="bandcamp_url" type="url" defaultValue={String(row.bandcamp_url ?? '')} />
        <FormField label="YouTube URL" name="youtube_url" type="url" defaultValue={String(row.youtube_url ?? '')} />
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
