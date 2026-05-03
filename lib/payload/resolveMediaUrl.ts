/**
 * Resolves a Payload CMS media relation or upload object to a public URL.
 * Handles both populated relations (with `.url`) and local-disk uploads
 * (with `.filename` only) by prefixing NEXT_PUBLIC_SERVER_URL.
 */
export function resolveMediaUrl(file: unknown): string | null {
  if (!file || typeof file !== 'object') return null
  const f = file as Record<string, unknown>
  if (typeof f.url === 'string' && f.url) return f.url
  if (typeof f.filename === 'string' && f.filename) {
    const base = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
    return `${base}/media/${f.filename}`
  }
  return null
}
