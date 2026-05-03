'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabaseAdmin'

export async function createReview(formData: FormData) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('reviews').insert({
    client_name: formData.get('client_name'),
    rating: Number(formData.get('rating')),
    text: formData.get('text'),
    service: formData.get('service') || null,
    date: formData.get('date') || null,
    project_link: formData.get('project_link') || null,
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
