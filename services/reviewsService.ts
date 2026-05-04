import { createClient } from '@/lib/supabaseServer'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'
import { reviewSchema, type Review } from '@/lib/schemas/review'
import { DEMO_REVIEWS } from '@/lib/mockData'
import { isDev, hideDemoFallback } from '@/lib/devMode'

export async function getAllReviews(): Promise<ServiceResult<Review[]>> {
  if (isDev) return ok(DEMO_REVIEWS)

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('active', true)
      .order('date', { ascending: false, nullsFirst: false })
      .limit(50)

    if (error) return err(error.message)

    const reviews: Review[] = []
    for (const row of data ?? []) {
      const parsed = reviewSchema.safeParse({
        id: String(row.id),
        clientName: row.client_name,
        rating: row.rating,
        text: row.text,
        service: row.service ?? undefined,
        date: row.date ? String(row.date).slice(0, 10) : undefined,
        projectLink: row.project_link ?? undefined,
      })
      if (parsed.success) reviews.push(parsed.data)
    }
    // Fall back to demo data when the DB table is empty (unless explicitly disabled)
    if (reviews.length === 0 && !hideDemoFallback) return ok(DEMO_REVIEWS)
    return ok(reviews)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to load reviews')
  }
}
