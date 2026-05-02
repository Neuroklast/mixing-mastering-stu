import { getPayload } from 'payload'
import config from '@payload-config'
import { showcaseTrackSchema, type ShowcaseTrack } from '@/lib/schemas/showcase'
import { MOCK_SHOWCASE_TRACK, MOCK_SHOWCASE_TRACKS } from '@/lib/mockData'

const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

function resolveMediaUrl(file: unknown): string | null {
  if (!file || typeof file !== 'object') return null
  const f = file as Record<string, unknown>
  if (typeof f.url === 'string' && f.url) return f.url
  // Payload stores uploads without host in local mode; prefix with NEXT_PUBLIC_SERVER_URL
  if (typeof f.filename === 'string' && f.filename) {
    const base = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
    return `${base}/media/${f.filename}`
  }
  return null
}

function docToShowcaseTrack(doc: Record<string, unknown>): ShowcaseTrack | null {
  // Prefer direct text URL fields (populated by the scanner script) over upload relations
  const beforeUrl =
    (typeof doc.beforeUrl === 'string' && doc.beforeUrl) || resolveMediaUrl(doc.beforeFile) || null
  const afterUrl =
    (typeof doc.afterUrl === 'string' && doc.afterUrl) || resolveMediaUrl(doc.afterFile) || null

  if (!beforeUrl || !afterUrl) return null

  // Flatten equipment array to a comma-separated string for backwards compat
  const equipmentItems: string[] = []
  if (Array.isArray(doc.equipment)) {
    for (const e of doc.equipment) {
      if (e && typeof e === 'object' && typeof (e as Record<string, unknown>).item === 'string') {
        equipmentItems.push((e as Record<string, unknown>).item as string)
      }
    }
  } else if (typeof doc.equipment === 'string') {
    equipmentItems.push(doc.equipment)
  }

  const parsed = showcaseTrackSchema.safeParse({
    id: String(doc.id),
    title: doc.title,
    artist: typeof doc.artist === 'string' ? doc.artist : undefined,
    genre: typeof doc.genre === 'string' ? doc.genre : undefined,
    equipment: equipmentItems.join(' · ') || undefined,
    labelBefore: typeof doc.labelBefore === 'string' ? doc.labelBefore : 'Mix',
    labelAfter: typeof doc.labelAfter === 'string' ? doc.labelAfter : 'Master',
    startMarker: typeof doc.startMarker === 'number' ? doc.startMarker : 0,
    lufsTarget: typeof doc.lufsTarget === 'number' ? doc.lufsTarget : -14,
    beforeUrl,
    afterUrl,
  })

  return parsed.success ? parsed.data : null
}

export async function getActiveShowcaseTrack(): Promise<ShowcaseTrack | null> {
  if (isDev) return MOCK_SHOWCASE_TRACK

  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'showcase',
      where: { active: { equals: true } },
      sort: 'order',
      limit: 1,
      depth: 1,
    })

    const doc = result.docs[0]
    if (!doc) return null
    return docToShowcaseTrack(doc as Record<string, unknown>)
  } catch {
    return null
  }
}

export async function getAllShowcaseTracks(): Promise<ShowcaseTrack[]> {
  if (isDev) return MOCK_SHOWCASE_TRACKS

  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'showcase',
      where: { active: { equals: true } },
      sort: 'order',
      limit: 100,
      depth: 1,
    })

    const tracks: ShowcaseTrack[] = []
    for (const doc of result.docs) {
      const track = docToShowcaseTrack(doc as Record<string, unknown>)
      if (track) tracks.push(track)
    }
    return tracks
  } catch {
    return []
  }
}
