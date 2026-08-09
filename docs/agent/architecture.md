# Architecture & Code Conventions

## Core principles

- No god-object files — split UI, hooks, and services into focused modules
- Strict TypeScript — no `any` in production code or test mocks
- Dynamic import heavy client UI (`next/dynamic`) for 3D, players, large sections
- Reuse hooks/utilities; prop-drill at most two levels
- Prefer native HTML/JS over heavy NPM packages when practical
- No speculative features (YAGNI)

## High-level layout

```
Browser
  │
  ├─ Public pages (RSC) ──► services/*.ts ──► Supabase (anon, RLS)
  │                              │
  │                              └─ R2 paths → getPublicUrl / signed URLs
  │
  ├─ Admin (/admin/*) ──► middleware (auth + role)
  │         │
  │         └─ Server Actions ──► createAdminClient() (service role)
  │                    │
  │                    └─ signed upload URLs → browser PUT → R2
  │
  └─ Contact / orders ──► server actions ──► Supabase + optional Resend
```

## Server vs client components

Default to RSC. Add `"use client"` only for event handlers, browser APIs, hooks, Framer Motion, Lenis, audio engine, or canvas logo processing.

Pattern: RSC parent fetches via services → client leaf animates/interacts.

Homepage (`app/page.tsx`) is a Server Component that loads showcase, credits, partners, members, reviews, gallery, and site content, then passes props into dynamically imported client sections.

## Services layer (`services/`)

| Rule | Detail |
|------|--------|
| Entry | One service file per domain (`showcaseService`, `partnersService`, …) |
| Dev | `if (isDev) return ok(DEMO_*)` |
| Prod | `createClient()` from `@/lib/supabaseServer` |
| Result | Prefer `ServiceResult<T>` via `ok` / `err` from `@/lib/serviceResult` |
| Schema | Map rows through `lib/schemas/*.ts` before returning |
| Empty | Demo fallback unless `hideDemoFallback` |

Do **not** query Supabase from client components for public content. Admin pages may use `createAdminClient()` for list/edit UIs.

## Error handling

- Public homepage sections wrap in `ErrorBoundary` so one section failure does not take down the page.
- Service failures → `err(message)` or empty arrays depending on caller contract.
- Admin actions: `requireAdmin()` then throw user-safe `Error` messages; log DB errors server-side.

## Naming & structure

| Kind | Convention | Example |
|------|------------|---------|
| Components | `PascalCase.tsx` | `PartnersSection.tsx` |
| Hooks | `useCamelCase.ts` | `useR2MultipartUpload.ts` |
| Services | `*Service.ts` | `creditsService.ts` |
| Schemas | `lib/schemas/*.ts` | `partner.ts` |
| Admin actions | `_actions.ts` next to route | `app/admin/(protected)/credits/_actions.ts` |
| Tests | `tests/unit`, `tests/integration`, `tests/e2e` | |

`@/` → project root (see `tsconfig.json`).

## UI stack

- Tailwind CSS v4 (`@theme` in CSS)
- Shadcn-style primitives under `components/ui/`
- Framer Motion for section motion
- Lenis via `LenisProvider`
- Phosphor icons

Do not invent a second design system. Match existing section patterns (`container max-w-7xl`, mono uppercase headings, accent underline).

## Package manager

npm only. No yarn/pnpm lock files.

## State management

No global Redux/Zustand. Server state → RSC + services. Shared UI → React context (`ScrollProgressContext`, consent). Forms → native form actions or local `useState`.

## Cross-references

- Data / R2 / schema → [data-and-schema.md](./data-and-schema.md)
- Admin uploads / auth → [backend.md](./backend.md)
- Public UI / a11y → [frontend.md](./frontend.md)
- Product surfaces → [features.md](./features.md)
