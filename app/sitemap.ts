import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabaseAdmin'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sonorativa.com'

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]

  // Dynamic legal pages from DB (includes impressum, privacy, terms seeded in init_all.sql)
  try {
    const supabase = createAdminClient()
    const { data: legalPages } = await supabase
      .from('legal')
      .select('slug, last_updated')

    if (legalPages && legalPages.length > 0) {
      const dynamicLegal: MetadataRoute.Sitemap = legalPages.map((p) => ({
        url: `${siteUrl}/legal/${p.slug}`,
        lastModified: p.last_updated ? new Date(p.last_updated) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.3,
      }))
      return [...staticRoutes, ...dynamicLegal]
    }
  } catch {
    // DB unavailable — fall back to static legal routes
  }

  // Fallback static legal routes when DB is not available
  return [
    ...staticRoutes,
    { url: `${siteUrl}/legal/impressum`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${siteUrl}/legal/privacy`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${siteUrl}/legal/terms`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]
}
