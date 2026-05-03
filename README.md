# SONORATIVA

Professional audio engineering studio – mixing & mastering services with future VST/digital product shop.

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FNeuroklast%2Fmixing-mastering-stu&env=DATABASE_URI,PAYLOAD_SECRET,S3_ENDPOINT,S3_ACCESS_KEY_ID,S3_SECRET_ACCESS_KEY,S3_BUCKET,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEXT_PUBLIC_SITE_URL&envDescription=See%20the%20Environment%20Variables%20section%20in%20README.md%20for%20instructions&envLink=https%3A%2F%2Fgithub.com%2FNeuroklast%2Fmixing-mastering-stu%23environment-variables&project-name=sonorativa&repository-name=sonorativa)

---

## Tech Stack

| Category | Tool |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript Strict |
| CMS | Payload CMS v3 (at `/admin-cms`, Postgres adapter) |
| Styling | Tailwind CSS v4 (CSS-first, `@theme` directive) |
| UI Components | Shadcn/UI (Radix primitives + `class-variance-authority`) |
| Animations | Framer Motion + Lenis smooth scroll |
| Database / Auth | Supabase (PostgreSQL + Storage) |
| Media Storage | Supabase S3 (via `@payloadcms/storage-s3`) |
| Validation | Zod (all inputs and service boundaries) |
| Testing | Vitest (integration) + Playwright (E2E) |

---

## Benutzeranleitung / Setup Guide

This guide covers everything from cloning the repo to a production deployment on Vercel.

---

### Prerequisites

