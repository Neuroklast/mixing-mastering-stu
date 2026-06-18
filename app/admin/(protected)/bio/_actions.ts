'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/app/admin/_actions/auth'

// Single fixed ID for the bio record — the table holds exactly one row.
const BIO_ID = '00000000-0000-0000-0000-000000000001'

const bioInputSchema = z.object({
  text: z.string().max(10000).optional(),
  extended_text: z.string().max(50000).optional(),
  photo_url: z.string().url('Invalid photo URL').max(2000).optional().or(z.literal('')),
  photo_storage_path: z.string().max(1000).optional(),
})

export async function updateBio(formData: FormData) {
  await requireAdmin()

  const input = bioInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('bio').upsert({
    id: BIO_ID,
    text: input.data.text ?? '',
    extended_text: input.data.extended_text || null,
    photo_url: input.data.photo_url || null,
    photo_storage_path: input.data.photo_storage_path || null,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error('[bio] updateBio DB error:', error.message)
    throw new Error('Failed to save bio. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/bio')
  redirect('/admin/bio?saved=1')
}
