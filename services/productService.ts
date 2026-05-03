import { createClient } from '@/lib/supabaseServer'
import type { Product } from '@/types'
import { MOCK_PRODUCTS } from '@/lib/mockData'
import { isDev } from '@/lib/devMode'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'

export { type ServiceResult }

export const getActiveProducts = async (): Promise<ServiceResult<Product[]>> => {
  if (isDev) {
    await new Promise((res) => setTimeout(res, 400))
    return ok(MOCK_PRODUCTS)
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('price_cents', { ascending: true })

  if (error) return err(error.message)
  // Cast needed due to @supabase/ssr generic type incompatibility (see lib/supabaseServer.ts)
  return ok(data as Product[])
}

export const getProductById = async (
  productId: string,
): Promise<ServiceResult<Product>> => {
  if (!productId) return err('productId is required')

  if (isDev) {
    await new Promise((res) => setTimeout(res, 300))
    const product = MOCK_PRODUCTS.find((p) => p.id === productId)
    return product
      ? ok(product)
      : err('Product not found')
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('is_active', true)
    .single()

  if (error) return err(error.message)
  // Cast needed due to @supabase/ssr generic type incompatibility (see lib/supabaseServer.ts)
  return ok(data as Product)
}
