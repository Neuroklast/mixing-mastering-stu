import Link from 'next/link'
import FormField from '@/app/admin/_components/FormField'
import ImageUploadField from '@/app/admin/_components/ImageUploadField'
import { createHighlight } from '../_actions'

export default function NewHighlightPage() {
  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/admin/music-highlights" style={{ color: '#7c3aed', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Back to Music Highlights
      </Link>
      <h1 style={{ marginBottom: '2rem' }}>New Music Highlight</h1>
      <form action={createHighlight}>
        <FormField label="Title" name="title" required />
        <FormField label="Artist" name="artist" />
        <FormField label="Description" name="description" as="textarea" />
        <ImageUploadField
          label="Image"
          pathName="image_storage_path"
          urlName="image_url"
          pathPrefix="music-highlights"
        />
        <FormField label="Spotify URL" name="spotify_url" type="url" />
        <FormField label="YouTube URL" name="youtube_url" type="url" />
        <FormField label="Bandcamp URL" name="bandcamp_url" type="url" />
        <FormField label="Display Order" name="display_order" type="number" defaultValue="0" />
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
