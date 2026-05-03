import Link from 'next/link'
import FormField from '@/app/admin/_components/FormField'
import ImageUploadField from '@/app/admin/_components/ImageUploadField'
import { createGallery } from '../_actions'

export default function NewGalleryPage() {
  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/admin/gallery" style={{ color: '#7c3aed', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Back to Gallery
      </Link>
      <h1 style={{ marginBottom: '2rem' }}>New Gallery Image</h1>
      <form action={createGallery}>
        <ImageUploadField
          label="Image"
          pathName="storage_path"
          urlName="image_url"
          pathPrefix="gallery"
        />
        <FormField label="Alt Text" name="alt" required />
        <FormField label="Caption" name="caption" />
        <FormField label="Display Order" name="display_order" type="number" defaultValue="0" />
        <FormField label="Active" name="active" as="select">
          <option value="false">No</option>
          <option value="true">Yes</option>
        </FormField>
        <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
          Create
        </button>
      </form>
    </div>
  )
}
