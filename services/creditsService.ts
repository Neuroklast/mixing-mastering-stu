import { getPayload } from 'payload'
import config from '@payload-config'
import { isDev } from '@/lib/devMode'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'
import { creditSchema, type Credit } from '@/lib/schemas/credits'
import { MOCK_CREDITS } from '@/lib/mockData'

function docToCredit(doc: Record<string, unknown>): Credit | null {
  const parsed = creditSchema.safeParse({
    id: String(doc.id),
    name: doc.name,
    role: doc.role,
    year: typeof doc.year === 'number' ? doc.year : undefined,
    spotifyUrl: typeof doc.spotifyUrl === 'string' ? doc.spotifyUrl : undefined,
    coverImage:
      doc.coverImage && typeof doc.coverImage === 'object'
        ? { url: (doc.coverImage as Record<string, unknown>).url as string }
        : undefined,
    featured: typeof doc.featured === 'boolean' ? doc.featured : false,
  })
  return parsed.success ? parsed.data : null
}

export async function getAllCredits(): Promise<ServiceResult<Credit[]>> {
  if (isDev) return ok(MOCK_CREDITS)

  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'credits',
      sort: '-featured',
      limit: 200,
      depth: 1,
    })

    const credits: Credit[] = []
    for (const doc of result.docs) {
      const credit = docToCredit(doc as Record<string, unknown>)
      if (credit) credits.push(credit)
    }
    return ok(credits)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to load credits')
  }
}
