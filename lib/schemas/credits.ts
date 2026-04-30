import { z } from 'zod'

export const creditSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  role: z.enum(['Mix', 'Master', 'Mix & Master', 'Producing']),
  year: z.number().optional(),
  spotifyUrl: z.string().url().optional().or(z.literal('')),
  coverImage: z.object({ url: z.string() }).nullable().optional(),
  featured: z.boolean().optional(),
})

export type Credit = z.infer<typeof creditSchema>
