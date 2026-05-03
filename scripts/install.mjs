#!/usr/bin/env node
/**
 * scripts/install.mjs — SONORATIVA interactive setup script
 *
 * Usage:  node scripts/install.mjs
 *         npm run install:all
 *
 * Works on macOS, Linux, and Windows (Node ≥ 20 required).
 * Idempotent — re-running it never breaks an existing installation.
 */

import { createInterface } from 'node:readline'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { execSync, spawnSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── Colour helpers ────────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
}
const ok   = (msg) => console.log(`${c.green}✔${c.reset}  ${msg}`)
const warn = (msg) => console.log(`${c.yellow}⚠${c.reset}  ${msg}`)
const info = (msg) => console.log(`${c.cyan}ℹ${c.reset}  ${msg}`)
const fail = (msg) => { console.error(`${c.red}✖${c.reset}  ${msg}`); process.exit(1) }
const step = (n, msg) => console.log(`\n${c.bold}${c.cyan}[${n}]${c.reset} ${c.bold}${msg}${c.reset}`)
const hr   = () => console.log(`${c.dim}${'─'.repeat(60)}${c.reset}`)

// ── Readline helper ───────────────────────────────────────────────────────────
const rl = createInterface({ input: process.stdin, output: process.stdout })
const ask = (question, defaultValue = '') =>
  new Promise((resolve) => {
    const hint = defaultValue ? ` ${c.dim}[${defaultValue}]${c.reset}` : ''
    rl.question(`  ${question}${hint}: `, (answer) => {
      resolve(answer.trim() || defaultValue)
    })
  })
const confirm = async (question, defaultYes = false) => {
  const suffix = defaultYes ? 'Y/n' : 'y/N'
  const answer = await ask(`${question} (${suffix})`)
  if (!answer) return defaultYes
  return /^y(es)?$/i.test(answer)
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log(`\n${c.bold}${c.cyan}🎛  SONORATIVA — Setup${c.reset}`)
hr()

// ── Step 1: Check Node version ────────────────────────────────────────────────
step(1, 'Checking Node.js version')
const [major] = process.versions.node.split('.').map(Number)
if (major < 20) {
  fail(`Node.js ≥ 20 is required. Found ${process.version}. Install it from https://nodejs.org`)
}
ok(`Node.js ${process.version}`)

// ── Step 2: Check npm ─────────────────────────────────────────────────────────
step(2, 'Checking npm')
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim()
  ok(`npm ${npmVersion}`)
} catch {
  fail('npm is not available. Install Node.js from https://nodejs.org')
}

// ── Step 3: Install dependencies ──────────────────────────────────────────────
step(3, 'Installing npm dependencies')
const nodeModulesExists = existsSync(join(ROOT, 'node_modules'))
if (nodeModulesExists) {
  info('node_modules already exists — running npm ci to sync')
} else {
  info('node_modules not found — installing')
}
const installResult = spawnSync('npm', ['ci'], { cwd: ROOT, stdio: 'inherit' })
if (installResult.status !== 0) {
  fail('npm ci failed. See the output above for details.')
}
ok('Dependencies installed')

// ── Step 4: .env.local setup ──────────────────────────────────────────────────
step(4, 'Environment variables (.env.local)')

const envPath = join(ROOT, '.env.local')
const envExamplePath = join(ROOT, '.env.local.example')

if (!existsSync(envPath)) {
  if (existsSync(envExamplePath)) {
    const example = readFileSync(envExamplePath, 'utf8')
    writeFileSync(envPath, example)
    ok('Created .env.local from .env.local.example')
  } else {
    writeFileSync(envPath, '')
    ok('Created empty .env.local')
  }
} else {
  info('.env.local already exists')
}

// Parse existing values
const parseEnv = (content) => {
  const vars = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    vars[key] = value
  }
  return vars
}

const serializeEnv = (vars) =>
  Object.entries(vars)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n'

const envContent = readFileSync(envPath, 'utf8')
const envVars = parseEnv(envContent)

const REQUIRED_VARS = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    label: 'Supabase Project URL',
    hint: 'Find it at: https://app.supabase.com → Project Settings → API → Project URL',
    example: 'https://xxxx.supabase.co',
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    label: 'Supabase Anon Key',
    hint: 'Find it at: https://app.supabase.com → Project Settings → API → anon public',
    example: 'eyJhbGciOi...',
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    label: 'Supabase Service Role Key',
    hint: 'Find it at: https://app.supabase.com → Project Settings → API → service_role secret',
    example: 'eyJhbGciOi...',
  },
  {
    key: 'NEXT_PUBLIC_SITE_URL',
    label: 'Public site URL',
    hint: 'Your production domain or Vercel URL. Use http://localhost:3000 for local dev.',
    example: 'https://your-domain.com',
  },
  {
    key: 'RESEND_API_KEY',
    label: 'Resend API key',
    hint: 'Find it at: https://resend.com/api-keys (leave blank to skip email sending)',
    example: 're_...',
  },
  {
    key: 'CONTACT_TO_EMAIL',
    label: 'Contact form destination email',
    hint: 'Where contact form submissions are sent (your inbox)',
    example: 'hello@your-domain.com',
  },
  {
    key: 'CONTACT_FROM_EMAIL',
    label: 'Contact form sender email',
    hint: 'Must be a verified sender in your Resend account',
    example: 'noreply@your-domain.com',
  },
]

const shouldPromptForVars = await confirm(
  'Would you like to configure environment variables now?',
  true,
)

