'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/app/admin/_actions/auth'

const gigInputSchema = z.object({
  title: z.string().max(300).optional(),
  venue: z.string().min(1, 'Venue is required').max(300),
  city: z.string().min(1, 'City is required').max(200),
  country: z.string().min(1, 'Country is required').max(200),
  date: z.string().min(1, 'Date is required'),
  time: z.string().max(50).optional(),
  tickets_url: z.string().url('Invalid tickets URL').max(500).optional().or(z.literal('')),
  description: z.string().max(5000).optional(),
  featured: z.string().optional(),
  cancelled: z.string().optional(),
  display_order: z.coerce.number().int().default(0),
})

export async function createGig(formData: FormData) {
  await requireAdmin()

  const input = gigInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('gigs').insert({
    title: input.data.title || null,
    venue: input.data.venue,
    city: input.data.city,
    country: input.data.country,
    date: input.data.date,
    time: input.data.time || null,
    tickets_url: input.data.tickets_url || null,
    description: input.data.description || null,
    featured: input.data.featured === 'true',
    cancelled: input.data.cancelled === 'true',
    display_order: input.data.display_order,
  })
  if (error) {
    console.error('[gigs] createGig DB error:', error.message)
    throw new Error('Failed to save gig. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/gigs')
  redirect('/admin/gigs')
}

export async function updateGig(id: string, formData: FormData) {
  await requireAdmin()

  const input = gigInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('gigs')
    .update({
      title: input.data.title || null,
      venue: input.data.venue,
      city: input.data.city,
      country: input.data.country,
      date: input.data.date,
      time: input.data.time || null,
      tickets_url: input.data.tickets_url || null,
      description: input.data.description || null,
      featured: input.data.featured === 'true',
      cancelled: input.data.cancelled === 'true',
      display_order: input.data.display_order,
    })
    .eq('id', id)
  if (error) {
    console.error('[gigs] updateGig DB error:', error.message)
    throw new Error('Failed to update gig. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/gigs')
  redirect('/admin/gigs')
}

export async function deleteGig(id: string) {
  await requireAdmin()

  const supabase = createAdminClient()
  const { error } = await supabase.from('gigs').delete().eq('id', id)
  if (error) {
    console.error('[gigs] deleteGig DB error:', error.message)
    throw new Error('Failed to delete gig. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/gigs')
}
