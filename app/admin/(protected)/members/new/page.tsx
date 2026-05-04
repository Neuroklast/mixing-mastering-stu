import Link from 'next/link'
import FormField from '@/app/admin/_components/FormField'
import ImageUploadField from '@/app/admin/_components/ImageUploadField'
import { createMember } from '../_actions'

export default function NewMemberPage() {
  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/admin/members" style={{ color: '#7c3aed', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Back to Members
      </Link>
      <h1 style={{ marginBottom: '2rem' }}>New Member</h1>
      <form action={createMember}>
        <FormField label="Name" name="name" required />
        <FormField label="Role" name="role" required />
        <FormField label="Bio" name="bio" as="textarea" />
        <ImageUploadField
          label="Photo"
          pathName="photo_storage_path"
          urlName="photo_url"
          pathPrefix="members"
        />
        <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1rem' }}>Social Links</p>
        <FormField label="Instagram URL" name="social_instagram" type="url" />
        <FormField label="SoundCloud URL" name="social_soundcloud" type="url" />
        <FormField label="Spotify URL" name="social_spotify" type="url" />
        <FormField label="Display Order" name="display_order" type="number" defaultValue="0" />
        <FormField label="Active" name="active" as="select">
          <option value="true">Yes</option>
          <option value="false">No</option>
        </FormField>
        <FormField label="Featured" name="featured" as="select">
          <option value="false">No – show in grid</option>
          <option value="true">Yes – full portrait + bio above grid</option>
        </FormField>
        <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
          Create
        </button>
      </form>
    </div>
  )
}
