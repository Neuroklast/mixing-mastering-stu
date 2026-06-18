import { notFound } from 'next/navigation'
import Link from 'next/link'
import FormField from '@/app/admin/_components/FormField'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { updateGig } from '../_actions'

export default async function EditGigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('gigs').select('*').eq('id', id).single()
  if (!data) notFound()

  const row = data as Record<string, unknown>
  const update = updateGig.bind(null, id)

  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/admin/gigs" style={{ color: '#7c3aed', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Back to Gigs
      </Link>
      <h1 style={{ marginBottom: '2rem' }}>Edit Gig</h1>
      <form action={update}>
        <FormField label="Show Title (optional)" name="title" defaultValue={String(row.title ?? '')} />
        <FormField label="Venue" name="venue" defaultValue={String(row.venue ?? '')} required />
        <FormField label="City" name="city" defaultValue={String(row.city ?? '')} required />
        <FormField label="Country" name="country" defaultValue={String(row.country ?? '')} required />
        <FormField label="Date" name="date" type="date" defaultValue={String(row.date ?? '').slice(0, 10)} required />
        <FormField label="Time (e.g. 20:00)" name="time" defaultValue={String(row.time ?? '')} />
        <FormField label="Tickets URL" name="tickets_url" type="url" defaultValue={String(row.tickets_url ?? '')} />
        <FormField label="Description" name="description" as="textarea" defaultValue={String(row.description ?? '')} />
        <FormField label="Display Order" name="display_order" type="number" defaultValue={String(row.display_order ?? 0)} />
        <FormField label="Featured" name="featured" as="select" defaultValue={row.featured ? 'true' : 'false'}>
          <option value="false">No</option>
          <option value="true">Yes</option>
        </FormField>
        <FormField label="Cancelled" name="cancelled" as="select" defaultValue={row.cancelled ? 'true' : 'false'}>
          <option value="false">No</option>
          <option value="true">Yes</option>
        </FormField>
        <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
          Save
        </button>
      </form>
    </div>
  )
}
