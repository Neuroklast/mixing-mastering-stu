import { z } from 'zod'

export const awardSchema = z.object({
  name: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
})

export const profileSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  bio: z.string().min(1),
  portraitSrc: z.string().optional(),
  awards: z.array(awardSchema),
})

export type Award = z.infer<typeof awardSchema>
export type Profile = z.infer<typeof profileSchema>
