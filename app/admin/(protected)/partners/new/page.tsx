import Link from 'next/link'
import FormField from '@/app/admin/_components/FormField'
import ImageUploadField from '@/app/admin/_components/ImageUploadField'
import { createPartner } from '../_actions'

export default function NewPartnerPage() {
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
      <h1 style={{ marginBottom: '2rem' }}>New Partner / Endorsement</h1>
      <form action={createPartner}>
        <FormField label="Name" name="name" required />
        <FormField label="Website URL" name="url" type="url" />
        <FormField label="Section" name="category" as="select" defaultValue="endorsement">
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
          pathPrefix="partners"
          accept="image/jpeg,image/png,image/webp,image/svg+xml,image/avif"
        />
        <FormField label="Display Order" name="display_order" type="number" defaultValue="0" />
        <FormField label="Active" name="active" as="select" defaultValue="true">
          <option value="true">Yes – show on site</option>
          <option value="false">No – hidden</option>
        </FormField>
        <FormField label="White logo fill" name="logo_white" as="select" defaultValue="true">
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
          Create
        </button>
      </form>
    </div>
  )
}
