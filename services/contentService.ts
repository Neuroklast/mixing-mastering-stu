import { createClient } from '@/lib/supabaseServer'
import { siteContentSchema, SITE_CONTENT_DEFAULTS, type SiteContent } from '@/lib/schemas/siteContent'
import { isDev } from '@/lib/devMode'

export async function getSiteContent(): Promise<SiteContent> {
  if (isDev) return SITE_CONTENT_DEFAULTS

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('site_content')
      .select('key, value')

    if (error || !data) return SITE_CONTENT_DEFAULTS

    const record: Record<string, string> = {}
    for (const row of data) {
      record[String(row.key ?? '')] = String(row.value ?? '')
    }

    const parsed = siteContentSchema.safeParse(record)
    if (!parsed.success) return SITE_CONTENT_DEFAULTS

    // Merge with defaults so missing keys always have a value
    return { ...SITE_CONTENT_DEFAULTS, ...parsed.data }
  } catch (e) {
    console.error('[contentService] getSiteContent failed:', e)
    return SITE_CONTENT_DEFAULTS
  }
}
