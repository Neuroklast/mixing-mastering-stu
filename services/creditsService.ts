import { createClient } from '@/lib/supabaseServer'
import { getStorageProvider } from '@/lib/storage'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'
import { creditSchema, type Credit } from '@/lib/schemas/credits'
import { MOCK_CREDITS } from '@/lib/mockData'
import { isDev, hideDemoFallback } from '@/lib/devMode'

const MEDIA_BUCKET = process.env.R2_BUCKET_MEDIA ?? 'sonorativa-media'

export async function getAllCredits(): Promise<ServiceResult<Credit[]>> {
  if (isDev) return ok(MOCK_CREDITS)

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('credits')
      .select('*')
      .order('featured', { ascending: false })
      .limit(200)

    if (error) return err(error.message)

    const storage = getStorageProvider()
    const credits: Credit[] = []
    for (const row of data ?? []) {
      let coverImageUrl: string | null = null

      // R2 cover_storage_path is the source of truth post-migration; prefer it over cover_image_url
      if (row.cover_storage_path) {
        coverImageUrl = storage.getPublicUrl(MEDIA_BUCKET, String(row.cover_storage_path))
      } else if (row.cover_image_url) {
        coverImageUrl = String(row.cover_image_url)
      }

      const parsed = creditSchema.safeParse({
        id: String(row.id),
        name: row.name,
        role: row.role,
        year: row.year ?? undefined,
        spotifyUrl: row.spotify_url ?? undefined,
        coverImage: coverImageUrl ? { url: coverImageUrl } : undefined,
        featured: row.featured ?? false,
      })
      if (parsed.success) credits.push(parsed.data)
    }
    // Fall back to demo data when the DB table is empty (unless explicitly disabled)
    if (credits.length === 0 && !hideDemoFallback) return ok(MOCK_CREDITS)
    return ok(credits)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to load credits')
  }
}
