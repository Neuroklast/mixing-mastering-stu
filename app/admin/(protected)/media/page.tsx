import { createAdminClient } from '@/lib/supabaseAdmin'
import MediaBrowserClient from './MediaBrowserClient'

export default async function MediaAdminPage() {
  const supabase = createAdminClient()

  const [mediaResult, audioResult] = await Promise.all([
    supabase.storage.from('media').list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } }),
    supabase.storage.from('audio-files').list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } }),
  ])

  const mediaFiles = (mediaResult.data ?? [])
    .filter((f) => f.name !== '.emptyFolderPlaceholder')
    .map((f) => {
      const meta = (f.metadata ?? {}) as Record<string, unknown>
      return {
        name: f.name,
        size: typeof meta.size === 'number' ? meta.size : 0,
        created_at: String(f.created_at ?? ''),
      }
    })

  const audioFiles = (audioResult.data ?? [])
    .filter((f) => f.name !== '.emptyFolderPlaceholder')
    .map((f) => {
      const meta = (f.metadata ?? {}) as Record<string, unknown>
      return {
        name: f.name,
        size: typeof meta.size === 'number' ? meta.size : 0,
        created_at: String(f.created_at ?? ''),
      }
    })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  return (
    <MediaBrowserClient
      mediaFiles={mediaFiles}
      audioFiles={audioFiles}
      supabaseUrl={supabaseUrl}
    />
  )
}
