import { notFound } from 'next/navigation'
import Link from 'next/link'
import FormField from '@/app/admin/_components/FormField'
import ImageUploadField from '@/app/admin/_components/ImageUploadField'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { updateMember } from '../_actions'

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('members').select('*').eq('id', id).single()
  if (!data) notFound()

  const row = data as Record<string, unknown>
  const socialLinks = (row.social_links ?? {}) as Record<string, unknown>
  const update = updateMember.bind(null, id)

  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/admin/members" style={{ color: '#7c3aed', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Back to Members
      </Link>
      <h1 style={{ marginBottom: '2rem' }}>Edit Member</h1>
      <form action={update}>
        <FormField label="Name" name="name" defaultValue={String(row.name ?? '')} required />
        <FormField label="Role" name="role" defaultValue={String(row.role ?? '')} required />
        <FormField label="Bio" name="bio" as="textarea" defaultValue={String(row.bio ?? '')} />
        <ImageUploadField
          label="Photo"
          pathName="photo_storage_path"
          urlName="photo_url"
          defaultPath={String(row.photo_storage_path ?? '')}
          defaultUrl={String(row.photo_url ?? '')}
          pathPrefix="members"
        />
        <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1rem' }}>Social Links</p>
        <FormField label="Instagram URL" name="social_instagram" type="url" defaultValue={String(socialLinks.instagram ?? '')} />
        <FormField label="SoundCloud URL" name="social_soundcloud" type="url" defaultValue={String(socialLinks.soundcloud ?? '')} />
        <FormField label="Spotify URL" name="social_spotify" type="url" defaultValue={String(socialLinks.spotify ?? '')} />
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
