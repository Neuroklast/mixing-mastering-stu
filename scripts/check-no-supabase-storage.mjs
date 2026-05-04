#!/usr/bin/env node
/**
 * CI guard: fail if any application source file calls Supabase Storage directly.
 *
 * All storage operations must go through getStorageProvider() from @/lib/storage.
 * The only allowed exception is lib/storage/supabase.ts (the deprecated migration shim).
 *
 * Usage:
 *   node scripts/check-no-supabase-storage.mjs
 *
 * Exit codes:
 *   0 — no violations found
 *   1 — one or more violations found
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

const ROOT = new URL('..', import.meta.url).pathname

const SCAN_DIRS = ['app', 'components', 'services', 'hooks', 'lib']

/** Files that are explicitly allowed to contain Supabase Storage calls. */
const ALLOWLIST = new Set(['lib/storage/supabase.ts'])

/** Patterns that indicate a direct Supabase Storage call. */
const FORBIDDEN_PATTERNS = [
  /supabase\.storage\.from\(/,
  /\.from\(['"]audio-files['"]\)/,
  /\.from\(['"]media['"]\)/,
]

function* walkDir(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      // Skip node_modules and .next
      if (entry.name === 'node_modules' || entry.name === '.next') continue
      yield* walkDir(fullPath)
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
      yield fullPath
    }
  }
}

let violations = 0

for (const dir of SCAN_DIRS) {
  const absDir = join(ROOT, dir)
  try {
    statSync(absDir)
  } catch {
    // Directory doesn't exist — skip
    continue
  }

  for (const filePath of walkDir(absDir)) {
    const relPath = relative(ROOT, filePath).replace(/\\/g, '/')

    if (ALLOWLIST.has(relPath)) continue

    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(lines[i])) {
          console.error(
            `\x1b[31m[storage-guard] FORBIDDEN direct Supabase Storage call:\x1b[0m`,
          )
          console.error(`  File:    ${relPath}`)
          console.error(`  Line ${i + 1}: ${lines[i].trim()}`)
          console.error(`  Fix:     Use getStorageProvider() from @/lib/storage instead.\n`)
          violations++
        }
      }
    }
  }
}

if (violations > 0) {
  console.error(
    `\x1b[31m[storage-guard] ${violations} violation(s) found. Supabase Storage is deprecated — use getStorageProvider() from @/lib/storage.\x1b[0m`,
  )
  process.exit(1)
} else {
  console.log('\x1b[32m[storage-guard] ✓ No direct Supabase Storage calls found.\x1b[0m')
}
