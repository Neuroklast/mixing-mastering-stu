'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { revalidatePath } from 'next/cache'

export async function submitReviewViaToken(token: string, formData: FormData) {
  const rating = Number(formData.get('rating'))
  const text = String(formData.get('text') ?? '').trim()
  const projectLink = String(formData.get('project_link') ?? '').trim() || null

  if (!text || rating < 1 || rating > 5) {
    throw new Error('Please provide a rating and review text.')
  }

  const supabase = createAdminClient()

  // Look up the invite
  const { data: invite, error: inviteError } = await supabase
    .from('review_invites')
    .select('id, client_name, service, used_at, expires_at')
    .eq('token', token)
    .single()

  if (inviteError || !invite) {
    throw new Error('Invalid or expired review link.')
  }

  if (invite.used_at) {
    redirect(`/review/${token}?error=already_used`)
  }

  if (invite.expires_at && new Date(invite.expires_at as string) < new Date()) {
    redirect(`/review/${token}?error=expired`)
  }

  // Insert the review (inactive by default — admin approves)
  const { error: reviewError } = await supabase.from('reviews').insert({
    client_name: String(invite.client_name),
    rating,
    text,
    service: invite.service ?? null,
    date: new Date().toISOString().slice(0, 10),
    project_link: projectLink,
    active: false,
  })

  if (reviewError) throw new Error(reviewError.message)

  // Mark invite as used
  await supabase
    .from('review_invites')
    .update({ used_at: new Date().toISOString() })
    .eq('id', String(invite.id))

  revalidatePath('/admin/reviews')
  redirect(`/review/${token}?success=1`)
}
