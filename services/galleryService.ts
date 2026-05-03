import { createClient } from '@/lib/supabaseServer'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'
import { galleryImageSchema, type GalleryImage } from '@/lib/schemas/gallery'
import { DEMO_GALLERY } from '@/lib/mockData'
import { isDev } from '@/lib/devMode'

export async function getAllGalleryImages(): Promise<ServiceResult<GalleryImage[]>> {
  if (isDev) return ok(DEMO_GALLERY)

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })
      .limit(100)

    if (error) return err(error.message)

    const images: GalleryImage[] = []
    for (const row of data ?? []) {
      let url = row.image_url as string | null
      if (!url && row.storage_path) {
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(row.storage_path as string)
        url = urlData.publicUrl
      }
      if (!url) continue

      const parsed = galleryImageSchema.safeParse({
        id: String(row.id),
        url,
        alt: row.alt ?? undefined,
        caption: row.caption ?? undefined,
        order: row.display_order ?? 0,
      })
      if (parsed.success) images.push(parsed.data)
    }
    return ok(images)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to load gallery')
  }
}
