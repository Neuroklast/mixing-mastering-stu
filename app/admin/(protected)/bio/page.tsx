import { createAdminClient } from '@/lib/supabaseAdmin'
import FormField from '@/app/admin/_components/FormField'
import ImageUploadField from '@/app/admin/_components/ImageUploadField'
import { updateBio } from './_actions'

const BIO_ID = '00000000-0000-0000-0000-000000000001'
const MEDIA_BUCKET = process.env.R2_BUCKET_MEDIA ?? 'zardonic-media'

export default async function BioAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const saved = params.saved === '1'

  const supabase = createAdminClient()
  const { data } = await supabase.from('bio').select('*').eq('id', BIO_ID).single()

  const row = (data ?? {}) as Record<string, unknown>

  return (
    <div style={{ maxWidth: '700px' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Bio</h1>
      <p style={{ color: '#aaa', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Edit the artist bio displayed on the public site.
      </p>
      {saved && (
        <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: '#052e16', border: '1px solid #166534', borderRadius: '6px', color: '#4ade80', fontSize: '0.9rem' }}>
          ✓ Changes saved successfully.
        </div>
      )}
      <form action={updateBio}>
        <FormField
          label="Short Bio"
          name="text"
          as="textarea"
          defaultValue={String(row.text ?? '')}
        />
        <FormField
          label="Extended Bio"
          name="extended_text"
          as="textarea"
          defaultValue={String(row.extended_text ?? '')}
        />
        <ImageUploadField
          label="Artist Photo"
          pathName="photo_storage_path"
          urlName="photo_url"
          defaultPath={String(row.photo_storage_path ?? '')}
          defaultUrl={String(row.photo_url ?? '')}
          bucket={MEDIA_BUCKET}
          pathPrefix="bio"
        />
        <button
          type="submit"
          style={{ padding: '0.75rem 1.5rem', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
        >
          Save Bio
        </button>
      </form>
    </div>
  )
}
