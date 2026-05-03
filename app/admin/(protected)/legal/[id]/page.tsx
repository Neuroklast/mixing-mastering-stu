import { notFound } from 'next/navigation'
import Link from 'next/link'
import FormField from '@/app/admin/_components/FormField'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { updateLegal } from '../_actions'

export default async function EditLegalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('legal').select('*').eq('id', id).single()
  if (!data) notFound()

  const row = data as Record<string, unknown>
  const update = updateLegal.bind(null, id)

  return (
    <div style={{ maxWidth: '700px' }}>
      <Link href="/admin/legal" style={{ color: '#7c3aed', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Back to Legal Pages
      </Link>
      <h1 style={{ marginBottom: '2rem' }}>Edit Legal Page</h1>
      <form action={update}>
        <FormField label="Title" name="title" defaultValue={String(row.title ?? '')} required />
        <FormField label="Slug" name="slug" defaultValue={String(row.slug ?? '')} required />
        <FormField label="Content (Markdown/HTML)" name="content" as="textarea" defaultValue={String(row.content ?? '')} required />
        <FormField label="Last Updated (YYYY-MM-DD)" name="last_updated" type="date" defaultValue={String(row.last_updated ?? '').slice(0, 10)} />
        <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
          Save
        </button>
      </form>
    </div>
  )
}
