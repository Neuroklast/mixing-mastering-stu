import { z } from 'zod'

const audioUrlSchema = z
  .string()
  .min(1)
  .refine(
    (v) => v.startsWith('/') || v.startsWith('http://') || v.startsWith('https://'),
    { message: 'Must be an absolute URL or a root-relative path starting with /' },
  )

export const showcaseTrackSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  artist: z.string().optional(),
  genre: z.string().optional(),
  equipment: z.string().optional(),
  labelBefore: z.string().optional(),
  labelAfter: z.string().optional(),
  startMarker: z.number().min(0).optional(),
  lufsTarget: z.number().optional(),
  beforeUrl: audioUrlSchema,
  afterUrl: audioUrlSchema,
})

export type ShowcaseTrack = z.infer<typeof showcaseTrackSchema>
