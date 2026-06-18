import Link from 'next/link'
import FormField from '@/app/admin/_components/FormField'
import ImageUploadField from '@/app/admin/_components/ImageUploadField'
import AudioUploadField from '@/app/admin/_components/AudioUploadField'
import { createSoundpack } from '../_actions'

export default function NewSoundpackPage() {
  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/admin/soundpacks" style={{ color: '#7c3aed', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Back to Soundpacks
      </Link>
      <h1 style={{ marginBottom: '2rem' }}>New Soundpack</h1>
      <form action={createSoundpack}>
        <FormField label="Name" name="name" required />
        <FormField label="Description" name="description" as="textarea" />
        <FormField label="Genre" name="genre" />
        <FormField label="BPM Range (e.g. 120–140)" name="bpm_range" />
        <FormField label="Sample Count" name="sample_count" type="number" />
        <FormField label="Price (cents, e.g. 1500 = €15.00)" name="price_cents" type="number" defaultValue="0" required />
        <FormField label="Currency (eur, usd, …)" name="currency" defaultValue="eur" />
        <ImageUploadField
          label="Cover Image"
          pathName="cover_storage_path"
          urlName="cover_image_url"
          pathPrefix="soundpacks"
        />
        <AudioUploadField
          label="Preview Audio (.wav / .flac)"
          name="preview_storage_path"
          showcaseId="soundpack-preview"
        />
        <FormField label="Shop / Download URL" name="shop_url" type="url" />
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
