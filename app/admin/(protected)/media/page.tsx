import { createAdminClient } from '@/lib/supabaseAdmin'

export default async function MediaAdminPage() {
  const supabase = createAdminClient()
  const { data: files } = await supabase.storage.from('media').list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Media</h1>
      <p style={{ color: '#aaa', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Files in the <code>media</code> storage bucket.
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
            <th style={{ padding: '0.75rem' }}>Name</th>
            <th style={{ padding: '0.75rem' }}>Size (bytes)</th>
            <th style={{ padding: '0.75rem' }}>Created</th>
          </tr>
        </thead>
        <tbody>
          {(files ?? []).map((file) => {
            const meta = (file.metadata ?? {}) as Record<string, unknown>
            return (
              <tr key={file.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{file.name}</td>
                <td style={{ padding: '0.75rem' }}>{typeof meta.size === 'number' ? String(meta.size) : '–'}</td>
                <td style={{ padding: '0.75rem' }}>{String(file.created_at ?? '').slice(0, 10)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
