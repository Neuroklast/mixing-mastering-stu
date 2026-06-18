'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/app/admin/_actions/auth'

const PLATFORMS = ['instagram', 'youtube', 'spotify', 'bandcamp', 'facebook', 'twitter', 'tiktok', 'soundcloud', 'other'] as const

const socialLinkInputSchema = z.object({
  platform: z.enum(PLATFORMS, { errorMap: () => ({ message: 'Invalid platform' }) }),
  url: z.string().url('Invalid URL').max(500),
  label: z.string().max(200).optional(),
  display_order: z.coerce.number().int().default(0),
  active: z.string().optional(),
})

export async function createSocialLink(formData: FormData) {
  await requireAdmin()

  const input = socialLinkInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('social_links').insert({
    platform: input.data.platform,
    url: input.data.url,
    label: input.data.label || null,
    display_order: input.data.display_order,
    active: input.data.active === 'true',
  })
  if (error) {
    console.error('[social_links] createSocialLink DB error:', error.message)
    throw new Error('Failed to save social link. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/social-links')
  redirect('/admin/social-links')
}

export async function updateSocialLink(id: string, formData: FormData) {
  await requireAdmin()

  const input = socialLinkInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('social_links')
    .update({
      platform: input.data.platform,
      url: input.data.url,
      label: input.data.label || null,
      display_order: input.data.display_order,
      active: input.data.active === 'true',
    })
    .eq('id', id)
  if (error) {
    console.error('[social_links] updateSocialLink DB error:', error.message)
    throw new Error('Failed to update social link. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/social-links')
  redirect('/admin/social-links')
}

export async function deleteSocialLink(id: string) {
  await requireAdmin()

  const supabase = createAdminClient()
  const { error } = await supabase.from('social_links').delete().eq('id', id)
  if (error) {
    console.error('[social_links] deleteSocialLink DB error:', error.message)
    throw new Error('Failed to delete social link. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/social-links')
}
