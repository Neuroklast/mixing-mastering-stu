/**
 * migrate-gallery-urls.ts
 *
 * Report-only helper that lists gallery rows whose `image_url` still points to
 * the legacy Supabase Storage host and whose `storage_path` is NULL. These
 * rows will be skipped by `getAllGalleryImages()` until the image is
 * re-uploaded via the admin UI to Cloudflare R2.
 *
 * Usage (run once, no writes):
 *   node --import tsx/esm scripts/migrate-gallery-urls.ts
 *
 * Required env vars (same as production):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const LEGACY_HOST = 'supabase.co'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.',
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

interface GalleryRow {
  id: string | number
  image_url: string | null
  storage_path: string | null
  alt: string | null
}

async function main(): Promise<void> {
  const { data, error } = await supabase
    .from('gallery')
    .select('id, image_url, storage_path, alt')
    .order('id', { ascending: true })

  if (error) {
    console.error('Supabase query failed:', error.message)
    process.exit(1)
  }

  const rows = (data ?? []) as GalleryRow[]
  const affected = rows.filter(
    (r) =>
      r.storage_path == null &&
      r.image_url != null &&
      r.image_url.includes(LEGACY_HOST),
  )

  if (affected.length === 0) {
    console.log('✅ No gallery rows with legacy Supabase image_url found. Nothing to migrate.')
    return
  }

  console.log(
    `⚠️  Found ${affected.length} gallery row(s) with legacy Supabase Storage URLs and no storage_path.\n` +
    `   These will be skipped on the public site until re-uploaded via the admin panel.\n`,
  )

  for (const row of affected) {
    console.log(`  id=${String(row.id)}  alt=${String(row.alt ?? '')}`)
    console.log(`    image_url: ${String(row.image_url)}`)
    console.log()
  }

  console.log('Action required: re-upload the listed images via /admin/gallery.')
}

main().catch((e: unknown) => {
  console.error(e)
  process.exit(1)
})
