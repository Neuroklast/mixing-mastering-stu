# SONORATIVA

Professional audio engineering studio – mixing & mastering services with future VST/digital product shop.

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FNeuroklast%2Fmixing-mastering-stu&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEXT_PUBLIC_SITE_URL,RESEND_API_KEY,CONTACT_TO_EMAIL,CONTACT_FROM_EMAIL&envDescription=See%20the%20Environment%20Variables%20section%20in%20README.md%20for%20instructions&envLink=https%3A%2F%2Fgithub.com%2FNeuroklast%2Fmixing-mastering-stu%23environment-variables&project-name=sonorativa&repository-name=sonorativa)

---

## Tech Stack

| Category | Tool |
|---|---|
| Framework | Next.js (App Router) + TypeScript Strict |
| Admin | Custom `/admin` area (Next.js Server + Client Components) |
| Styling | Tailwind CSS v4 (CSS-first, `@theme` directive) |
| UI Components | Shadcn/UI (Radix primitives + `class-variance-authority`) |
| Animations | Framer Motion + Lenis smooth scroll |
| Database / Auth | Supabase (PostgreSQL + Storage + Auth) |
| Audio Uploads | TUS resumable uploads via `tus-js-client` (≤5 GB/file, Free Tier) |
| Email | Resend |
| Validation | Zod (all inputs and service boundaries) |
| Testing | Vitest (integration) + Playwright (E2E) |

---

