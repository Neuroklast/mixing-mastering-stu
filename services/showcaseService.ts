import { createClient } from '@/lib/supabaseServer'
import { getStorageProvider } from '@/lib/storage'
import { showcaseTrackSchema, type ShowcaseTrack } from '@/lib/schemas/showcase'
import { MOCK_SHOWCASE_TRACK, MOCK_SHOWCASE_TRACKS } from '@/lib/mockData'
import { isDev } from '@/lib/devMode'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'

const AUDIO_BUCKET = process.env.R2_BUCKET_AUDIO ?? 'sonorativa-audio'

export async function getActiveShowcaseTrack(): Promise<ServiceResult<ShowcaseTrack | null>> {
  if (isDev) return ok(MOCK_SHOWCASE_TRACK)

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('showcase')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })
      .limit(1)
      .single()

    if (error || !data) return ok(null)

    // Generate signed URLs for audio files via R2 (1h expiry)
    const storage = getStorageProvider()
    let beforeUrl = data.before_url as string | null
    let afterUrl = data.after_url as string | null

    if (data.before_storage_path) {
      beforeUrl = await storage.createSignedDownloadUrl(
        AUDIO_BUCKET,
        data.before_storage_path as string,
        3600,
      )
    }

    if (data.after_storage_path) {
      afterUrl = await storage.createSignedDownloadUrl(
        AUDIO_BUCKET,
        data.after_storage_path as string,
        3600,
      )
    }

    if (!beforeUrl || !afterUrl) return ok(null)

    const parsed = showcaseTrackSchema.safeParse({
      id: String(data.id),
      title: data.title,
      artist: data.artist ?? undefined,
      genre: data.genre ?? undefined,
      equipment: data.equipment ?? undefined,
      labelBefore: data.label_before ?? 'Demo',
      labelAfter: data.label_after ?? 'Final',
      startMarker: typeof data.start_marker === 'number' ? data.start_marker : 0,
      lufsTarget: typeof data.lufs_target === 'number' ? data.lufs_target : -14,
      beforeUrl,
      afterUrl,
    })

    return ok(parsed.success ? parsed.data : null)
  } catch (e) {
    console.error('[showcaseService] getActiveShowcaseTrack failed:', e)
    return err('Failed to load showcase track')
  }
}

export async function getAllShowcaseTracks(): Promise<ServiceResult<ShowcaseTrack[]>> {
  if (isDev) return ok(MOCK_SHOWCASE_TRACKS)

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('showcase')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })
      .limit(100)

    if (error || !data) return ok([])

    const storage = getStorageProvider()
    const tracks: ShowcaseTrack[] = []
    for (const row of data) {
      let beforeUrl = row.before_url as string | null
      let afterUrl = row.after_url as string | null

      if (row.before_storage_path) {
        beforeUrl = await storage.createSignedDownloadUrl(
          AUDIO_BUCKET,
          row.before_storage_path as string,
          3600,
        )
      }

      if (row.after_storage_path) {
        afterUrl = await storage.createSignedDownloadUrl(
          AUDIO_BUCKET,
          row.after_storage_path as string,
          3600,
        )
      }

      if (!beforeUrl || !afterUrl) continue

      const parsed = showcaseTrackSchema.safeParse({
        id: String(row.id),
        title: row.title,
        artist: row.artist ?? undefined,
        genre: row.genre ?? undefined,
        equipment: row.equipment ?? undefined,
        labelBefore: row.label_before ?? 'Demo',
        labelAfter: row.label_after ?? 'Final',
        startMarker: typeof row.start_marker === 'number' ? row.start_marker : 0,
        lufsTarget: typeof row.lufs_target === 'number' ? row.lufs_target : -14,
        beforeUrl,
        afterUrl,
      })

      if (parsed.success) tracks.push(parsed.data)
    }
    return ok(tracks)
  } catch (e) {
    console.error('[showcaseService] getAllShowcaseTracks failed:', e)
    return err('Failed to load showcase tracks')
  }
}
