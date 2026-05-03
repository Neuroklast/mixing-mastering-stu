# Development Guide

This guide covers local setup, project conventions, and how to extend the codebase.

---

## Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 20 |
| npm | 9 |
| Git | any |

---

## Local Setup

### Option 1 — Interactive installer (recommended)

```bash
git clone https://github.com/Neuroklast/mixing-mastering-stu
cd mixing-mastering-stu
npm run install:all
```

The script will:
1. Check your Node version
2. Install npm dependencies
3. Copy `.env.local.example` → `.env.local` and prompt for credentials
4. Optionally apply the database schema
5. Optionally create the first admin user
6. Run `npm run build` to verify everything works

### Option 2 — Manual setup

```bash
# 1. Install dependencies
npm ci

# 2. Copy env template
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Apply the database schema
# Option A: Supabase SQL Editor — paste the contents of supabase/init_all.sql
# Option B: psql -h <host> -U postgres -d postgres -f supabase/init_all.sql

# 4. Start the dev server
npm run dev
```

---

## Dev Mode vs Real Supabase

Set `NEXT_PUBLIC_DEV_MODE=true` in `.env.local` to use mock data with no network calls. All service functions return data from `lib/mockData.ts` instead of hitting Supabase.

Set to `false` (or remove the line) to connect to the real database.

---

## Running Tests

```bash
# Unit + integration tests
npm test

# Watch mode
npm run test:watch

# End-to-end (requires a running dev server)
npm run test:e2e
```

Test files live in `tests/unit/` and `tests/integration/`. Follow the existing patterns — every service should have a test that covers the dev-mode path and the production empty-DB fallback.

---

## TypeScript

```bash
npx tsc --noEmit
```

This must pass before every commit. The husky pre-commit hook enforces this automatically.

---

## Adding a New Admin CRUD Page

1. Create the route folder: `app/admin/(protected)/<entity>/`
2. Add `page.tsx` (list view — server component, reads from Supabase via `createAdminClient()`)
3. Add `new/page.tsx` (create form)
4. Add `[id]/page.tsx` (edit form)
5. Add `_actions.ts` (server actions: create, update, delete — all must call `requireAdmin()`)
6. Add the nav link to `app/admin/_components/AdminNav.tsx`
7. Add a Zod schema to `lib/schemas/<entity>.ts`
8. Add a service to `services/<entity>Service.ts`

### Server action pattern

```typescript
'use server'
import { requireAdmin } from '@/app/admin/_actions/auth'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { revalidatePath } from 'next/cache'

export async function createItem(formData: FormData) {
  await requireAdmin()
  const supabase = createAdminClient()
  // ... insert into DB
  revalidatePath('/admin/entity')
}
```

---

## Adding a New Public Section

1. Create the section component in `components/features/<Name>Section.tsx`
2. Create (or extend) the service in `services/<name>Service.ts`
   - Return mock data when `isDev`
   - Fall back to mock data when Supabase returns an empty array
3. Add the schema to `lib/schemas/<name>.ts`
4. Import and render the section in `app/page.tsx`

---

## Adding a New DB Table (migration pattern)

All migrations live in `supabase/init_all.sql` as idempotent SQL (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, etc.).

```sql
-- Example: new table
CREATE TABLE IF NOT EXISTS my_table (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name       TEXT NOT NULL
);

-- RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Public read" ON my_table FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Admin all"   ON my_table USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

Apply by pasting into the Supabase SQL Editor or via `psql`.

---

## Project Structure

```
app/
  admin/(protected)/  # Admin CRUD pages (requires auth)
  _actions/           # Server actions (public, no auth)
  actions/            # Server actions (public forms)
  page.tsx            # Public home page

components/
  features/           # Page-level sections and dialogs
  organisms/          # Complex organisms (3D scene, player)
  ui/                 # Primitive UI components (Button, Input, BaseModal…)

hooks/                # Client-side React hooks
lib/
  schemas/            # Zod schemas (single source of truth)
  mockData.ts         # Demo data for dev mode and empty-DB fallback
  services-config.ts  # Static services/pricing config
  site.ts             # Site-wide constants
services/             # Data access layer (Supabase calls)
supabase/             # init_all.sql (idempotent schema + seed)
tests/                # Vitest unit + integration tests
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service-role key (server only) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Full public URL (e.g. `https://sonorativa.com`) |
| `RESEND_API_KEY` | ✅ | Resend API key for contact form emails |
| `CONTACT_TO_EMAIL` | ✅ | Email address that receives contact form submissions |
| `CONTACT_FROM_EMAIL` | ✅ | Sender address for outgoing emails |
| `NEXT_PUBLIC_DEV_MODE` | Optional | Set `true` to use mock data locally |
| `NEXT_PUBLIC_SHOW_DEMO_BADGE` | Optional | Set `true` to show "Demo content" badges |
