'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabaseAdmin'

export async function createGallery(formData: FormData) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('gallery').insert({
    image_url: formData.get('image_url') || null,
    storage_path: formData.get('storage_path') || null,
    alt: formData.get('alt') || null,
    caption: formData.get('caption') || null,
    display_order: Number(formData.get('display_order') ?? 0),
    active: formData.get('active') === 'true',
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/gallery')
  redirect('/admin/gallery')
}

export async function updateGallery(id: string, formData: FormData) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('gallery')
    .update({
      image_url: formData.get('image_url') || null,
      storage_path: formData.get('storage_path') || null,
      alt: formData.get('alt') || null,
      caption: formData.get('caption') || null,
      display_order: Number(formData.get('display_order') ?? 0),
      active: formData.get('active') === 'true',
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/gallery')
  redirect('/admin/gallery')
}

export async function deleteGallery(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('gallery').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/gallery')
}
