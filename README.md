# SONORATIVA

Professional audio engineering studio – mixing & mastering services with future VST/digital product shop.

## Tech Stack

| Category | Tool |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript Strict |
| CMS | Payload CMS v3 (at `/admin-cms`, Postgres adapter) |
| Styling | Tailwind CSS v4 (CSS-first, `@theme` directive) |
| UI Components | Shadcn/UI (Radix primitives + `class-variance-authority`) |
| Animations | Framer Motion + Lenis smooth scroll |
| Database / Auth | Supabase (PostgreSQL + Storage) |
| Validation | Zod (all inputs and service boundaries) |
| Testing | Vitest (integration) + Playwright (E2E) |
| Error Monitoring | Sentry (stubs – install `@sentry/nextjs` to activate) |

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
│   │   ├── layout.tsx         # Minimal header + footer for legal pages
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
│   └── Media.ts
├── components/
│   ├── features/              # Complex feature components (client-side)
│   │   ├── CreditsSection.tsx
│   │   ├── ReviewsSection.tsx # Uses Review type from lib/schemas/review
│   │   ├── GallerySection.tsx # Uses GalleryImage type from lib/schemas/gallery
│   │   ├── Navbar.tsx
│   │   ├── HeroSection.tsx
│   │   ├── ServicesSection.tsx
│   │   ├── ServicesModal.tsx   # Uses BaseModal (variant="wide")
│   │   ├── ContactDialog.tsx   # Uses BaseModal (variant="center")
│   │   ├── CookieBanner.tsx    # GDPR cookie notice (localStorage persistence)
│   │   ├── MasteringPlayer.tsx
│   │   ├── PlaylistPlayer.tsx
│   │   ├── Footer.tsx
│   │   └── ErrorBoundary.tsx
│   └── ui/                    # Shadcn/UI primitives (no business logic)
│       ├── base-modal.tsx     # ★ Single source of truth for modal design
│       └── …
├── hooks/
│   ├── useAudioEngine.ts      # FSM audio engine
│   └── …
├── lib/
│   ├── devMode.ts             # ★ Single source of truth for NEXT_PUBLIC_DEV_MODE flag
│   ├── serviceResult.ts       # ★ Shared ServiceResult<T> type + ok/err helpers
│   ├── mockData.ts            # Mock data for dev mode (typed with schema types)
│   ├── schemas/               # Zod schemas (single source of truth for data shapes)
│   │   ├── credits.ts
│   │   ├── review.ts
│   │   ├── gallery.ts
│   │   └── showcase.ts
│   ├── payload/
│   │   └── resolveMediaUrl.ts # ★ Shared Payload media URL resolver
│   └── …
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
└── …
```

## Design System

The site enforces a single black/white/red CI defined in `app/globals.css`:

| Token | Value | Usage |
|---|---|---|
| `--color-background` | `#121212` | Page background |
| `--color-foreground` | `#F5F5F5` | Body text |
| `--color-accent` | `#D94848` | CTA, highlights, borders |
| `--color-card` | `#1E1E1E` | Card / modal background |
| `--color-border` | `#2E2E2E` | Borders |
| `--color-muted-foreground` | `#888888` | Secondary text |

All modals use `BaseModal` (`components/ui/base-modal.tsx`) which is the single source of truth for:
- Backdrop: `bg-black/85 backdrop-blur-md`
- Animation: Radix data-state CSS animations
- Close button: consistent ✕ with focus ring
- Two variants: `center` (forms) and `wide` (full-page panels)

## Getting Started

### Quick Start (recommended)

```bash
# Run the automated setup script (checks Node, installs deps, copies .env)
npm run setup
```

### Manual Setup

```bash
# 1. Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase and Payload credentials

# 2. Install dependencies
npm ci

# 3. Apply Supabase schema (first time only)
npm run setup:db
# Or manually: psql $DATABASE_URI < supabase/schema.sql

# 4. Run Payload migrations and generate types (first time only)
npm run payload:init

# 5. Start development server
npm run dev
```

