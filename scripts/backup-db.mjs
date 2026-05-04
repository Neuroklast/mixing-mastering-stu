#!/usr/bin/env node
/**
 * scripts/backup-db.mjs — Supabase PostgreSQL database backup
 *
 * Usage:
 *   node scripts/backup-db.mjs
 *
 * Requires: pg_dump installed (PostgreSQL client tools)
 *           DATABASE_URL env var (Supabase connection string, non-pooling)
 *
 * Writes timestamped .sql.gz files to ./backups/
 * Recommended: run daily via cron (see docs/operations.md).
 *
 * Example cron (daily at 03:00):
 *   0 3 * * * /usr/bin/node /path/to/scripts/backup-db.mjs >> /var/log/sonorativa-backup.log 2>&1
 */

import { execSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const BACKUPS_DIR = join(ROOT, 'backups')

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

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('✖  DATABASE_URL is not set. Add it to .env.local:')
  console.error('   DATABASE_URL=postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres')
  process.exit(1)
}

// ── Check pg_dump ─────────────────────────────────────────────────────────────
const pgDumpCheck = spawnSync('pg_dump', ['--version'], { stdio: 'pipe' })
if (pgDumpCheck.status !== 0) {
  console.error('✖  pg_dump not found. Install PostgreSQL client tools:')
  console.error('   macOS:  brew install postgresql')
  console.error('   Ubuntu: apt-get install -y postgresql-client')
  process.exit(1)
}

// ── Create backups directory ──────────────────────────────────────────────────
mkdirSync(BACKUPS_DIR, { recursive: true })

// ── Generate timestamped filename ─────────────────────────────────────────────
const now = new Date()
const ts = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19)
const filename = `backup_${ts}.sql.gz`
const outputPath = join(BACKUPS_DIR, filename)

console.log(`ℹ  Starting backup → ${filename}`)

try {
  execSync(
    `pg_dump "${DATABASE_URL}" --no-owner --no-acl | gzip > "${outputPath}"`,
    { shell: true, stdio: 'inherit' },
  )
  console.log(`✔  Backup complete: ${outputPath}`)
} catch (e) {
  console.error(`✖  Backup failed: ${e.message}`)
  process.exit(1)
}
