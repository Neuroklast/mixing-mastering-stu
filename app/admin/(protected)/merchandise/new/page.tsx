import Link from 'next/link'
import FormField from '@/app/admin/_components/FormField'
import ImageUploadField from '@/app/admin/_components/ImageUploadField'
import { createMerchandise } from '../_actions'

export default function NewMerchandisePage() {
  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/admin/merchandise" style={{ color: '#7c3aed', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Back to Merchandise
      </Link>
      <h1 style={{ marginBottom: '2rem' }}>New Merchandise Item</h1>
      <form action={createMerchandise}>
        <FormField label="Name" name="name" required />
        <FormField label="Category" name="category" as="select">
          <option value="clothing">Clothing</option>
          <option value="physical">Physical</option>
          <option value="digital">Digital</option>
          <option value="accessories">Accessories</option>
          <option value="other">Other</option>
        </FormField>
        <FormField label="Description" name="description" as="textarea" />
        <FormField label="Price (cents, e.g. 2500 = €25.00)" name="price_cents" type="number" defaultValue="0" required />
        <FormField label="Currency (eur, usd, …)" name="currency" defaultValue="eur" />
        <ImageUploadField
          label="Product Image"
          pathName="image_storage_path"
          urlName="image_url"
          pathPrefix="merchandise"
        />
        <FormField label="Shop / Buy URL" name="shop_url" type="url" />
        <FormField label="Display Order" name="display_order" type="number" defaultValue="0" />
        <FormField label="In Stock" name="in_stock" as="select">
          <option value="true">Yes</option>
          <option value="false">No</option>
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
