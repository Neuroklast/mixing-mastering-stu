import { createClient } from '@/lib/supabaseServer'
import type { Product } from '@/types'
import { MOCK_PRODUCTS } from '@/lib/mockData'

const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export const getActiveProducts = async (): Promise<ServiceResult<Product[]>> => {
  if (isDev) {
    await new Promise((res) => setTimeout(res, 400))
    return { success: true, data: MOCK_PRODUCTS }
  }

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

  if (isDev) {
    await new Promise((res) => setTimeout(res, 300))
    const product = MOCK_PRODUCTS.find((p) => p.id === productId)
    return product
      ? { success: true, data: product }
      : { success: false, error: 'Product not found' }
  }

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
