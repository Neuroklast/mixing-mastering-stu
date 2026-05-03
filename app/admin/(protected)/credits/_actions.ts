'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabaseAdmin'

export async function createCredit(formData: FormData) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('credits').insert({
    name: formData.get('name'),
    role: formData.get('role'),
    year: formData.get('year') ? Number(formData.get('year')) : null,
    spotify_url: formData.get('spotify_url') || null,
    cover_image_url: formData.get('cover_image_url') || null,
    cover_storage_path: formData.get('cover_storage_path') || null,
    featured: formData.get('featured') === 'true',
  })
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin/credits')
  redirect('/admin/credits')
}

export async function updateCredit(id: string, formData: FormData) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('credits')
    .update({
      name: formData.get('name'),
      role: formData.get('role'),
      year: formData.get('year') ? Number(formData.get('year')) : null,
      spotify_url: formData.get('spotify_url') || null,
      cover_image_url: formData.get('cover_image_url') || null,
      cover_storage_path: formData.get('cover_storage_path') || null,
      featured: formData.get('featured') === 'true',
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin/credits')
  redirect('/admin/credits')
}

export async function deleteCredit(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('credits').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin/credits')
}
