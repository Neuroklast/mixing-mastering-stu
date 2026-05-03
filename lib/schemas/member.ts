import { z } from 'zod'

export const memberSchema = z.object({
  id: z.string().uuid().optional(),
  created_at: z.string().optional(),
  name: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().nullable().optional(),
  photo_url: z.string().nullable().optional(),
  photo_storage_path: z.string().nullable().optional(),
  social_links: z
    .object({
      instagram: z.string().optional(),
      soundcloud: z.string().optional(),
      spotify: z.string().optional(),
    })
    .passthrough()
    .default({}),
  display_order: z.number().int().default(0),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
})

export type Member = z.infer<typeof memberSchema>
