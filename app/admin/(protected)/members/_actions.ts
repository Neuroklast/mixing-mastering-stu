'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabaseAdmin'

export async function createMember(formData: FormData) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('members').insert({
    name: formData.get('name'),
    role: formData.get('role'),
    bio: formData.get('bio') || null,
    photo_url: formData.get('photo_url') || null,
    photo_storage_path: formData.get('photo_storage_path') || null,
    social_links: {
      instagram: String(formData.get('social_instagram') ?? ''),
      soundcloud: String(formData.get('social_soundcloud') ?? ''),
      spotify: String(formData.get('social_spotify') ?? ''),
    },
    display_order: Number(formData.get('display_order') ?? 0),
    active: formData.get('active') === 'true',
    featured: formData.get('featured') === 'true',
  })
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin/members')
  redirect('/admin/members')
}

export async function updateMember(id: string, formData: FormData) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('members')
    .update({
      name: formData.get('name'),
      role: formData.get('role'),
      bio: formData.get('bio') || null,
      photo_url: formData.get('photo_url') || null,
      photo_storage_path: formData.get('photo_storage_path') || null,
      social_links: {
        instagram: String(formData.get('social_instagram') ?? ''),
        soundcloud: String(formData.get('social_soundcloud') ?? ''),
        spotify: String(formData.get('social_spotify') ?? ''),
      },
      display_order: Number(formData.get('display_order') ?? 0),
      active: formData.get('active') === 'true',
      featured: formData.get('featured') === 'true',
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin/members')
  redirect('/admin/members')
}

export async function deleteMember(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('members').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin/members')
}
