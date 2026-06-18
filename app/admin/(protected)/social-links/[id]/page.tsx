import { notFound } from 'next/navigation'
import Link from 'next/link'
import FormField from '@/app/admin/_components/FormField'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { updateSocialLink } from '../_actions'

export default async function EditSocialLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('social_links').select('*').eq('id', id).single()
  if (!data) notFound()

  const row = data as Record<string, unknown>
  const update = updateSocialLink.bind(null, id)

  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/admin/social-links" style={{ color: '#7c3aed', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Back to Social Links
      </Link>
      <h1 style={{ marginBottom: '2rem' }}>Edit Social Link</h1>
      <form action={update}>
        <FormField label="Platform" name="platform" as="select" defaultValue={String(row.platform ?? 'other')}>
          <option value="instagram">Instagram</option>
          <option value="youtube">YouTube</option>
          <option value="spotify">Spotify</option>
          <option value="bandcamp">Bandcamp</option>
          <option value="facebook">Facebook</option>
          <option value="twitter">Twitter / X</option>
          <option value="tiktok">TikTok</option>
          <option value="soundcloud">SoundCloud</option>
          <option value="other">Other</option>
        </FormField>
        <FormField label="URL" name="url" type="url" defaultValue={String(row.url ?? '')} required />
        <FormField label="Label (optional override)" name="label" defaultValue={String(row.label ?? '')} />
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
