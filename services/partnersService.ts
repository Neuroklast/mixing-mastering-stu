import { createClient } from '@/lib/supabaseServer'
import { getStorageProvider } from '@/lib/storage'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'
import { partnerSchema, type Partner } from '@/lib/schemas/partner'
import { DEMO_PARTNERS } from '@/lib/mockData'
import { isDev, hideDemoFallback } from '@/lib/devMode'

const MEDIA_BUCKET = process.env.R2_BUCKET_MEDIA ?? 'sonorativa-media'

export async function getAllPartners(): Promise<ServiceResult<Partner[]>> {
  if (isDev) return ok(DEMO_PARTNERS)

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })

    if (error) return err(error.message)

    const storage = getStorageProvider()
    const partners: Partner[] = []

    for (const row of data ?? []) {
      let logoUrl: string | null = null

      if (row.logo_storage_path) {
        try {
          logoUrl = storage.getPublicUrl(MEDIA_BUCKET, String(row.logo_storage_path))
        } catch {
          logoUrl = row.logo_url ? String(row.logo_url) : null
        }
      } else if (row.logo_url) {
        logoUrl = String(row.logo_url)
      }

      const categoryRaw = String(row.category ?? 'partner')
      const category =
        categoryRaw === 'credit' ||
        categoryRaw === 'endorsement' ||
        categoryRaw === 'partner' ||
        categoryRaw === 'label' ||
        categoryRaw === 'sponsor'
          ? categoryRaw
          : 'partner'

      const parsed = partnerSchema.safeParse({
        id: String(row.id),
        name: String(row.name ?? ''),
        url: row.url ? String(row.url) : null,
        logoUrl,
        logoStoragePath: row.logo_storage_path ? String(row.logo_storage_path) : null,
        category,
        displayOrder:
          typeof row.display_order === 'number' ? row.display_order : Number(row.display_order ?? 0),
        logoWhite: row.logo_white !== false && row.logo_white !== 'false',
        active: row.active !== false && row.active !== 'false',
      })
      if (parsed.success) partners.push(parsed.data)
    }

    if (partners.length === 0 && !hideDemoFallback) return ok(DEMO_PARTNERS)
    return ok(partners)
  } catch (e) {
    console.error('[partnersService] getAllPartners failed:', e)
    return err(e instanceof Error ? e.message : 'Failed to load partners')
  }
}
