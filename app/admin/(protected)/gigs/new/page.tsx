import Link from 'next/link'
import FormField from '@/app/admin/_components/FormField'
import { createGig } from '../_actions'

export default function NewGigPage() {
  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/admin/gigs" style={{ color: '#7c3aed', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Back to Gigs
      </Link>
      <h1 style={{ marginBottom: '2rem' }}>New Gig</h1>
      <form action={createGig}>
        <FormField label="Show Title (optional)" name="title" />
        <FormField label="Venue" name="venue" required />
        <FormField label="City" name="city" required />
        <FormField label="Country" name="country" required />
        <FormField label="Date" name="date" type="date" required />
        <FormField label="Time (e.g. 20:00)" name="time" />
        <FormField label="Tickets URL" name="tickets_url" type="url" />
        <FormField label="Description" name="description" as="textarea" />
        <FormField label="Display Order" name="display_order" type="number" defaultValue="0" />
        <FormField label="Featured" name="featured" as="select">
          <option value="false">No</option>
          <option value="true">Yes</option>
        </FormField>
        <FormField label="Cancelled" name="cancelled" as="select">
          <option value="false">No</option>
          <option value="true">Yes</option>
        </FormField>
        <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
          Create
        </button>
      </form>
    </div>
  )
}
