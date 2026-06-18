import Link from 'next/link'
import FormField from '@/app/admin/_components/FormField'
import ImageUploadField from '@/app/admin/_components/ImageUploadField'
import { createRelease } from '../_actions'

export default function NewReleasePage() {
  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/admin/releases" style={{ color: '#7c3aed', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Back to Releases
      </Link>
      <h1 style={{ marginBottom: '2rem' }}>New Release</h1>
      <form action={createRelease}>
        <FormField label="Title" name="title" required />
        <FormField label="Artist" name="artist" />
        <FormField label="Type" name="release_type" as="select" defaultValue="album">
          <option value="album">Album</option>
          <option value="ep">EP</option>
          <option value="single">Single</option>
          <option value="compilation">Compilation</option>
        </FormField>
        <FormField label="Release Date" name="release_date" type="date" />
        <FormField label="Label" name="label" />
        <FormField label="Description" name="description" as="textarea" />
        <ImageUploadField
          label="Cover Image"
          pathName="cover_storage_path"
          urlName="cover_image_url"
          pathPrefix="releases"
        />
        <FormField label="Spotify URL" name="spotify_url" type="url" />
        <FormField label="Bandcamp URL" name="bandcamp_url" type="url" />
        <FormField label="YouTube URL" name="youtube_url" type="url" />
        <FormField label="Display Order" name="display_order" type="number" defaultValue="0" />
        <FormField label="Featured" name="featured" as="select">
          <option value="false">No</option>
          <option value="true">Yes</option>
        </FormField>
        <FormField label="Active" name="active" as="select">
          <option value="true">Yes</option>
          <option value="false">No</option>
        </FormField>
        <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
          Create
        </button>
      </form>
    </div>
  )
}
