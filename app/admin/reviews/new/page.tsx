import FormField from '@/app/admin/_components/FormField'
import { createReview } from '../_actions'

export default function NewReviewPage() {
  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ marginBottom: '2rem' }}>New Review</h1>
      <form action={createReview}>
        <FormField label="Client Name" name="client_name" required />
        <FormField label="Rating (1–5)" name="rating" type="number" defaultValue="5" required />
        <FormField label="Text" name="text" as="textarea" required />
        <FormField label="Service" name="service" as="select">
          <option value="">–</option>
          <option value="Mix">Mix</option>
          <option value="Master">Master</option>
          <option value="Mix & Master">Mix & Master</option>
          <option value="Producing">Producing</option>
        </FormField>
        <FormField label="Date (YYYY-MM-DD)" name="date" type="date" />
        <FormField label="Project Link" name="project_link" type="url" />
        <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
          Create
        </button>
      </form>
    </div>
  )
}
