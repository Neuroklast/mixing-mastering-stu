import { createClient } from '@/lib/supabaseServer'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'
import { legalPageSchema, type LegalPage } from '@/lib/schemas/legal'
import { MOCK_LEGAL_PAGES } from '@/lib/mockData'
import { isDev } from '@/lib/devMode'

export async function getLegalPageBySlug(
  slug: string,
): Promise<ServiceResult<LegalPage>> {
  if (isDev) {
    const page = MOCK_LEGAL_PAGES.find((p) => p.slug === slug)
    if (!page) return err(`Legal page not found: ${slug}`)
    return ok(page)
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('legal')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !data) return err(`Legal page not found: ${slug}`)

    const parsed = legalPageSchema.safeParse({
      id: String(data.id),
      title: data.title,
      slug: data.slug,
      content: data.content,
      lastUpdated: data.last_updated ? String(data.last_updated).slice(0, 10) : undefined,
    })

    if (!parsed.success) return err(`Failed to parse legal page: ${slug}`)
    return ok(parsed.data)
  } catch (e) {
    return err(e instanceof Error ? e.message : `Failed to load legal page: ${slug}`)
  }
}
