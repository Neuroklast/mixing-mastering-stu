'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/app/admin/_actions/auth'

const partnerCategorySchema = z.enum(['credit', 'endorsement', 'partner', 'label', 'sponsor'])

const partnerInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(300),
  url: z.string().max(2000).optional().or(z.literal('')),
  logo_storage_path: z.string().max(1000).optional().or(z.literal('')),
  logo_url: z.string().max(2000).optional().or(z.literal('')),
  category: partnerCategorySchema.default('partner'),
  display_order: z.coerce.number().int().default(0),
  active: z.string().optional(),
  logo_white: z.string().optional(),
})

function emptyToNull(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s === '' ? null : s
}

function toRow(data: z.infer<typeof partnerInputSchema>) {
  const url = emptyToNull(data.url)
  if (url && !/^https?:\/\//i.test(url)) {
    throw new Error('Website URL must start with http:// or https://')
  }

  const logo_storage_path = emptyToNull(data.logo_storage_path)
  let logo_url = emptyToNull(data.logo_url)
  if (logo_url && !/^https?:\/\//i.test(logo_url) && !logo_url.startsWith('/')) {
    throw new Error('Invalid logo URL')
  }
  // Prefer R2 path over full URL
  if (logo_storage_path) logo_url = null

  return {
    name: data.name,
    url,
    logo_storage_path,
    logo_url,
    category: data.category,
    display_order: data.display_order,
    active: data.active !== 'false',
    logo_white: data.logo_white !== 'false',
  }
}

export async function createPartner(formData: FormData) {
  await requireAdmin()

  const input = partnerInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('partners').insert(toRow(input.data))
  if (error) {
    console.error('[partners] createPartner DB error:', error.message)
    throw new Error('Failed to save partner. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/partners')
  redirect('/admin/partners')
}

export async function updatePartner(id: string, formData: FormData) {
  await requireAdmin()

  const input = partnerInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('partners').update(toRow(input.data)).eq('id', id)
  if (error) {
    console.error('[partners] updatePartner DB error:', error.message)
    throw new Error('Failed to update partner. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/partners')
  redirect('/admin/partners')
}

export async function deletePartner(id: string) {
  await requireAdmin()

  const supabase = createAdminClient()
  const { error } = await supabase.from('partners').delete().eq('id', id)
  if (error) {
    console.error('[partners] deletePartner DB error:', error.message)
    throw new Error('Failed to delete partner. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/partners')
}
