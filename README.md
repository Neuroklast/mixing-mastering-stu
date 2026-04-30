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
│   ├── layout.tsx             # Root layout (Server Component)
│   ├── page.tsx               # Homepage (Server Component)
│   ├── globals.css            # Tailwind v4 + SONORATIVA design tokens
│   ├── actions/               # Server Actions (thin orchestration layer)
│   │   ├── createOrder.ts     # → delegates to services/orderService
│   │   ├── uploadAudio.ts     # → delegates to services/fileService
│   │   └── generateSignedUrl.ts
│   └── (payload)/             # Payload CMS admin panel
│       └── admin-cms/         # Served at /admin-cms
├── components/
│   ├── features/              # Complex feature components (client-side)
│   │   ├── VideoBackground.tsx  # Lenis scroll-synced video
│   │   ├── Navbar.tsx
│   │   ├── HeroSection.tsx
│   │   ├── ServicesSection.tsx
│   │   ├── ServicesModal.tsx
│   │   ├── AudioPlayer.tsx      # Shell → useAudioPlayer hook
│   │   ├── FrequencyVisualizer.tsx
│   │   ├── UploadZone.tsx       # Shell → useUpload hook
│   │   ├── ContactDialog.tsx
│   │   ├── Footer.tsx
│   │   └── ErrorBoundary.tsx
│   └── ui/                    # Shadcn/UI primitives (no business logic)
├── collections/               # Payload CMS collections
│   ├── Users.ts               # Auth with roles (admin/engineer/client)
│   ├── Orders.ts              # Studio orders
│   └── Products.ts            # VST plugins / digital goods
├── hooks/                     # Reusable client-side logic
│   ├── useAudioPlayer.ts      # Audio playback + Web Audio API analyser
│   ├── useUpload.ts           # Upload state machine
│   ├── useLenis.ts            # Smooth scroll initialisation
│   └── useScrollProgress.ts   # Framer Motion scroll progress
├── services/                  # Data access layer (no UI logic)
│   ├── orderService.ts        # CRUD for orders table
│   ├── fileService.ts         # Supabase Storage + files table
│   └── productService.ts      # Read-only product queries
├── lib/
│   ├── supabaseServer.ts      # Server-side Supabase client (SSR cookies)
│   ├── supabaseClient.ts      # Browser Supabase client
│   ├── supabase.ts            # Singleton browser client
│   └── utils.ts               # cn() helper
├── types/
│   ├── index.ts               # Domain types (Order, AudioFile, Product, License)
│   ├── database.ts            # Supabase DB schema types
│   └── global.d.ts            # Global JSX namespace (React 19)
├── supabase/
│   └── schema.sql             # Full SQL schema with hardened RLS policies
├── tests/
│   ├── integration/           # Vitest – Zod schema unit tests
│   └── e2e/                   # Playwright – full user journey tests
├── env.mjs                    # Startup env validation (Zod)
├── payload.config.ts          # Payload CMS configuration
├── next.config.mjs            # Next.js + withPayload plugin
├── postcss.config.js          # Tailwind v4 PostCSS plugin
└── .env.local.example         # All required environment variables
```

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

## Admin CMS

Payload CMS admin panel: `http://localhost:3000/admin-cms`

Manage orders, products (VST plugins), and users from a fully type-safe headless CMS backed by Supabase PostgreSQL.
