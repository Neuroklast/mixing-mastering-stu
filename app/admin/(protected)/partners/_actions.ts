'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/app/admin/_actions/auth'

const partnerInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(300),
  url: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
  logo_url: z.string().url('Invalid logo URL').max(2000).optional().or(z.literal('')),
  logo_storage_path: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  display_order: z.coerce.number().int().default(0),
  active: z.string().optional(),
})

export async function createPartner(formData: FormData) {
  await requireAdmin()

  const input = partnerInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('partners').insert({
    name: input.data.name,
    url: input.data.url || null,
    logo_url: input.data.logo_url || null,
    logo_storage_path: input.data.logo_storage_path || null,
    description: input.data.description || null,
    display_order: input.data.display_order,
    active: input.data.active === 'true',
  })
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
  const { error } = await supabase
    .from('partners')
    .update({
      name: input.data.name,
      url: input.data.url || null,
      logo_url: input.data.logo_url || null,
      logo_storage_path: input.data.logo_storage_path || null,
      description: input.data.description || null,
      display_order: input.data.display_order,
      active: input.data.active === 'true',
    })
    .eq('id', id)
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
