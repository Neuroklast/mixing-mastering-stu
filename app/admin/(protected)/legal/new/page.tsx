import FormField from '@/app/admin/_components/FormField'
import { createLegal } from '../_actions'

export default function NewLegalPage() {
  return (
    <div style={{ maxWidth: '700px' }}>
      <h1 style={{ marginBottom: '2rem' }}>New Legal Page</h1>
      <form action={createLegal}>
        <FormField label="Title" name="title" required />
        <FormField label="Slug" name="slug" required />
        <FormField label="Content (Markdown/HTML)" name="content" as="textarea" required />
        <FormField label="Last Updated (YYYY-MM-DD)" name="last_updated" type="date" />
        <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
          Create
        </button>
      </form>
    </div>
  )
}
