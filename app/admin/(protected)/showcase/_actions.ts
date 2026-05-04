'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabaseAdmin'

export async function createShowcase(formData: FormData) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('showcase').insert({
    title: formData.get('title'),
    artist: formData.get('artist') || null,
    genre: formData.get('genre') || null,
    equipment: formData.get('equipment') || null,
    label_before: formData.get('label_before') || 'Demo',
    label_after: formData.get('label_after') || 'Final',
    start_marker: Number(formData.get('start_marker') ?? 0),
    lufs_target: Number(formData.get('lufs_target') ?? -14),
    before_storage_path: formData.get('before_storage_path') || null,
    after_storage_path: formData.get('after_storage_path') || null,
    active: formData.get('active') === 'true',
    display_order: Number(formData.get('display_order') ?? 0),
  })
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin/showcase')
  redirect('/admin/showcase')
}

export async function updateShowcase(id: string, formData: FormData) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('showcase')
    .update({
      title: formData.get('title'),
      artist: formData.get('artist') || null,
      genre: formData.get('genre') || null,
      equipment: formData.get('equipment') || null,
      label_before: formData.get('label_before') || 'Demo',
      label_after: formData.get('label_after') || 'Final',
      start_marker: Number(formData.get('start_marker') ?? 0),
      lufs_target: Number(formData.get('lufs_target') ?? -14),
      before_storage_path: formData.get('before_storage_path') || null,
      after_storage_path: formData.get('after_storage_path') || null,
      active: formData.get('active') === 'true',
      display_order: Number(formData.get('display_order') ?? 0),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin/showcase')
  redirect('/admin/showcase')
}

export async function deleteShowcase(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('showcase').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin/showcase')
}
