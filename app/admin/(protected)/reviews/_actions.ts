'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { sendEmail } from '@/lib/email'
import { reviewInviteTemplate } from '@/lib/email/templates'

export async function createReview(formData: FormData) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('reviews').insert({
    client_name: formData.get('client_name'),
    rating: Number(formData.get('rating')),
    text: formData.get('text'),
    service: formData.get('service') || null,
    date: formData.get('date') || null,
    project_link: formData.get('project_link') || null,
    active: true,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin/reviews')
  redirect('/admin/reviews')
}

export async function updateReview(id: string, formData: FormData) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('reviews')
    .update({
      client_name: formData.get('client_name'),
      rating: Number(formData.get('rating')),
      text: formData.get('text'),
      service: formData.get('service') || null,
      date: formData.get('date') || null,
      project_link: formData.get('project_link') || null,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin/reviews')
  redirect('/admin/reviews')
}

export async function deleteReview(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin/reviews')
}

export async function toggleReviewActive(id: string, active: boolean) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('reviews')
    .update({ active })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin/reviews')
}

/**
 * Create a review invite token and send the invite email to the client.
 * Returns the invite record on success.
 */
export async function sendReviewInvite(formData: FormData) {
  const clientName  = String(formData.get('client_name') ?? '').trim()
  const clientEmail = String(formData.get('client_email') ?? '').trim()
  const service     = String(formData.get('service') ?? '').trim() || null

  if (!clientName || !clientEmail) {
    throw new Error('Client name and email are required.')
  }

  const supabase = createAdminClient()

  // Create the invite record — the DB generates the token automatically
  const { data: invite, error } = await supabase
    .from('review_invites')
    .insert({ client_name: clientName, client_email: clientEmail, service })
    .select('id, token')
    .single()

  if (error || !invite) throw new Error(error?.message ?? 'Failed to create invite')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const reviewUrl = `${siteUrl}/review/${String(invite.token)}`

  const { subject, html, text } = reviewInviteTemplate({
    clientName,
    service: service ?? 'Audio Engineering',
    reviewUrl,
  })

  await sendEmail({ to: clientEmail, subject, html, text })

  revalidatePath('/admin/reviews')
  redirect('/admin/reviews?invited=1')
}
