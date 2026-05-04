#!/usr/bin/env node
/**
 * scripts/r2-setup.mjs — Cloudflare R2 bucket provisioning script
 *
 * Usage:
 *   node scripts/r2-setup.mjs
 *   node scripts/r2-setup.mjs --non-interactive   (for CI / install wizard)
 *
 * Requires env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 * Optional:          R2_BUCKET_MEDIA, R2_BUCKET_AUDIO, R2_PUBLIC_HOST
 *
 * What it does:
 *   1. Creates sonorativa-media (public images bucket)
 *   2. Creates sonorativa-audio (private audio bucket)
 *   3. Applies CORS policy to sonorativa-media
 *   4. Prints next steps for custom domain and lifecycle rules
 */

import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  S3Client,
  CreateBucketCommand,
  PutBucketCorsCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── Load .env.local if present ────────────────────────────────────────────────
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

// ── Colour helpers ────────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}
const ok   = (msg) => console.log(`${c.green}✔${c.reset}  ${msg}`)
const warn = (msg) => console.log(`${c.yellow}⚠${c.reset}  ${msg}`)
const info = (msg) => console.log(`${c.cyan}ℹ${c.reset}  ${msg}`)
const fail = (msg) => { console.error(`${c.red}✖${c.reset}  ${msg}`); process.exit(1) }

const nonInteractive = process.argv.includes('--non-interactive')

// ── Validate credentials ──────────────────────────────────────────────────────
const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

if (!accountId || !accessKeyId || !secretAccessKey) {
  fail('Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env.local')
}

const BUCKET_MEDIA = process.env.R2_BUCKET_MEDIA || 'sonorativa-media'
const BUCKET_AUDIO = process.env.R2_BUCKET_AUDIO || 'sonorativa-audio'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
})

console.log(`\n${c.bold}${c.cyan}☁  SONORATIVA — R2 Bucket Setup${c.reset}\n`)
info(`Account:  ${accountId}`)
info(`Buckets:  ${BUCKET_MEDIA} (media/public)  +  ${BUCKET_AUDIO} (audio/private)`)
console.log('')

// ── Helper: create bucket (idempotent) ────────────────────────────────────────
async function ensureBucket(name) {
  // Check if already exists
  try {
    await client.send(new HeadBucketCommand({ Bucket: name }))
    ok(`Bucket "${name}" already exists — skipping creation`)
    return
  } catch (e) {
    if (e.name !== 'NoSuchBucket' && e.$metadata?.httpStatusCode !== 404) {
      // Bucket exists but access denied, or other error
      if (e.$metadata?.httpStatusCode === 403) {
        ok(`Bucket "${name}" exists (access confirmed)`)
        return
      }
    }
  }

  try {
    await client.send(new CreateBucketCommand({ Bucket: name }))
    ok(`Bucket "${name}" created`)
  } catch (e) {
    if (e.Code === 'BucketAlreadyOwnedByYou' || e.name === 'BucketAlreadyOwnedByYou') {
      ok(`Bucket "${name}" already owned by you — skipping`)
    } else {
      warn(`Failed to create bucket "${name}": ${e.message ?? e.Code}`)
    }
  }
}

// ── Helper: apply CORS to media bucket ───────────────────────────────────────
async function applyCors(bucket) {
  const corsRule = {
    AllowedOrigins: [SITE_URL, 'http://localhost:3000'],
    AllowedMethods: ['GET', 'PUT', 'POST', 'HEAD', 'DELETE'],
    AllowedHeaders: ['*'],
    MaxAgeSeconds: 3600,
  }

  try {
    await client.send(new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: { CORSRules: [corsRule] },
    }))
    ok(`CORS applied to "${bucket}"`)
  } catch (e) {
    warn(`Failed to apply CORS to "${bucket}": ${e.message ?? e.Code}`)
    info('Apply manually in Cloudflare Dashboard → R2 → ' + bucket + ' → Settings → CORS:')
    console.log(JSON.stringify([corsRule], null, 2))
  }
}

// ── Run ───────────────────────────────────────────────────────────────────────
await ensureBucket(BUCKET_MEDIA)
await ensureBucket(BUCKET_AUDIO)
await applyCors(BUCKET_MEDIA)

console.log('')
console.log(`${c.bold}Next steps:${c.reset}`)
console.log(`  1. ${c.cyan}Custom domain${c.reset} for ${BUCKET_MEDIA}:`)
console.log(`     Cloudflare Dashboard → R2 → ${BUCKET_MEDIA} → Settings → Public Access → Add custom domain`)
console.log(`     Then set R2_PUBLIC_HOST=media.your-domain.com in .env.local / Vercel`)
console.log(`  2. ${c.cyan}Lifecycle rule${c.reset} to abort incomplete multipart uploads (saves cost):`)
console.log(`     Cloudflare Dashboard → R2 → ${BUCKET_AUDIO} → Settings → Lifecycle → Add rule`)
console.log(`     Rule: AbortIncompleteMultipartUpload after 1 day`)
console.log('')
console.log(`See ${c.cyan}docs/cloudflare-r2.md${c.reset} for full documentation.`)
console.log('')