| Tool | Minimum version | Check |
|---|---|---|
| Node.js | 18 | `node -v` |
| npm | 9 | `npm -v` |
| Git | any | `git --version` |
| Supabase account | — | [supabase.com](https://supabase.com) |
| Vercel account | — | [vercel.com](https://vercel.com) |

---

### Part 1 — Supabase Project Setup

Before you deploy, you need a Supabase project with a few things configured.

#### 1.1 Create a Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com) → **New project**
2. Choose a region close to your target audience
3. Save your **database password** — you'll need it for `DATABASE_URI`

#### 1.2 Apply the Database Schema

The SQL schema lives in `supabase/schema.sql`. Run it once to create all tables.

**Option A — Supabase SQL Editor (easiest)**

1. Open your Supabase project → **SQL Editor** → **New query**
2. Paste the contents of `supabase/schema.sql`
3. Click **Run**

**Option B — psql / local script**

```bash
# Set up .env.local first (see section 2), then:
npm run setup:db
```

#### 1.3 Create the Media Storage Bucket

Payload uploads all CMS media (images, files) to a Supabase Storage bucket.

1. Supabase dashboard → **Storage** → **New bucket**
2. Name it `media` (or any name — you'll use it as `S3_BUCKET`)
3. Set to **Private** — Payload will serve files via its own URL
4. Keep the default settings and click **Create bucket**

#### 1.4 Gather Your Credentials

You need the following values from the Supabase dashboard:

| Credential | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` key (secret!) |
| `DATABASE_URI` | Project Settings → Database → Connection string → URI (use Session pooler) |
| `S3_ENDPOINT` | Storage → S3 Connection → Endpoint |
| `S3_ACCESS_KEY_ID` | Storage → S3 Connection → Access key ID |
| `S3_SECRET_ACCESS_KEY` | Storage → S3 Connection → Secret access key |

The S3 endpoint follows the pattern:
```
https://<project-ref>.supabase.co/storage/v1/s3
```

---

### Part 2 — Local Development Setup

#### 2.1 Clone and Install

```bash
git clone https://github.com/Neuroklast/mixing-mastering-stu.git
cd mixing-mastering-stu
npm ci
```

Or use the automated setup script which also checks your Node version:

```bash
npm run setup
```

#### 2.2 Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in the values you collected in Part 1. The file is pre-populated with explanatory comments.

> **Tip — Zero credentials dev mode:**  
> Leave `NEXT_PUBLIC_DEV_MODE=true` (the default) to run entirely on mock data without any Supabase connection. All services return pre-defined sample data from `lib/mockData.ts`. This is ideal for frontend development and is safe to commit.

#### 2.3 Run Payload Migrations (first time only)

```bash
npm run payload:init
```

This runs `npx payload migrate` (creates tables in your Supabase Postgres) and `npx payload generate:types` (regenerates `payload-types.ts`).

#### 2.4 Start the Dev Server

```bash
npm run dev
```

The app is now running at [http://localhost:3000](http://localhost:3000).  
The Payload CMS admin panel is at [http://localhost:3000/admin-cms](http://localhost:3000/admin-cms).

---

### Part 3 — Vercel Deployment

#### Option A — One-Click Deploy (recommended)

Click the button at the top of this README. Vercel will:

1. Fork/clone the repository into your GitHub account
2. Ask you to fill in the environment variables (listed below)
3. Run `npm run build` (`payload generate:types && next build`) automatically
4. Deploy the app

When Vercel asks for environment variables, use the values from Part 1.

#### Option B — Manual Vercel Setup

**Step 1 — Import the repository**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Select **Import Git Repository** → connect GitHub → choose `mixing-mastering-stu`
3. Framework preset will be detected as **Next.js** automatically

**Step 2 — Add environment variables**

Under **Environment Variables**, add every variable from the table in the [Environment Variables](#environment-variables) section. Make sure they are set for **Production**, **Preview**, and **Development** environments.

**Step 3 — Build & Output Settings**

The default settings work out of the box. The `build` script is already configured as:
```
payload generate:types && next build
```
Vercel uses the `build` script from `package.json` automatically.

**Step 4 — Deploy**

Click **Deploy**. Vercel will:
- Install dependencies
- Run `payload generate:types` to ensure TypeScript types are up to date
- Run `next build` with full static optimization

After the first successful deployment, Payload will automatically run pending migrations on startup via the `db.push` functionality.

#### Step 5 — Create Your Admin User

1. Visit `https://your-project.vercel.app/admin-cms`
2. On first access, Payload will prompt you to create the first admin user
3. Use a strong password — this is your CMS control panel

---

### Part 4 — Supabase + Vercel Integration (Optional but Recommended)

The [Supabase Vercel Integration](https://vercel.com/integrations/supabase) automatically injects your Supabase credentials into Vercel environment variables — no copy-pasting of secrets required.

**How to use it:**

1. Go to your Vercel project → **Settings** → **Integrations**
2. Search for **Supabase** → **Add Integration**
3. Connect your Supabase organization and select your project
4. Vercel automatically populates `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `DATABASE_URL`

> **Note:** The integration uses slightly different variable names. After connecting, manually verify that the variable names match what `env.mjs` expects (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URI`). You may need to rename or copy the values.

---

## Architecture

```
/
├── app/                       # Next.js App Router
│   ├── layout.tsx             # Root layout – lang="en", skip-to-content, viewport
│   ├── page.tsx               # Homepage (Server Component)
│   ├── globals.css            # Tailwind v4 + SONORATIVA design tokens (B/W/Red CI)
│   ├── actions/               # Server Actions (thin orchestration layer)
│   │   ├── createOrder.ts     # → delegates to services/orderService
│   │   ├── uploadAudio.ts     # → delegates to services/fileService
│   │   └── generateSignedUrl.ts
│   ├── legal/                 # Legal pages (SSR, no JS required)
│   │   ├── privacy/page.tsx   # Privacy Policy (GDPR)
│   │   └── terms/page.tsx     # Terms of Service
│   └── (payload)/             # Payload CMS admin panel
│       └── admin-cms/         # Served at /admin-cms
├── collections/               # Payload CMS collection configs
│   ├── Users.ts
│   ├── Orders.ts
│   ├── Products.ts
│   ├── Showcase.ts
│   ├── Credits.ts
│   ├── Reviews.ts
│   ├── Gallery.ts             # Studio gallery images
│   └── Media.ts               # Uploads → Supabase S3 via @payloadcms/storage-s3
├── components/
│   ├── features/              # Complex feature components (client-side)
│   └── ui/                    # Shadcn/UI primitives (no business logic)
├── hooks/
│   └── useAudioEngine.ts      # FSM audio engine
├── lib/
│   ├── devMode.ts             # ★ Single source of truth for NEXT_PUBLIC_DEV_MODE flag
│   ├── serviceResult.ts       # ★ Shared ServiceResult<T> type + ok/err helpers
│   ├── mockData.ts            # Mock data for dev mode
│   ├── schemas/               # Zod schemas (single source of truth for data shapes)
│   │   ├── credits.ts
│   │   ├── review.ts
│   │   ├── gallery.ts
│   │   └── showcase.ts
│   └── payload/
│       └── resolveMediaUrl.ts # ★ Shared Payload media URL resolver
├── services/                  # Data access layer (no UI logic)
│   ├── creditsService.ts      # Payload CMS → Credits collection
│   ├── reviewsService.ts      # Payload CMS → Reviews collection
│   ├── galleryService.ts      # Payload CMS → Gallery collection
│   ├── showcaseService.ts     # Payload CMS → Showcase collection
│   ├── orderService.ts        # Supabase → orders table
│   ├── fileService.ts         # Supabase → files table + storage
│   └── productService.ts      # Supabase → products table
├── scripts/
│   ├── setup.sh               # One-shot local setup
│   ├── setup-db.sh            # Apply Supabase schema
│   └── payload-init.sh        # Run Payload migrations + type generation
├── tests/
│   ├── integration/           # Vitest – service + schema tests
│   └── e2e/                   # Playwright – full user journey tests
└── payload.config.ts          # Payload + S3 storage configuration
```

---

## Environment Variables

See `.env.local.example` for a complete list with descriptions.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase `service_role` key (server only) |
| `DATABASE_URI` | ✅ | Supabase Postgres connection string (Session pooler URI) |
| `PAYLOAD_SECRET` | ✅ | Min. 32 chars secret for Payload CMS JWT signing |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Full site URL, e.g. `https://sonorativa.com` |
| `S3_ENDPOINT` | ✅ | Supabase S3 endpoint, e.g. `https://<ref>.supabase.co/storage/v1/s3` |
| `S3_ACCESS_KEY_ID` | ✅ | Supabase S3 access key ID |
| `S3_SECRET_ACCESS_KEY` | ✅ | Supabase S3 secret access key |
| `S3_BUCKET` | ✅ | Supabase storage bucket name (e.g. `media`) |
| `NEXT_PUBLIC_SERVER_URL` | ❌ | Server URL for local Payload media fallback (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_DEV_MODE` | ❌ | `true` → mock data, no connections needed (default for local dev) |

---

## Service Architecture

### Two-Mode System

| Mode | Env | Behaviour |
|---|---|---|
| **Dev mode** | `NEXT_PUBLIC_DEV_MODE=true` | All services return mock data. No network calls. |
| **Production mode** | `NEXT_PUBLIC_DEV_MODE=false` | Live Supabase + Payload CMS data. |

### Shared Utilities

**`lib/devMode.ts`** — Single source of truth for the dev mode flag:
```typescript
export const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
```

**`lib/serviceResult.ts`** — Shared `ServiceResult<T>` type + helpers:
```typescript
export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string }
export const ok = <T>(data: T): ServiceResult<T> => ({ success: true, data })
export const err = (error: string): ServiceResult<never> => ({ success: false, error })
```

**`lib/payload/resolveMediaUrl.ts`** — Resolves Payload CMS media objects to public URLs (handles both populated relations with `.url` and S3/local uploads with `.filename`).

### Storage Architecture

All Payload media uploads are stored in Supabase Storage via the S3 protocol. The `@payloadcms/storage-s3` plugin intercepts every upload in the `media` collection and stores it in the configured S3 bucket. This makes the deployment completely stateless — no files are written to Vercel's ephemeral filesystem.

```
Browser upload → Payload Admin → @payloadcms/storage-s3 → Supabase Storage (S3)
                                                                     ↓
Frontend image request ←── Payload resolves URL ←── S3 public URL
```

---

## Setup Scripts

```bash
# One-shot local setup (checks Node version, installs deps, copies .env, runs tests)
npm run setup

# Apply Supabase schema to a live database
npm run setup:db

# Run Payload migrations + generate TypeScript types
npm run payload:init
```

Make scripts executable after cloning:
```bash
chmod +x scripts/*.sh
```

---

## Gallery / CMS Content Management

The admin panel at `/admin-cms` manages 5 Payload collections:

| Collection | Description |
|---|---|
| **Credits** | Artist/band credits (name, role, year, cover image, Spotify URL) |
| **Reviews** | Client reviews (name, rating, text, service, date) |
| **Gallery** | Studio gallery images — uploaded directly to Supabase S3 |
| **Showcase** | A/B player tracks (before/after audio, waveform data) |
| **Products** | VST plugins / sample packs (for future Stripe integration) |

To add a gallery image:
1. Open `/admin-cms` → **Gallery** → **Create New**
2. Upload an image (stored automatically in Supabase S3)
3. Fill in the alt text, optional caption, and display order
4. Set **Active** to true and save

---

## Testing

```bash
# Unit + integration tests (Zod schemas + services in dev mode)
npm test

# E2E tests (requires running dev server on port 3000)
npm run test:e2e
```

Tests never require real credentials — services are tested with `NEXT_PUBLIC_DEV_MODE=true`, and Payload CMS is mocked with `vi.mock()`.

---

## Legal

Legal pages are server-rendered under `/legal/`:

- `/legal/privacy` – Privacy Policy (GDPR compliant)
- `/legal/terms` – Terms of Service

---

## Design System

| Token | Value | Usage |
|---|---|---|
| `--color-background` | `#121212` | Page background |
| `--color-foreground` | `#F5F5F5` | Body text |
| `--color-accent` | `#D94848` | CTA, highlights, borders |
| `--color-card` | `#1E1E1E` | Card / modal background |
| `--color-border` | `#2E2E2E` | Borders |
| `--color-muted-foreground` | `#888888` | Secondary text |
