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
    {
      url: `${siteUrl}/legal/impressum`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/legal/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/legal/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // Add dynamic legal pages from DB
  try {
    const supabase = createAdminClient()
    const { data: legalPages } = await supabase
      .from('legal')
      .select('slug, last_updated')

    if (legalPages) {
      const dynamicLegal: MetadataRoute.Sitemap = legalPages
        .filter((p) => !['impressum', 'privacy', 'terms'].includes(p.slug))
        .map((p) => ({
          url: `${siteUrl}/legal/${p.slug}`,
          lastModified: p.last_updated ? new Date(p.last_updated) : new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.3,
        }))
      return [...staticRoutes, ...dynamicLegal]
    }
  } catch {
    // DB unavailable — return static routes only
  }

  return staticRoutes
}