### Dev Mode (zero credentials required)

Set `NEXT_PUBLIC_DEV_MODE=true` in `.env.local` (the default from the example file) to run the project without any external connections. All services return mock data from `lib/mockData.ts` — no Supabase or Payload credentials are needed.

## Service Architecture

### Two-Mode System

| Mode | Env | Behaviour |
|---|---|---|
| **Dev mode** | `NEXT_PUBLIC_DEV_MODE=true` | All services return mock data immediately. No network calls. |
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

**`lib/payload/resolveMediaUrl.ts`** — Resolves Payload CMS media objects to public URLs (handles both populated relations with `.url` and local-disk uploads with `.filename`).

### Service Pattern

Supabase services follow this pattern:
```typescript
import { isDev } from '@/lib/devMode'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'

export async function getX(): Promise<ServiceResult<X[]>> {
  if (isDev) return ok(MOCK_X)
  const supabase = await createClient()
  const { data, error } = await supabase.from('x').select('*')
  if (error) return err(error.message)
  return ok(data as X[])
}
```

Payload CMS services follow the same pattern with `getPayload({ config })`.

## Environment Variables

See `.env.local.example` for a complete list with descriptions.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (server only) |
| `DATABASE_URI` | ✅ | Supabase Postgres connection string (for Payload) |
| `PAYLOAD_SECRET` | ✅ | Min. 32 chars secret for Payload CMS |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Site URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_SERVER_URL` | ❌ | Server URL for Payload media resolution (defaults to `http://localhost:3000`) |
| `NEXT_PUBLIC_DEV_MODE` | ❌ | Set to `true` to use mock data (default for new devs) |

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

## Gallery / CMS Content Management

The admin panel at `/admin-cms` manages 5 Payload collections:

| Collection | Description |
|---|---|
| **Credits** | Artist/band credits (name, role, year, cover image, Spotify URL) |
| **Reviews** | Client reviews (name, rating, text, service, date) |
| **Gallery** | Studio gallery images (image upload, alt text, caption, display order) |
| **Showcase** | A/B player tracks (before/after audio, waveform data) |
| **Products** | VST plugins / sample packs (for future Stripe integration) |

To add gallery images: log in to `/admin-cms` → Gallery → Add New → upload image and set alt text.

## Testing

```bash
# Unit + integration tests (Zod schemas + services in dev mode)
npm test

# E2E tests (requires running dev server on port 3000)
npm run test:e2e
```

Tests never require real credentials — services are tested in `NEXT_PUBLIC_DEV_MODE=true` mode, and Payload CMS is mocked with `vi.mock()`.

## Legal

Legal pages are server-rendered under `/legal/`:

- `/legal/privacy` – Privacy Policy (GDPR compliant)
- `/legal/terms` – Terms of Service

Both pages are linked from the site footer and the cookie consent banner.

## Admin CMS

Payload CMS admin panel: `http://localhost:3000/admin-cms`

Manage credits, reviews, gallery images, showcase tracks, products, orders, and users from a fully type-safe headless CMS backed by Supabase PostgreSQL.

## Audio Player

The `useAudioEngine` hook manages a Web Audio API FSM with states `idle | loading | ready | playing | paused | switching | error`.

Key correctness guarantees:
- **Load generation guard**: a monotonic `loadGenerationRef` prevents stale `loadedmetadata` callbacks from older load cycles corrupting the FSM when tracks are skipped rapidly.
- **Listener ordering**: `loadedmetadata` listeners are added *before* calling `.load()` to avoid missing the event when the file is served from browser cache.
- **Proper cleanup**: all mount-effect event listeners are explicitly removed in the cleanup function.
- **LUFS AbortController**: each URL change cancels the previous in-flight LUFS fetch via `AbortController`.
- **Unified busy state**: `isBusy = status === 'loading' || status === 'switching'` is used consistently in the UI to disable controls and show the loading overlay.
