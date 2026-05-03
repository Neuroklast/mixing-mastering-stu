import { getPayload } from 'payload'
import config from '@payload-config'
import { isDev } from '@/lib/devMode'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'
import { galleryImageSchema, type GalleryImage } from '@/lib/schemas/gallery'
import { resolveMediaUrl } from '@/lib/payload/resolveMediaUrl'
import { DEMO_GALLERY } from '@/lib/mockData'

function docToGalleryImage(doc: Record<string, unknown>): GalleryImage | null {
  const url = resolveMediaUrl(doc.image)
  if (!url) return null

  const parsed = galleryImageSchema.safeParse({
    id: String(doc.id),
    url,
    alt: typeof doc.alt === 'string' ? doc.alt : undefined,
    caption: typeof doc.caption === 'string' ? doc.caption : undefined,
    order: typeof doc.order === 'number' ? doc.order : 0,
  })
  return parsed.success ? parsed.data : null
}

export async function getAllGalleryImages(): Promise<ServiceResult<GalleryImage[]>> {
  if (isDev) return ok(DEMO_GALLERY)

  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'gallery',
      where: { active: { equals: true } },
      sort: 'order',
      limit: 100,
      depth: 1,
    })

    const images: GalleryImage[] = []
    for (const doc of result.docs) {
      const image = docToGalleryImage(doc as unknown as Record<string, unknown>)
      if (image) images.push(image)
    }
    return ok(images)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to load gallery')
  }
}
