import { z } from 'zod'

export const reviewSchema = z.object({
  id: z.string().optional(),
  clientName: z.string().min(1),
  rating: z.number().min(1).max(5),
  text: z.string().min(1),
  service: z.enum(['Mix', 'Master', 'Mix & Master', 'Producing']).optional(),
  date: z.string().optional(), // ISO date string "YYYY-MM-DD"
  projectLink: z.string().url().optional().or(z.literal('')),
})

export type Review = z.infer<typeof reviewSchema>
