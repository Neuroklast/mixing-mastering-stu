import { createClient } from '@/lib/supabaseServer'
import { showcaseTrackSchema, type ShowcaseTrack } from '@/lib/schemas/showcase'
import { MOCK_SHOWCASE_TRACK, MOCK_SHOWCASE_TRACKS } from '@/lib/mockData'
import { isDev } from '@/lib/devMode'

export async function getActiveShowcaseTrack(): Promise<ShowcaseTrack | null> {
  if (isDev) return MOCK_SHOWCASE_TRACK

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('showcase')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })
      .limit(1)
      .single()

    if (error || !data) return null

    // Generate signed URLs for audio files (1h expiry)
    let beforeUrl = data.before_url as string | null
    let afterUrl = data.after_url as string | null

    if (data.before_storage_path) {
      const { data: signed } = await supabase.storage
        .from('audio-files')
        .createSignedUrl(data.before_storage_path as string, 3600)
      if (signed?.signedUrl) beforeUrl = signed.signedUrl
    }

    if (data.after_storage_path) {
      const { data: signed } = await supabase.storage
        .from('audio-files')
        .createSignedUrl(data.after_storage_path as string, 3600)
      if (signed?.signedUrl) afterUrl = signed.signedUrl
    }

    if (!beforeUrl || !afterUrl) return null

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

    return parsed.success ? parsed.data : null
  } catch (e) {
    console.error('[showcaseService] getActiveShowcaseTrack failed:', e)
    return null
  }
}

export async function getAllShowcaseTracks(): Promise<ShowcaseTrack[]> {
  if (isDev) return MOCK_SHOWCASE_TRACKS

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('showcase')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })
      .limit(100)

    if (error || !data) return []

    const tracks: ShowcaseTrack[] = []
    for (const row of data) {
      let beforeUrl = row.before_url as string | null
      let afterUrl = row.after_url as string | null

      if (row.before_storage_path) {
        const { data: signed } = await supabase.storage
          .from('audio-files')
          .createSignedUrl(row.before_storage_path as string, 3600)
        if (signed?.signedUrl) beforeUrl = signed.signedUrl
      }

      if (row.after_storage_path) {
        const { data: signed } = await supabase.storage
          .from('audio-files')
          .createSignedUrl(row.after_storage_path as string, 3600)
        if (signed?.signedUrl) afterUrl = signed.signedUrl
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
    return tracks
  } catch (e) {
    console.error('[showcaseService] getAllShowcaseTracks failed:', e)
    return []
  }
}
