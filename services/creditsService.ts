import { createClient } from '@/lib/supabaseServer'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'
import { creditSchema, type Credit } from '@/lib/schemas/credits'
import { MOCK_CREDITS } from '@/lib/mockData'
import { isDev } from '@/lib/devMode'

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

    const credits: Credit[] = []
    for (const row of data ?? []) {
      let coverImageUrl: string | null = null
      if (row.cover_image_url) {
        coverImageUrl = row.cover_image_url as string
      } else if (row.cover_storage_path) {
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(row.cover_storage_path as string)
        coverImageUrl = urlData.publicUrl
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
    return ok(credits)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to load credits')
  }
}
