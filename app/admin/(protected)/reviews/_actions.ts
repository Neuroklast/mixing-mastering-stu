'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/app/admin/_actions/auth'
import { sendEmail } from '@/lib/email'
import { reviewInviteTemplate } from '@/lib/email/templates'

// ── Input schemas ──────────────────────────────────────────────────────────────

const reviewInputSchema = z.object({
  client_name: z.string().min(1, 'Client name is required').max(200),
  rating: z.coerce.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  text: z.string().min(1, 'Review text is required').max(5000),
  service: z.enum(['Mix', 'Master', 'Mix & Master', 'Producing']).optional(),
  date: z.string().optional(),
  project_link: z.string().url('Invalid project link URL').optional().or(z.literal('')),
})

// ── Actions ────────────────────────────────────────────────────────────────────

export async function createReview(formData: FormData) {
  await requireAdmin()

  const input = reviewInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('reviews').insert({
    client_name: input.data.client_name,
    rating: input.data.rating,
    text: input.data.text,
    service: input.data.service ?? null,
    date: input.data.date?.trim() || new Date().toISOString().slice(0, 10),
    project_link: input.data.project_link || null,
    active: true,
  })
  if (error) {
    console.error('[reviews] createReview DB error:', error.message)
    throw new Error('Failed to save review. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/reviews')
  redirect('/admin/reviews')
}

export async function updateReview(id: string, formData: FormData) {
  await requireAdmin()

  const input = reviewInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('reviews')
    .update({
      client_name: input.data.client_name,
      rating: input.data.rating,
      text: input.data.text,
      service: input.data.service ?? null,
      date: input.data.date?.trim() || new Date().toISOString().slice(0, 10),
      project_link: input.data.project_link || null,
    })
    .eq('id', id)
  if (error) {
    console.error('[reviews] updateReview DB error:', error.message)
    throw new Error('Failed to update review. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/reviews')
  redirect('/admin/reviews')
}

export async function deleteReview(id: string) {
  await requireAdmin()

  const supabase = createAdminClient()
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) {
    console.error('[reviews] deleteReview DB error:', error.message)
    throw new Error('Failed to delete review. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/reviews')
}

export async function toggleReviewActive(id: string, active: boolean) {
  await requireAdmin()

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('reviews')
    .update({ active })
    .eq('id', id)
  if (error) {
    console.error('[reviews] toggleReviewActive DB error:', error.message)
    throw new Error('Failed to update review status. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/reviews')
}

const reviewInviteSchema = z.object({
  client_name: z.string().min(1, 'Client name is required').max(200),
  client_email: z.string().email('Invalid email address'),
  service: z.string().optional(),
})

/**
 * Create a review invite token and send the invite email to the client.
 * Returns the invite record on success.
 */
export async function sendReviewInvite(formData: FormData) {
  await requireAdmin()

  const input = reviewInviteSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const { client_name: clientName, client_email: clientEmail } = input.data
  const service = input.data.service?.trim() || null

  const supabase = createAdminClient()

  // Create the invite record — the DB generates the token automatically
  const { data: invite, error } = await supabase
    .from('review_invites')
    .insert({ client_name: clientName, client_email: clientEmail, service })
    .select('id, token')
    .single()

  if (error || !invite) {
    console.error('[reviews] sendReviewInvite DB error:', error?.message)
    throw new Error('Failed to create invite. Please try again.')
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const reviewUrl = `${siteUrl}/review/${String(invite.token)}`

  const { subject, html, text } = reviewInviteTemplate({
    clientName,
    service: service ?? 'Audio Engineering',
    reviewUrl,
  })

  // Best-effort: a failed email should not abort invite creation
  try {
    await sendEmail({ to: clientEmail, subject, html, text })
  } catch (emailErr) {
    console.error('[reviews] sendReviewInvite email failed:', emailErr)
  }

  revalidatePath('/admin/reviews')
  redirect('/admin/reviews?invited=1')
}
