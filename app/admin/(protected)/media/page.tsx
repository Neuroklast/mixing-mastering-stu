import { getStorageProvider } from '@/lib/storage'
import MediaBrowserClient from './MediaBrowserClient'

const MEDIA_BUCKET = process.env.R2_BUCKET_MEDIA ?? 'sonorativa-media'
const AUDIO_BUCKET = process.env.R2_BUCKET_AUDIO ?? 'sonorativa-audio'

export default async function MediaAdminPage() {
  const storage = getStorageProvider()

  const [mediaObjects, audioObjects] = await Promise.all([
    storage.listObjects(MEDIA_BUCKET, '').catch(() => []),
    storage.listObjects(AUDIO_BUCKET, '').catch(() => []),
  ])

  const mediaFiles = mediaObjects
    .filter((f) => f.name !== '.emptyFolderPlaceholder')
    .map((f) => ({
      name: f.name,
      size: f.size,
      created_at: f.lastModified.toISOString(),
      publicUrl: storage.getPublicUrl(MEDIA_BUCKET, f.name),
    }))

  const audioFiles = audioObjects
    .filter((f) => f.name !== '.emptyFolderPlaceholder')
    .map((f) => ({
      name: f.name,
      size: f.size,
      created_at: f.lastModified.toISOString(),
    }))

  return (
    <MediaBrowserClient
      mediaFiles={mediaFiles}
      audioFiles={audioFiles}
      mediaBucket={MEDIA_BUCKET}
      audioBucket={AUDIO_BUCKET}
    />
  )
}
