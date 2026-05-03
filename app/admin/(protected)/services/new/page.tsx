import Link from 'next/link'
import FormField from '@/app/admin/_components/FormField'
import { createService } from '../_actions'

export default function NewServicePage() {
  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/admin/services" style={{ color: '#7c3aed', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Back to Services
      </Link>
      <h1 style={{ marginBottom: '2rem' }}>New Service</h1>
      <form action={createService}>
        <FormField label="Slug (unique, e.g. mixing)" name="slug" required />
        <FormField label="Title" name="title" required />
        <FormField label="Description / Tagline" name="description" as="textarea" />
        <FormField label="Price (cents, e.g. 20000 = €200)" name="price_cents" type="number" defaultValue="0" required />
        <FormField label="Currency (eur, usd, …)" name="currency" defaultValue="eur" />
        <FormField label="Duration (e.g. 3-5 days)" name="duration" />
        <FormField
          label="Features (one per line — only included features)"
          name="features"
          as="textarea"
        />
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
