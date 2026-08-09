import { z } from 'zod'

export const partnerCategorySchema = z.enum([
  'credit',
  'endorsement',
  'partner',
  'label',
  'sponsor',
])

export type PartnerCategory = z.infer<typeof partnerCategorySchema>

export const partnerSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  url: z.string().url().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  logoStoragePath: z.string().nullable().optional(),
  category: partnerCategorySchema.default('partner'),
  displayOrder: z.number().int().default(0),
  logoWhite: z.boolean().default(true),
  active: z.boolean().default(true),
})

export type Partner = z.infer<typeof partnerSchema>
