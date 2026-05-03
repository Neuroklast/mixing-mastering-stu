'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabaseAdmin'

export async function createLegal(formData: FormData) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('legal').insert({
    title: formData.get('title'),
    slug: formData.get('slug'),
    content: formData.get('content'),
    last_updated: formData.get('last_updated') || null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/legal')
  redirect('/admin/legal')
}

export async function updateLegal(id: string, formData: FormData) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('legal')
    .update({
      title: formData.get('title'),
      slug: formData.get('slug'),
      content: formData.get('content'),
      last_updated: formData.get('last_updated') || null,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/legal')
  redirect('/admin/legal')
}

export async function deleteLegal(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('legal').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/legal')
}
