import { notFound } from 'next/navigation'
import Link from 'next/link'
import FormField from '@/app/admin/_components/FormField'
import ImageUploadField from '@/app/admin/_components/ImageUploadField'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { getStorageProvider } from '@/lib/storage'
import { updatePartner } from '../_actions'

const MEDIA_BUCKET = process.env.R2_BUCKET_MEDIA ?? 'sonorativa-media'

export default async function EditPartnerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('partners').select('*').eq('id', id).single()
  if (!data) notFound()

  const row = data as Record<string, unknown>
  const update = updatePartner.bind(null, id)

  let defaultLogoUrl = String(row.logo_url ?? '')
  if (row.logo_storage_path) {
    try {
      defaultLogoUrl = getStorageProvider().getPublicUrl(
        MEDIA_BUCKET,
        String(row.logo_storage_path),
      )
    } catch {
      // keep logo_url fallback
    }
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <Link
        href="/admin/partners"
        style={{
          color: '#7c3aed',
          fontSize: '0.85rem',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: '1.5rem',
        }}
      >
        ← Back to Partners
      </Link>
      <h1 style={{ marginBottom: '2rem' }}>Edit Partner</h1>
      <form action={update}>
        <FormField label="Name" name="name" defaultValue={String(row.name ?? '')} required />
        <FormField
          label="Website URL"
          name="url"
          type="url"
          defaultValue={String(row.url ?? '')}
        />
        <FormField
          label="Section"
          name="category"
          as="select"
          defaultValue={String(row.category ?? 'partner')}
        >
          <option value="credit">Credit (logo grid)</option>
          <option value="endorsement">Endorsement</option>
          <option value="partner">Partner / Friend</option>
          <option value="label">Label</option>
          <option value="sponsor">Sponsor</option>
        </FormField>
        <ImageUploadField
          label="Logo"
          pathName="logo_storage_path"
          urlName="logo_url"
          defaultPath={String(row.logo_storage_path ?? '')}
          defaultUrl={defaultLogoUrl}
          pathPrefix="partners"
          accept="image/jpeg,image/png,image/webp,image/svg+xml,image/avif"
        />
        <FormField
          label="Display Order"
          name="display_order"
          type="number"
          defaultValue={String(row.display_order ?? 0)}
        />
        <FormField
          label="Active"
          name="active"
          as="select"
          defaultValue={row.active !== false ? 'true' : 'false'}
        >
          <option value="true">Yes – show on site</option>
          <option value="false">No – hidden</option>
        </FormField>
        <FormField
          label="White logo fill"
          name="logo_white"
          as="select"
          defaultValue={row.logo_white !== false ? 'true' : 'false'}
        >
          <option value="true">Yes – white silhouette on dark site (recommended)</option>
          <option value="false">No – original colors</option>
        </FormField>
        <button
          type="submit"
          style={{
            padding: '0.75rem 1.5rem',
            background: '#7c3aed',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Save
        </button>
      </form>
    </div>
  )
}
