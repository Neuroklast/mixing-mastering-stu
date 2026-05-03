import { getPayload } from 'payload'
import config from '@payload-config'
import { isDev } from '@/lib/devMode'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'
import { reviewSchema, type Review } from '@/lib/schemas/review'
import { DEMO_REVIEWS } from '@/lib/mockData'

function docToReview(doc: Record<string, unknown>): Review | null {
  const parsed = reviewSchema.safeParse({
    id: String(doc.id),
    clientName: doc.clientName,
    rating: doc.rating,
    text: doc.text,
    service: typeof doc.service === 'string' ? doc.service : undefined,
    date: typeof doc.date === 'string' ? doc.date.slice(0, 10) : undefined,
    projectLink: typeof doc.projectLink === 'string' ? doc.projectLink : undefined,
  })
  return parsed.success ? parsed.data : null
}

export async function getAllReviews(): Promise<ServiceResult<Review[]>> {
  if (isDev) return ok(DEMO_REVIEWS)

  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'reviews',
      sort: '-date',
      limit: 50,
      depth: 0,
    })

    const reviews: Review[] = []
    for (const doc of result.docs) {
      const review = docToReview(doc as Record<string, unknown>)
      if (review) reviews.push(review)
    }
    return ok(reviews)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to load reviews')
  }
}
