import { z } from 'zod'

export const galleryImageSchema = z.object({
  id: z.string().optional(),
  url: z.string().min(1),
  alt: z.string().optional(),
  caption: z.string().optional(),
  order: z.number().optional(),
})

export type GalleryImage = z.infer<typeof galleryImageSchema>
