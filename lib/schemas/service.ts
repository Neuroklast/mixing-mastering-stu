import { z } from 'zod'

export const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  created_at: z.string().optional(),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  price_cents: z.number().int().min(0),
  currency: z.string().default('eur'),
  duration: z.string().nullable().optional(),
  features: z.array(z.string()).default([]),
  display_order: z.number().int().default(0),
  active: z.boolean().default(true),
})

export type Service = z.infer<typeof serviceSchema>
