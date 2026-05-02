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
├── components/
│   ├── features/              # Complex feature components (client-side)
│   │   ├── VideoBackground.tsx  # Lenis scroll-synced video
│   │   ├── Navbar.tsx
│   │   ├── HeroSection.tsx
│   │   ├── ServicesSection.tsx
│   │   ├── ServicesModal.tsx   # Uses BaseModal (variant="wide")
│   │   ├── ContactDialog.tsx   # Uses BaseModal (variant="center")
│   │   ├── CookieBanner.tsx    # GDPR cookie notice (localStorage persistence)
│   │   ├── MasteringPlayer.tsx # A/B player with Tooltip controls, unified isBusy state
│   │   ├── PlaylistPlayer.tsx  # Multi-track playlist navigation
│   │   ├── SpectrumAnalyser.tsx
│   │   ├── MultibandMeter.tsx
│   │   ├── AudioPlayer.tsx
│   │   ├── FrequencyVisualizer.tsx
│   │   ├── UploadZone.tsx
│   │   ├── Footer.tsx          # Legal links + copyright
│   │   └── ErrorBoundary.tsx
│   └── ui/                    # Shadcn/UI primitives (no business logic)
│       ├── base-modal.tsx     # ★ Single source of truth for modal design
│       ├── tooltip.tsx        # Radix Tooltip primitive
│       ├── dialog.tsx
│       └── …
├── hooks/
│   ├── useAudioEngine.ts      # FSM audio engine (generation-guarded load callbacks,
│   │                          #   AbortController LUFS, proper listener cleanup)
│   └── …
├── services/                  # Data access layer (no UI logic)
├── lib/
│   ├── constants.ts           # Central terminology + tooltip copy (SSOT)
│   └── …
├── tests/
│   ├── integration/           # Vitest – Zod schema + service unit tests
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

```bash
# 1. Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase and Payload credentials

# 2. Install dependencies
npm install

# 3. Run database migrations (Supabase dashboard or CLI)
# Execute: supabase/schema.sql

# 4. Start development server
npm run dev
```

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

## Testing

```bash
# Integration tests (Zod schema validation)
npm test

# E2E tests (requires running dev server)
npm run test:e2e
```

## Legal

Legal pages are server-rendered under `/legal/`:

- `/legal/privacy` – Privacy Policy (GDPR compliant)
- `/legal/terms` – Terms of Service

Both pages are linked from the site footer and the cookie consent banner.

## Admin CMS

Payload CMS admin panel: `http://localhost:3000/admin-cms`

Manage orders, products (VST plugins), and users from a fully type-safe headless CMS backed by Supabase PostgreSQL.

## Audio Player

The `useAudioEngine` hook manages a Web Audio API FSM with states `idle | loading | ready | playing | paused | switching | error`.

Key correctness guarantees:
- **Load generation guard**: a monotonic `loadGenerationRef` prevents stale `loadedmetadata` callbacks from older load cycles corrupting the FSM when tracks are skipped rapidly.
- **Listener ordering**: `loadedmetadata` listeners are added *before* calling `.load()` to avoid missing the event when the file is served from browser cache.
- **Proper cleanup**: all mount-effect event listeners are explicitly removed in the cleanup function.
- **LUFS AbortController**: each URL change cancels the previous in-flight LUFS fetch via `AbortController`.
- **Unified busy state**: `isBusy = status === 'loading' || status === 'switching'` is used consistently in the UI to disable controls and show the loading overlay.

