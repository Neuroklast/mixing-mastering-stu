#!/usr/bin/env node
/**
 * scripts/migrate-supabase-to-r2.mjs — One-shot migration of existing files
 * from Supabase Storage to Cloudflare R2.
 *
 * Usage:
 *   node scripts/migrate-supabase-to-r2.mjs             # dry-run by default
 *   node scripts/migrate-supabase-to-r2.mjs --write     # actually migrate
 *   node scripts/migrate-supabase-to-r2.mjs --dry-run   # explicitly dry-run
 *
 * What it does:
 *   1. Reads all rows from gallery, credits, members, showcase, media tables
 *      that contain Supabase Storage URLs.
 *   2. For each row: downloads from Supabase → uploads to R2 → updates DB URL.
 *   3. Idempotent: skips rows whose URLs already point to R2_PUBLIC_HOST.
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *                    R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *                    R2_PUBLIC_HOST, R2_BUCKET_MEDIA, R2_BUCKET_AUDIO
 */

import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── Load .env.local ───────────────────────────────────────────────────────────
const envPath = join(ROOT, '.env.local')
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

const isDryRun = !process.argv.includes('--write')

// ── Colour helpers ────────────────────────────────────────────────────────────
const c = { green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m', bold: '\x1b[1m', dim: '\x1b[2m', reset: '\x1b[0m' }
const ok   = (msg) => console.log(`${c.green}✔${c.reset}  ${msg}`)
const warn = (msg) => console.log(`${c.yellow}⚠${c.reset}  ${msg}`)
const info = (msg) => console.log(`${c.cyan}ℹ${c.reset}  ${msg}`)
const fail = (msg) => { console.error(`${c.red}✖${c.reset}  ${msg}`); process.exit(1) }

function inferContentType(path, fallback) {
  if (fallback) return fallback
  const ext = path.split('.').pop()?.toLowerCase()
  const types = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', avif: 'image/avif', gif: 'image/gif',
    wav: 'audio/wav', mp3: 'audio/mpeg', flac: 'audio/flac',
  }
  return types[ext ?? ''] ?? 'application/octet-stream'
}

// ── Validate env ──────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_PUBLIC_HOST = process.env.R2_PUBLIC_HOST
const BUCKET_MEDIA = process.env.R2_BUCKET_MEDIA || 'sonorativa-media'

if (!SUPABASE_URL || !SUPABASE_KEY) fail('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_HOST) {
  fail('Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_HOST')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

console.log(`\n${c.bold}${c.cyan}🔄 SONORATIVA — Supabase Storage → R2 Migration${c.reset}`)
if (isDryRun) {
  console.log(`${c.yellow}  DRY RUN — pass --write to actually migrate${c.reset}\n`)
} else {
  console.log(`${c.red}  WRITE MODE — will update the database${c.reset}\n`)
}

// ── Tables and their URL/path fields ─────────────────────────────────────────
const TABLES = [
  { table: 'gallery',  urlField: 'image_url',     pathField: 'storage_path', bucket: 'media' },
  { table: 'credits',  urlField: 'photo_url',     pathField: 'storage_path', bucket: 'media' },
  { table: 'members',  urlField: 'photo_url',     pathField: 'storage_path', bucket: 'media' },
]

const supabaseStorageHost = new URL(SUPABASE_URL).hostname
let migrated = 0
let skipped = 0
let failed = 0

for (const { table, urlField, pathField, bucket } of TABLES) {
  // Dedupe tables (members appears twice in config above by mistake)
  const { data: rows, error } = await supabase.from(table).select('*')
  if (error) {
    warn(`Could not read ${table}: ${error.message}`)
    continue
  }
  if (!rows || rows.length === 0) {
    info(`${table}: no rows`)
    continue
  }

  for (const row of rows) {
    const currentUrl = String(row[urlField] ?? '')
    if (!currentUrl) { skipped++; continue }

    // Skip if already pointing to R2
    if (currentUrl.includes(R2_PUBLIC_HOST)) { skipped++; continue }

    // Skip if not a Supabase Storage URL
    if (!currentUrl.includes(supabaseStorageHost) && !currentUrl.includes('/storage/v1/object/')) {
      skipped++; continue
    }

    // Extract path from Supabase URL
    const pathMatch = currentUrl.match(/\/storage\/v1\/object\/(?:public|authenticated)\/[^/]+\/(.+)/)
    if (!pathMatch) {
      warn(`${table}[${row.id}]: cannot extract path from ${currentUrl}`)
      failed++; continue
    }
    const objectPath = pathMatch[1].split('?')[0]
    const r2Key = objectPath

    if (isDryRun) {
      info(`[DRY] ${table}[${row.id}]: ${currentUrl} → https://${R2_PUBLIC_HOST}/${r2Key}`)
      migrated++; continue
    }

    // Download from Supabase
    let fileBuffer
    try {
      const { data, error: dlErr } = await supabase.storage.from(bucket).download(objectPath)
      if (dlErr || !data) throw new Error(dlErr?.message ?? 'download failed')
      fileBuffer = Buffer.from(await data.arrayBuffer())
    } catch (e) {
      warn(`${table}[${row.id}]: download failed — ${e.message}`)
      failed++; continue
    }

    // Upload to R2
    try {
      const contentType = inferContentType(objectPath, row.content_type)
      await r2.send(new PutObjectCommand({
        Bucket: BUCKET_MEDIA,
        Key: r2Key,
        Body: fileBuffer,
        ContentType: contentType,
      }))
    } catch (e) {
      warn(`${table}[${row.id}]: R2 upload failed — ${e.message}`)
      failed++; continue
    }

    // Update DB
    const newUrl = `https://${R2_PUBLIC_HOST}/${r2Key}`
    const updateFields = { [urlField]: newUrl }
    if (pathField && row[pathField]) updateFields[pathField] = r2Key

    const { error: updateErr } = await supabase.from(table).update(updateFields).eq('id', row.id)
    if (updateErr) {
      warn(`${table}[${row.id}]: DB update failed — ${updateErr.message}`)
      failed++; continue
    }

    ok(`${table}[${row.id}]: migrated → ${newUrl}`)
    migrated++
  }
}

console.log('')
console.log(`${c.bold}Summary:${c.reset}`)
console.log(`  Migrated:  ${migrated}`)
console.log(`  Skipped:   ${skipped}`)
console.log(`  Failed:    ${failed}`)
if (isDryRun) {
  console.log(`\n${c.yellow}This was a dry run. Re-run with --write to apply changes.${c.reset}`)
}
console.log('')
