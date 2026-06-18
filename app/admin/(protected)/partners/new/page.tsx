import Link from 'next/link'
import FormField from '@/app/admin/_components/FormField'
import ImageUploadField from '@/app/admin/_components/ImageUploadField'
import { createPartner } from '../_actions'

export default function NewPartnerPage() {
  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/admin/partners" style={{ color: '#7c3aed', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Back to Partners
      </Link>
      <h1 style={{ marginBottom: '2rem' }}>New Partner</h1>
      <form action={createPartner}>
        <FormField label="Name" name="name" required />
        <FormField label="Website URL" name="url" type="url" />
        <ImageUploadField
          label="Logo"
          pathName="logo_storage_path"
          urlName="logo_url"
          pathPrefix="partners"
        />
        <FormField label="Description" name="description" as="textarea" />
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
