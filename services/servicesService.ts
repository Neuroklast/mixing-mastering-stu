import { createClient } from '@/lib/supabaseServer'
import { serviceSchema, type Service } from '@/lib/schemas/service'
import { SERVICES_CONFIG } from '@/lib/services-config'
import { isDev } from '@/lib/devMode'

/** Convert legacy SERVICES_CONFIG entries to Service schema shape */
function legacyToService(): Service[] {
  return SERVICES_CONFIG.map((pkg, i) => ({
    id: pkg.id,
    slug: pkg.id,
    title: pkg.name,
    description: pkg.tagline,
    price_cents: Math.round(pkg.priceUsd * 100),
    currency: 'usd',
    duration: pkg.turnaround,
    features: pkg.features.filter((f) => f.included).map((f) => f.name),
    display_order: i,
    active: true,
  }))
}

export async function getActiveServices(): Promise<Service[]> {
  if (isDev) return legacyToService()

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })

    if (error || !data) return legacyToService()

    const services: Service[] = []
    for (const row of data) {
      const parsed = serviceSchema.safeParse({
        id: String(row.id ?? ''),
        created_at: String(row.created_at ?? ''),
        slug: String(row.slug ?? ''),
        title: String(row.title ?? ''),
        description: row.description != null ? String(row.description) : null,
        price_cents: typeof row.price_cents === 'number' ? row.price_cents : 0,
        currency: String(row.currency ?? 'eur'),
        duration: row.duration != null ? String(row.duration) : null,
        features: Array.isArray(row.features) ? (row.features as unknown[]).map(String) : [],
        display_order: typeof row.display_order === 'number' ? row.display_order : 0,
        active: Boolean(row.active),
      })
      if (parsed.success) services.push(parsed.data)
    }
    return services.length > 0 ? services : legacyToService()
  } catch (e) {
    console.error('[servicesService] getActiveServices failed:', e)
    return legacyToService()
  }
}
