# SONORATIVA

Professional audio engineering studio — mixing & mastering services.

---

## Tech Stack

| Category | Tool |
|---|---|
| Framework | Next.js (App Router) + TypeScript Strict |
| Admin | Custom `/admin` area (Next.js Server + Client Components) |
| Styling | Tailwind CSS v4 (CSS-first, `@theme` directive) |
| UI Components | Shadcn/UI (Radix primitives + `class-variance-authority`) |
| Animations | Framer Motion + Lenis smooth scroll |
| Database / Auth | Supabase (PostgreSQL + Auth) |
| Storage | Cloudflare R2 (images + audio; S3 multipart for large WAV files) |
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
| Node.js | 20+ | `node -v` |
| npm | 9 | `npm -v` |
| Git | any | `git --version` |
| Supabase account | — | [supabase.com](https://supabase.com) |
| Vercel account | — | [vercel.com](https://vercel.com) |
| Cloudflare account | — | [cloudflare.com](https://cloudflare.com) (for file storage) |

---

### Part 1 — Supabase Project Setup

Before you deploy, you need a Supabase project with a few things configured.

#### 1.1 Create a Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com) → **New project**
2. Choose a region close to your target audience
3. Save your database password (you will not need to put it in Vercel — Supabase handles auth)

#### 1.2 Apply the Database Schema

The master SQL script `supabase/init_all.sql` creates all tables, enables RLS, and sets up policies in a single idempotent transaction.

---

##### Pro Way — Automated Script

The script checks for the Supabase CLI, guides you through login + project linking, and applies the SQL.

```bash
npm run setup:supabase
```

---

##### Noob Way — SQL Editor (no CLI needed)

1. Open your Supabase project → **SQL Editor** → **New query**
2. Copy the **entire contents** of `supabase/init_all.sql` and paste it in
3. Click **Run**

That is it — all tables and RLS policies are created.

---

#### 1.3 Gather Your Supabase Credentials

| Credential | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` key (keep this secret!) |

---

### Part 2 — Cloudflare R2 Setup

All file uploads (images and audio) use **Cloudflare R2** object storage. This gives you 10 GB free storage and unlimited egress.

#### 2.1 Create R2 Buckets

Run the automated setup script:

```bash
npm run r2:setup
```

This creates two buckets:
- `sonorativa-media` — public bucket for gallery images and cover art
- `sonorativa-audio` — private bucket for showcase WAV files

#### 2.2 Gather R2 Credentials

| Variable | Where to find it |
|---|---|
| `R2_ACCOUNT_ID` | Cloudflare Dashboard → R2 → Overview → Account ID |
| `R2_ACCESS_KEY_ID` | R2 → Manage R2 API tokens → Create API token |
| `R2_SECRET_ACCESS_KEY` | Same as above (shown once on creation) |
| `R2_PUBLIC_HOST` | R2 → `sonorativa-media` → Settings → Public Access → Enable |
| `R2_BUCKET_MEDIA` | `sonorativa-media` |
| `R2_BUCKET_AUDIO` | `sonorativa-audio` |

For detailed R2 instructions, see [docs/cloudflare-r2.md](docs/cloudflare-r2.md).

---

### Part 3 — Email Setup (Resend)

Review invite emails and contact form notifications are sent via [Resend](https://resend.com).

1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Verify your sender domain (or use `@resend.dev` during testing)

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Your Resend API key |
| `CONTACT_TO_EMAIL` | Address that receives contact form submissions |
| `CONTACT_FROM_EMAIL` | Verified sender address in your Resend account |

---

### Part 4 — Local Development Setup

#### 4.1 Clone and Install

```bash
git clone https://github.com/Neuroklast/mixing-mastering-stu.git
cd mixing-mastering-stu
npm ci
```

#### 4.2 Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in the values you collected in Parts 1-3.

> **Tip — Zero credentials dev mode:**
> Leave `NEXT_PUBLIC_DEV_MODE=true` (the default) to run entirely on mock data without any Supabase or R2 connection. All services return pre-defined sample data. This is ideal for frontend development.

#### 4.3 Start the Dev Server

```bash
npm run dev
```

The app is now running at [http://localhost:3000](http://localhost:3000).
The admin panel is at [http://localhost:3000/admin](http://localhost:3000/admin).

#### 4.4 Create Your First Admin User

1. Go to your Supabase project → **Authentication** → **Users** → **Invite user**
2. After the user accepts the invite, open **SQL Editor** and run:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid>';
   ```
3. Log in at `/admin` with the credentials you set

---

### Part 5 — Vercel Deployment

#### Step 1 — Import the repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Select **Import Git Repository** → connect GitHub → choose `mixing-mastering-stu`
3. Framework preset will be detected as **Next.js** automatically

#### Step 2 — Add environment variables

Under **Environment Variables**, add every variable from the [Environment Variables](#environment-variables) section. Set them for **Production**, **Preview**, and **Development** environments.

#### Step 3 — Deploy

Click **Deploy**. Vercel will install dependencies and run `next build`.

#### Step 4 — Create Your Admin User

1. Go to your Supabase project → **Authentication** → **Users** → **Invite user**
2. After the user accepts the invite, open **SQL Editor** and run:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid>';
   ```
3. Log in at `https://your-project.vercel.app/admin`

---

### Part 6 — Supabase + Vercel Integration (Optional but Recommended)

The [Supabase Vercel Integration](https://vercel.com/integrations/supabase) automatically injects your Supabase credentials into Vercel environment variables.

1. Go to your Vercel project → **Settings** → **Integrations**
2. Search for **Supabase** → **Add Integration**
3. Connect your Supabase organization and select your project

> **Note:** After connecting, verify the variable names match what `env.mjs` expects (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). You may need to rename them.

---

## Architecture

```
/
├── app/                       # Next.js App Router
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Homepage (Server Component)
│   ├── globals.css            # Tailwind v4 + SONORATIVA design tokens
│   ├── _actions/              # Public-facing Server Actions
│   │   └── contact.ts         # Contact form → Resend
│   ├── actions/               # Server Actions (order creation, audio upload)
│   ├── review/[token]/        # Public review submission page (invite link)
│   └── admin/                 # Admin area (Supabase Auth gated)
│       ├── _actions/          # Admin-only server actions
│       │   ├── auth.ts        # requireAdmin() checks session + profiles.role
│       │   ├── uploads.ts     # createSignedUploadUrl (images up to 100 MB)
│       │   └── r2Multipart.ts # S3 multipart upload actions (large audio)
│       ├── _components/       # Shared admin UI components
│       │   └── AudioUploadField.tsx  # R2 multipart upload widget
│       ├── content/           # Site copy editor
│       ├── showcase/          # Showcase CRUD (before/after audio tracks)
│       ├── gallery/           # Gallery CRUD
│       ├── members/           # Team member CRUD
│       ├── reviews/           # Reviews CRUD + invite email sender
│       ├── credits/           # Credits CRUD
│       ├── legal/             # Legal pages CRUD
│       └── media/             # File browser
├── hooks/
│   ├── useAudioEngine.ts      # FSM audio engine (before/after player)
│   └── useR2MultipartUpload.ts # S3 multipart upload hook (large WAV files)
├── lib/
│   ├── devMode.ts             # Single source of truth for NEXT_PUBLIC_DEV_MODE
│   ├── serviceResult.ts       # ServiceResult<T> type + ok/err helpers
│   ├── supabaseServer.ts      # Supabase server client (cookie-based auth)
│   ├── supabaseAdmin.ts       # Supabase admin client (service role)
│   ├── email/                 # Email service (Resend) + HTML templates
│   ├── storage/               # Storage abstraction (Cloudflare R2)
│   └── schemas/               # Zod schemas (single source of truth for data shapes)
├── services/                  # Data access layer (Supabase, no UI logic)
│   ├── showcaseService.ts     # Generates signed URLs for audio files
│   ├── reviewsService.ts      # Fetches active (approved) reviews only
│   └── ...
├── supabase/
│   └── init_all.sql           # Idempotent schema + RLS policies
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
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase `service_role` key (server only) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Full site URL, e.g. `https://sonorativa.com` |
| `RESEND_API_KEY` | Yes | Resend API key for email delivery |
| `CONTACT_TO_EMAIL` | Yes | Email address that receives contact form submissions |
| `CONTACT_FROM_EMAIL` | Yes | Verified sender address in Resend |
| `R2_ACCOUNT_ID` | Yes | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Yes | R2 API token key ID |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 API token secret |
| `R2_PUBLIC_HOST` | Yes | Public custom domain for `sonorativa-media` bucket (used by `next/image`) |
| `R2_BUCKET_MEDIA` | No | Media bucket name (default: `sonorativa-media`) |
| `R2_BUCKET_AUDIO` | No | Audio bucket name (default: `sonorativa-audio`) |
| `NEXT_PUBLIC_DEV_MODE` | No | `true` enables mock data, no connections needed. **Must be `false` or unset in production.** |
| `NEXT_PUBLIC_HIDE_DEMO_FALLBACK` | No | `true` disables demo-content fallbacks — empty DB table → empty section (no demo data shown). Recommended for production. |

---

## Going Live Checklist

Set these environment variables on Vercel before deploying to production:

```
Required:
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  NEXT_PUBLIC_SITE_URL=https://mixing-mastering-stu.vercel.app
  R2_ACCOUNT_ID
  R2_ACCESS_KEY_ID
  R2_SECRET_ACCESS_KEY
  R2_PUBLIC_HOST          (e.g. https://pub-abc123.r2.dev or your custom domain)
  R2_BUCKET_AUDIO=sonorativa-audio
  R2_BUCKET_MEDIA=sonorativa-media

Optional:
  NEXT_PUBLIC_HIDE_DEMO_FALLBACK=true   (disable demo content fallbacks)
  RESEND_API_KEY                         (contact form + review invites)
  CONTACT_TO_EMAIL
  CONTACT_FROM_EMAIL
  NEXT_PUBLIC_SHOW_DEMO_BADGE=false      (hide "Demo" badge in production)

Forbidden in production:
  NEXT_PUBLIC_DEV_MODE=true              (must be false or unset)
```

> **Note on `R2_PUBLIC_HOST`:** This env var is parsed at **build time** by `next.config.mjs` to add the R2 domain to `images.remotePatterns`. Without it, `next/image` will return 400 for any gallery/member/credit cover images served from R2. Always set it on Vercel before deploying.

---

## Service Architecture

### Two-Mode System

| Mode | Env | Behaviour |
|---|---|---|
| **Dev mode** | `NEXT_PUBLIC_DEV_MODE=true` | All services return mock data. No network calls. |
| **Production mode** | `NEXT_PUBLIC_DEV_MODE=false` | Live Supabase data + R2 storage. |

### Audio Upload Architecture

Audio files are uploaded directly from the browser to Cloudflare R2 using **S3 Multipart Upload**. Files never pass through the Next.js server.

```
Admin selects WAV file
       ↓
useR2MultipartUpload hook calls createMultipartUpload() (Server Action)
       ↓ returns uploadId + presigned part URLs
Browser uploads in 5 MB chunks directly to Cloudflare R2
       ↓ on completion: completeMultipartUpload() (Server Action)
objectPath saved to showcase record
Server renders public page
       ↓
showcaseService.ts generates a 2-hour signed download URL
Audio player streams WAV directly from R2
```

### Storage Architecture

| Bucket | Visibility | Used for |
|---|---|---|
| `sonorativa-media` | Public (custom domain) | Gallery images, cover art, other media |
| `sonorativa-audio` | Private (signed URL) | Showcase WAV files (before/after) |

---

## Admin Content Management

The admin panel at `/admin` manages these content areas:

| Section | Description |
|---|---|
| **Content** | Edit all site copy: hero text, about section, contact details, social links |
| **Showcase** | A/B player tracks — WAV audio uploaded via S3 multipart |
| **Gallery** | Studio gallery images |
| **Members** | Team member profiles |
| **Credits** | Artist/band credits (name, role, year, cover image, Spotify URL) |
| **Reviews** | Client reviews with invite-by-email flow |
| **Legal** | Impressum, Privacy Policy, Terms of Service |
| **Media** | File browser for Cloudflare R2 |

### Sending a Review Invite

The review invite system lets you request a review from a client without them needing to create an account:

1. Open `/admin` → **Reviews** → **Send Invite**
2. Enter the client name, email address, and the service they received
3. Click **Send Email** — the client receives a personalised link valid for 30 days
4. The client opens the link, fills in their rating and review text
5. The submitted review appears in the admin with status **Hidden** (inactive)
6. Review the content, then click **Hidden → Live** to publish it on the public site

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

## Setup Scripts

```bash
# Automated Supabase provisioning: applies init_all.sql
npm run setup:supabase

# Apply Supabase schema to a live database
npm run setup:db

# Provision R2 buckets automatically
npm run r2:setup

# Back up the database
npm run backup:db
```

---

## Legal Pages

Legal pages are server-rendered under `/legal/`:

- `/legal/impressum` — Imprint
- `/legal/privacy` — Privacy Policy
- `/legal/terms` — Terms of Service

Edit these in the admin panel under **Legal**.

---

## Design System

| Token | Value | Usage |
|---|---|---|
| `--color-background` | `#0d0d0d` | Page background |
| `--color-foreground` | `#F5F5F5` | Body text |
| `--color-accent` | `#D94848` | CTA, highlights, borders |
| `--color-card` | `#1E1E1E` | Card / modal background |
| `--color-border` | `#2E2E2E` | Borders |
| `--color-muted-foreground` | `#888888` | Secondary text |
