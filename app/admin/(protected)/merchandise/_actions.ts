'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/app/admin/_actions/auth'

const merchandiseInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(300),
  description: z.string().max(5000).optional(),
  price_cents: z.coerce.number().int().min(0, 'Price must be non-negative'),
  currency: z.string().min(1).max(10).default('eur'),
  category: z.enum(['clothing', 'physical', 'digital', 'accessories', 'other']).optional(),
  image_url: z.string().url('Invalid image URL').max(2000).optional().or(z.literal('')),
  image_storage_path: z.string().max(1000).optional(),
  shop_url: z.string().url('Invalid shop URL').max(500).optional().or(z.literal('')),
  in_stock: z.string().optional(),
  display_order: z.coerce.number().int().default(0),
  active: z.string().optional(),
})

export async function createMerchandise(formData: FormData) {
  await requireAdmin()

  const input = merchandiseInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('merchandise').insert({
    name: input.data.name,
    description: input.data.description || null,
    price_cents: input.data.price_cents,
    currency: input.data.currency,
    category: input.data.category ?? null,
    image_url: input.data.image_url || null,
    image_storage_path: input.data.image_storage_path || null,
    shop_url: input.data.shop_url || null,
    in_stock: input.data.in_stock === 'true',
    display_order: input.data.display_order,
    active: input.data.active === 'true',
  })
  if (error) {
    console.error('[merchandise] createMerchandise DB error:', error.message)
    throw new Error('Failed to save merchandise item. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/merchandise')
  redirect('/admin/merchandise')
}

export async function updateMerchandise(id: string, formData: FormData) {
  await requireAdmin()

  const input = merchandiseInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('merchandise')
    .update({
      name: input.data.name,
      description: input.data.description || null,
      price_cents: input.data.price_cents,
      currency: input.data.currency,
      category: input.data.category ?? null,
      image_url: input.data.image_url || null,
      image_storage_path: input.data.image_storage_path || null,
      shop_url: input.data.shop_url || null,
      in_stock: input.data.in_stock === 'true',
      display_order: input.data.display_order,
      active: input.data.active === 'true',
    })
    .eq('id', id)
  if (error) {
    console.error('[merchandise] updateMerchandise DB error:', error.message)
    throw new Error('Failed to update merchandise item. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/merchandise')
  redirect('/admin/merchandise')
}

export async function deleteMerchandise(id: string) {
  await requireAdmin()

  const supabase = createAdminClient()
  const { error } = await supabase.from('merchandise').delete().eq('id', id)
  if (error) {
    console.error('[merchandise] deleteMerchandise DB error:', error.message)
    throw new Error('Failed to delete merchandise item. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/merchandise')
}