## Setup Guide

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
3. Save your database password (you won't need to put it in Vercel — Supabase handles auth)

#### 1.2 Apply the Database Schema & Create Buckets

The master SQL script `supabase/init_all.sql` creates all tables, enables RLS, sets up policies, and provisions the required storage buckets in a single idempotent transaction.

---

##### ✅ Pro Way — Automated Script

The script checks for the Supabase CLI, guides you through login + project linking, applies the SQL, and generates a ready-to-paste `.env.production` file.

```bash
npm run setup:supabase
```

After it finishes, a `.env.production` file is created in the project root.  Copy-paste its contents into **Vercel → Project Settings → Environment Variables** (Production environment).

---

##### 🐣 Noob Way — SQL Editor (no CLI needed)

1. Open your Supabase project → **SQL Editor** → **New query**
2. Copy the **entire contents** of `supabase/init_all.sql` and paste it in
3. Click **Run**

That's it — all tables, RLS policies, and storage buckets are created.  You still need to fill in the environment variables manually (see §1.4 below).

---

#### 1.3 Gather Your Credentials

You need the following values from the Supabase dashboard:

| Credential | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` key (secret!) |

You also need:

| Variable | Where to get it |
|---|---|
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |
| `CONTACT_TO_EMAIL` | The email address that receives contact form submissions |
| `CONTACT_FROM_EMAIL` | A verified sender address in your Resend account |

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

#### 2.3 Start the Dev Server

```bash
npm run dev
```

The app is now running at [http://localhost:3000](http://localhost:3000).  
The admin panel is at [http://localhost:3000/admin](http://localhost:3000/admin).

#### 2.4 Create Your First Admin User

1. Go to your Supabase project → **Authentication** → **Users** → **Invite user**
2. After the user accepts the invite, open **SQL Editor** and run:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid>';
   ```
3. Log in at `/admin` with the credentials you set

---

### Part 3 — Vercel Deployment

#### Option A — One-Click Deploy (recommended)

Click the button at the top of this README. Vercel will:

1. Fork/clone the repository into your GitHub account
2. Ask you to fill in the environment variables (listed below)
3. Run `next build` automatically
4. Deploy the app

When Vercel asks for environment variables, use the values from Part 1.

#### Option B — Manual Vercel Setup

**Step 1 — Import the repository**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Select **Import Git Repository** → connect GitHub → choose `mixing-mastering-stu`
3. Framework preset will be detected as **Next.js** automatically

**Step 2 — Add environment variables**

Under **Environment Variables**, add every variable from the table in the [Environment Variables](#environment-variables) section. Make sure they are set for **Production**, **Preview**, and **Development** environments.

**Step 3 — Deploy**

Click **Deploy**. Vercel will install dependencies and run `next build`.

#### Step 4 — Create Your Admin User

1. Go to your Supabase project → **Authentication** → **Users** → **Invite user**
2. After the user accepts the invite, open **SQL Editor** and run:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid>';
   ```
3. Log in at `https://your-project.vercel.app/admin`

---

### Part 4 — Supabase + Vercel Integration (Optional but Recommended)

The [Supabase Vercel Integration](https://vercel.com/integrations/supabase) automatically injects your Supabase credentials into Vercel environment variables — no copy-pasting of secrets required.

**How to use it:**

1. Go to your Vercel project → **Settings** → **Integrations**
2. Search for **Supabase** → **Add Integration**
3. Connect your Supabase organization and select your project
4. Vercel automatically populates `SUPABASE_URL`, `SUPABASE_ANON_KEY`, etc.

> **Note:** The integration uses slightly different variable names. After connecting, verify they match what `env.mjs` expects (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). You may need to rename them.

---

## Architecture

```
/
├── app/                       # Next.js App Router
│   ├── layout.tsx             # Root layout – lang="en", skip-to-content, viewport
│   ├── page.tsx               # Homepage (Server Component)
│   ├── globals.css            # Tailwind v4 + SONORATIVA design tokens (B/W/Red CI)
│   ├── _actions/              # Public-facing Server Actions
│   │   ├── contact.ts         # Contact form → Resend
│   │   └── generateSignedUrl.ts
│   ├── actions/               # Legacy Server Actions (audio upload, order creation)
│   ├── admin/                 # Admin area (Supabase Auth gated)
│   │   ├── _actions/          # Admin-only server actions
│   │   │   ├── auth.ts        # requireAdmin() — checks session + profiles.role
│   │   │   └── uploads.ts     # createSignedUploadUrl + getTusUploadCredentials
│   │   ├── _components/       # Shared admin UI components
│   │   │   └── AudioUploadField.tsx  # TUS upload widget with progress bar
│   │   ├── showcase/          # Showcase CRUD (audio player with TUS uploads)
│   │   ├── gallery/           # Gallery CRUD
│   │   ├── reviews/           # Reviews CRUD
│   │   ├── credits/           # Credits CRUD
│   │   ├── legal/             # Legal pages CRUD
│   │   └── media/             # Media browser
│   └── legal/                 # Public legal pages (SSR)
├── hooks/
│   ├── useAudioEngine.ts      # FSM audio engine
│   └── useTusUpload.ts        # TUS resumable upload hook (large files)
├── lib/
│   ├── devMode.ts             # ★ Single source of truth for NEXT_PUBLIC_DEV_MODE flag
│   ├── serviceResult.ts       # ★ Shared ServiceResult<T> type + ok/err helpers
│   ├── supabaseServer.ts      # Supabase server client (cookie-based auth)
│   ├── supabaseAdmin.ts       # Supabase admin client (service role)
│   ├── supabaseClient.ts      # Supabase browser client
│   ├── mockData.ts            # Mock data for dev mode
│   └── schemas/               # Zod schemas (single source of truth for data shapes)
├── services/                  # Data access layer (Supabase-only, no UI logic)
│   ├── showcaseService.ts     # Generates 1-hour signed URLs for audio files
│   ├── creditsService.ts
│   ├── galleryService.ts
│   ├── reviewsService.ts
│   ├── legalService.ts
│   ├── orderService.ts
│   ├── fileService.ts
│   └── productService.ts
├── supabase/
│   └── init_all.sql           # Idempotent schema + RLS + storage policies
├── middleware.ts               # Protects /admin/* — Supabase Auth + profiles.role='admin'
└── tests/
    ├── integration/           # Vitest – service + schema tests
    ├── unit/                  # Vitest – hook unit tests
    └── e2e/                   # Playwright – full user journey tests
```

---

## Environment Variables

See `.env.local.example` for a complete list with descriptions.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase `service_role` key (server only) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Full site URL, e.g. `https://sonorativa.com` |
| `RESEND_API_KEY` | ✅ | Resend API key for contact form emails |
| `CONTACT_TO_EMAIL` | ✅ | Email address that receives contact form submissions |
| `CONTACT_FROM_EMAIL` | ✅ | Verified sender address in Resend |
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

### Audio Upload Architecture

Audio files (WAVs up to 75 MB, 150 MB per A/B comparison) use **TUS resumable uploads** so they never pass through a Next.js route:

```
Admin selects WAV file
       ↓
useTusUpload hook calls getTusUploadCredentials() (Server Action)
       ↓ returns access_token + endpoint
Browser uploads in 6 MB chunks via TUS directly to Supabase Storage
       ↓ on success: objectPath saved to showcase.before_storage_path
Server renders public page
       ↓
showcaseService.ts calls createSignedUrl(objectPath, 3600)
       ↓ 1-hour signed URL
Audio player streams WAV directly from Supabase Storage
```

- **TUS** (resumable upload protocol) is supported on Supabase Free Tier up to **5 GB per file**
- Standard PUT uploads are limited to 50 MB — not viable for 75 MB WAVs
- The `useTusUpload` hook in `hooks/useTusUpload.ts` handles chunking, progress, and resume

### Storage Architecture

| Bucket | Visibility | Used for |
|---|---|---|
| `audio-files` | Private (signed URL) | Showcase WAV files (before/after) |
| `media` | Public | Gallery images, other media |

By default, SONORATIVA uses **Supabase Storage**. You can switch to **Cloudflare R2** (10 GB free tier, unlimited egress) by setting `STORAGE_PROVIDER=r2` — see [docs/cloudflare-r2.md](docs/cloudflare-r2.md) for setup instructions.

---

## Setup Scripts

```bash
# One-shot local setup (checks Node version, installs deps, copies .env, runs tests)
npm run setup

# Full Supabase provisioning: applies init_all.sql, generates .env.production
npm run setup:supabase

# Apply Supabase schema to a live database
npm run setup:db
```

Make scripts executable after cloning:
```bash
chmod +x scripts/*.sh bin/*.sh
```

---

## Admin Content Management

The admin panel at `/admin` manages 6 collections:

| Collection | Description |
|---|---|
| **Showcase** | A/B player tracks — WAV audio uploaded via TUS resumable uploads |
| **Gallery** | Studio gallery images |
| **Credits** | Artist/band credits (name, role, year, cover image, Spotify URL) |
| **Reviews** | Client reviews (name, rating, text, service, date) |
| **Legal** | Impressum, Datenschutz pages |
| **Media** | File browser for Supabase Storage |

To add a showcase track with audio:
1. Open `/admin` → **Showcase** → **New**
2. Fill in title, artist, genre etc.
3. For **Before Audio** and **After Audio**: click **Choose File**, select your WAV
4. The progress bar shows upload progress — files upload directly to Supabase (no size limit issues)
5. On success the storage path is saved; click **Save** to persist the record

---

## Testing

```bash
# Unit + integration tests (Zod schemas + services in dev mode)
npm test

# E2E tests (requires running dev server on port 3000)
npm run test:e2e
```

Tests never require real credentials — services are tested with `NEXT_PUBLIC_DEV_MODE=true`.

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
