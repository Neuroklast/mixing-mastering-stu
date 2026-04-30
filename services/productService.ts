import { createClient } from '@/lib/supabaseServer'
import type { Product } from '@/types'

export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export const getActiveProducts = async (): Promise<ServiceResult<Product[]>> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('price_cents', { ascending: true })

  if (error) return { success: false, error: error.message }
  return { success: true, data: data as Product[] }
}

export const getProductById = async (
  productId: string,
): Promise<ServiceResult<Product>> => {
  if (!productId) return { success: false, error: 'productId is required' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('is_active', true)
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data: data as Product }
}
