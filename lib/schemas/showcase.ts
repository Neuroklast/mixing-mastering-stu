import { z } from 'zod'

export const showcaseTrackSchema = z.object({
  title: z.string().min(1),
  artist: z.string().optional(),
  genre: z.string().optional(),
  equipment: z.string().optional(),
  beforeUrl: z.string().url(),
  afterUrl: z.string().url(),
})

export type ShowcaseTrack = z.infer<typeof showcaseTrackSchema>
