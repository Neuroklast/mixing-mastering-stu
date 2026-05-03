import FormField from '@/app/admin/_components/FormField'
import AudioUploadField from '@/app/admin/_components/AudioUploadField'
import { createShowcase } from '../_actions'

export default function NewShowcasePage() {
  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ marginBottom: '2rem' }}>New Showcase Track</h1>
      <form action={createShowcase}>
        <FormField label="Title" name="title" required />
        <FormField label="Artist" name="artist" />
        <FormField label="Genre" name="genre" />
        <FormField label="Equipment" name="equipment" />
        <FormField label="Label Before" name="label_before" defaultValue="Demo" />
        <FormField label="Label After" name="label_after" defaultValue="Final" />
        <FormField label="Start Marker (s)" name="start_marker" type="number" defaultValue="0" />
        <FormField label="LUFS Target" name="lufs_target" type="number" defaultValue="-14" />
        <FormField label="Display Order" name="display_order" type="number" defaultValue="0" />
        <FormField label="Active" name="active" as="select">
          <option value="false">No</option>
          <option value="true">Yes</option>
        </FormField>
        <AudioUploadField label="Before Audio" name="before_storage_path" />
        <AudioUploadField label="After Audio" name="after_storage_path" />
        <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
          Create
        </button>
      </form>
    </div>
  )
}
