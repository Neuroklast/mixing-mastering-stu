import { getPayload } from 'payload'
import config from '@payload-config'
import { isDev } from '@/lib/devMode'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'
import { legalPageSchema, type LegalPage } from '@/lib/schemas/legal'
import { MOCK_LEGAL_PAGES } from '@/lib/mockData'

/**
 * Converts a Payload Lexical rich-text node tree to a plain HTML string.
 * Only handles the node types produced by the Lexical editor for legal content:
 * paragraphs, headings, links, and inline text with bold/italic formatting.
 */
function lexicalToHtml(root: unknown): string {
  if (!root || typeof root !== 'object') return ''
  const node = root as Record<string, unknown>
  const type = node.type as string | undefined
  const children = Array.isArray(node.children)
    ? (node.children as unknown[]).map(lexicalToHtml).join('')
    : ''

  switch (type) {
    case 'root':
      return children
    case 'paragraph':
      return children ? `<p>${children}</p>` : ''
    case 'heading': {
      const tag = (node.tag as string) ?? 'h2'
      return `<${tag}>${children}</${tag}>`
    }
    case 'list': {
      const listTag = node.listType === 'number' ? 'ol' : 'ul'
      return `<${listTag}>${children}</${listTag}>`
    }
    case 'listitem':
      return `<li>${children}</li>`
    case 'link': {
      const url = typeof node.url === 'string' ? node.url : '#'
      return `<a href="${url}">${children}</a>`
    }
    case 'text': {
      const text = typeof node.text === 'string' ? node.text : ''
      const format = typeof node.format === 'number' ? node.format : 0
      // Payload Lexical format bitmask: 1=bold, 2=italic, 4=strikethrough, 8=underline, 16=code
      let result = text
      if (format & 1) result = `<strong>${result}</strong>`
      if (format & 2) result = `<em>${result}</em>`
      if (format & 8) result = `<u>${result}</u>`
      if (format & 4) result = `<s>${result}</s>`
      return result
    }
    default:
      return children
  }
}

function docToLegalPage(doc: Record<string, unknown>): LegalPage | null {
  // Payload Lexical stores content as a JSON object — serialise to HTML string
  const rawContent = doc.content
  let content = ''
  if (rawContent && typeof rawContent === 'object') {
    content = lexicalToHtml(rawContent)
  } else if (typeof rawContent === 'string') {
    content = rawContent
  }

  const lastUpdated =
    typeof doc.lastUpdated === 'string'
      ? doc.lastUpdated.slice(0, 10) // ISO date → YYYY-MM-DD
      : undefined

  const parsed = legalPageSchema.safeParse({
    id: String(doc.id),
    title: doc.title,
    slug: doc.slug,
    content,
    lastUpdated,
  })

  return parsed.success ? parsed.data : null
}

export async function getLegalPageBySlug(
  slug: string,
): Promise<ServiceResult<LegalPage>> {
  if (isDev) {
    const page = MOCK_LEGAL_PAGES.find((p) => p.slug === slug)
    if (!page) return err(`Legal page not found: ${slug}`)
    return ok(page)
  }

  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'legal',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })

    const doc = result.docs[0]
    if (!doc) return err(`Legal page not found: ${slug}`)

    const page = docToLegalPage(doc as Record<string, unknown>)
    if (!page) return err(`Failed to parse legal page: ${slug}`)
    return ok(page)
  } catch (e) {
    return err(e instanceof Error ? e.message : `Failed to load legal page: ${slug}`)
  }
}
