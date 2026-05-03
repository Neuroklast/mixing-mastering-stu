import { z } from 'zod'

export const legalPageSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  slug: z.string().min(1),
  /** Rich text stored as a plain string after CMS serialisation. */
  content: z.string().min(1),
  lastUpdated: z.string().optional(),
})

export type LegalPage = z.infer<typeof legalPageSchema>