if (shouldPromptForVars) {
  for (const { key, label, hint, example } of REQUIRED_VARS) {
    const current = envVars[key] || ''
    const isPlaceholder = current === example || current.startsWith('your-') || current === ''
    if (!isPlaceholder) {
      ok(`${key} is already set`)
      continue
    }
    console.log(`\n  ${c.bold}${label}${c.reset}`)
    console.log(`  ${c.dim}${hint}${c.reset}`)
    const value = await ask(`  ${key}`, current || '')
    if (value) {
      envVars[key] = value
    }
  }
  // Ensure dev mode is set
  if (!envVars['NEXT_PUBLIC_DEV_MODE']) {
    envVars['NEXT_PUBLIC_DEV_MODE'] = 'false'
  }
  writeFileSync(envPath, serializeEnv(envVars))
  ok('.env.local updated')
}

// ── Step 5: Database schema ───────────────────────────────────────────────────
step(5, 'Database schema (supabase/init_all.sql)')

const sqlPath = join(ROOT, 'supabase', 'init_all.sql')
if (existsSync(sqlPath)) {
  const applySchema = await confirm('Would you like to apply the database schema now?', false)
  if (applySchema) {
    const hasSupabaseCLI = spawnSync('supabase', ['--version'], { stdio: 'pipe' }).status === 0
    if (hasSupabaseCLI) {
      info('Supabase CLI detected. Run: supabase db push')
      warn('Automatic push requires an active supabase link. Run it manually if needed.')
    } else {
      console.log(`\n  ${c.bold}Manual steps:${c.reset}`)
      console.log('  1. Open https://app.supabase.com → SQL Editor')
      console.log('  2. Create a new query')
      console.log(`  3. Paste the contents of: ${c.cyan}supabase/init_all.sql${c.reset}`)
      console.log('  4. Click Run')
      console.log('')
      console.log(`  ${c.dim}The script is idempotent — safe to run multiple times.${c.reset}`)
    }
  } else {
    info('Skipping schema. Apply supabase/init_all.sql in the Supabase SQL Editor when ready.')
  }
} else {
  warn('supabase/init_all.sql not found — skipping schema step')
}

// ── Step 6: Create first admin user ──────────────────────────────────────────
step(6, 'Admin user')

const createAdmin = await confirm('Would you like to create the first admin user now?', false)
if (createAdmin) {
  const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL']
  const serviceKey  = envVars['SUPABASE_SERVICE_ROLE_KEY']

  if (!supabaseUrl || !serviceKey || supabaseUrl.includes('your-') || serviceKey.includes('your-')) {
    warn('Supabase credentials are not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.')
  } else {
    const adminEmail    = await ask('Admin email')
    const adminPassword = await ask('Admin password (min 8 chars)')

    if (adminEmail && adminPassword) {
      try {
        // Create user via Supabase Admin API
        const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
          }),
        })
        const createData = await createRes.json()

        if (!createRes.ok) {
          warn(`Failed to create user: ${createData.message ?? JSON.stringify(createData)}`)
        } else {
          const userId = createData.id
          ok(`User created: ${adminEmail} (id: ${userId})`)

          // Set role to admin via REST API
          const updateRes = await fetch(
            `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`,
                'Prefer': 'return=minimal',
              },
              body: JSON.stringify({ role: 'admin' }),
            },
          )
          if (updateRes.ok) {
            ok(`Role set to 'admin' for ${adminEmail}`)
          } else {
            warn('Could not set admin role automatically. Run this SQL manually:')
            console.log(`  UPDATE profiles SET role='admin' WHERE id='${userId}';`)
          }
        }
      } catch (e) {
        warn(`Error creating admin user: ${e instanceof Error ? e.message : String(e)}`)
      }
    } else {
      info('Skipping admin user creation (no email/password provided)')
    }
  }
}

// ── Step 7: Build verification ────────────────────────────────────────────────
step(7, 'Build verification')

const runBuild = await confirm('Run npm run build to verify the setup?', false)
if (runBuild) {
  info('Running next build (this may take 1–2 minutes)…')
  const buildResult = spawnSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'inherit' })
  if (buildResult.status !== 0) {
    warn('Build failed. Check the output above. You may need to configure your environment variables.')
  } else {
    ok('Build succeeded!')
  }
} else {
  info('Skipping build. Run "npm run build" manually when you\'re ready.')
}

info('Running tests…')
const testResult = spawnSync('npm', ['test'], { cwd: ROOT, stdio: 'inherit' })
if (testResult.status !== 0) {
  warn('Some tests failed. This may be expected if Supabase is not yet configured.')
} else {
  ok('All tests passed!')
}

// ── Summary ───────────────────────────────────────────────────────────────────
hr()
console.log(`\n${c.bold}${c.green}🎉  Setup complete!${c.reset}\n`)
console.log('  Next steps:')
console.log(`    ${c.cyan}npm run dev${c.reset}         — start the local dev server`)
console.log(`    ${c.cyan}http://localhost:3000${c.reset} — public site`)
console.log(`    ${c.cyan}http://localhost:3000/admin${c.reset} — admin panel`)
console.log('')
console.log('  Documentation:')
console.log(`    ${c.dim}docs/admin-guide.md${c.reset}   — guide for the site owner`)
console.log(`    ${c.dim}docs/development.md${c.reset}   — guide for developers`)
console.log(`    ${c.dim}docs/architecture.md${c.reset}  — system architecture`)
console.log('')

rl.close()
