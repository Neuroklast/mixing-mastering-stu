import FormField from '@/app/admin/_components/FormField'
import { createCredit } from '../_actions'

export default function NewCreditPage() {
  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ marginBottom: '2rem' }}>New Credit</h1>
      <form action={createCredit}>
        <FormField label="Name" name="name" required />
        <FormField label="Role" name="role" as="select" required>
          <option value="Mix">Mix</option>
          <option value="Master">Master</option>
          <option value="Mix & Master">Mix & Master</option>
          <option value="Producing">Producing</option>
        </FormField>
        <FormField label="Year" name="year" type="number" />
        <FormField label="Spotify URL" name="spotify_url" type="url" />
        <FormField label="Cover Image URL" name="cover_image_url" type="url" />
        <FormField label="Cover Storage Path" name="cover_storage_path" />
        <FormField label="Featured" name="featured" as="select">
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
