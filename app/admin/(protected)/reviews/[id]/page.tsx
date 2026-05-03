import { notFound } from 'next/navigation'
import FormField from '@/app/admin/_components/FormField'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { updateReview } from '../_actions'

export default async function EditReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('reviews').select('*').eq('id', id).single()
  if (!data) notFound()

  const row = data as Record<string, unknown>
  const update = updateReview.bind(null, id)

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ marginBottom: '2rem' }}>Edit Review</h1>
      <form action={update}>
        <FormField label="Client Name" name="client_name" defaultValue={String(row.client_name ?? '')} required />
        <FormField label="Rating (1–5)" name="rating" type="number" defaultValue={String(row.rating ?? 5)} required />
        <FormField label="Text" name="text" as="textarea" defaultValue={String(row.text ?? '')} required />
        <FormField label="Service" name="service" as="select" defaultValue={String(row.service ?? '')}>
          <option value="">–</option>
          <option value="Mix">Mix</option>
          <option value="Master">Master</option>
          <option value="Mix & Master">Mix & Master</option>
          <option value="Producing">Producing</option>
        </FormField>
        <FormField label="Date (YYYY-MM-DD)" name="date" type="date" defaultValue={String(row.date ?? '').slice(0, 10)} />
        <FormField label="Project Link" name="project_link" type="url" defaultValue={String(row.project_link ?? '')} />
        <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
          Save
        </button>
      </form>
    </div>
  )
}
