# Lessons Learned

Recurring anti-patterns and non-obvious failure modes.  
Agents: append dated entries under **Session additions** when a reusable lesson appears; promote to tables only after the pattern recurs (`docs/agent/workflow.md`).

## Database & schema

| Lesson | Detail |
|--------|--------|
| One idempotent SSOT | Prefer folding schema into `init_all.sql` over migration sprawl |
| Paths not URLs | Store R2 object keys; resolve URLs at read time |
| Dual columns | Prefer `*_storage_path` over legacy `*_url` |
| RLS + service role | Public read via RLS; admin writes via service role after `requireAdmin` |

## Storage

| Lesson | Detail |
|--------|--------|
| R2 only | Supabase Storage / TUS must not return |
| Multipart for audio | Large WAVs never stream through Next body |
| `R2_PUBLIC_HOST` at build | Missing host → `next/image` 400 in production |
| Signed audio TTL | Private bucket; regenerate URLs when serving player |

## TypeScript & services

| Lesson | Detail |
|--------|--------|
| Untyped rows | Always `String(row.x ?? '')` / Zod parse |
| No silence | No `@ts-ignore` / `as any` to pass CI |
| Dev flag | `isDev` short-circuits network — never true in prod |
| Demo fallback | Empty tables look “full” unless hide-demo env set |

## Frontend

| Lesson | Detail |
|--------|--------|
| Section isolation | `ErrorBoundary` per homepage section |
| Partner logos | White silhouette needs canvas + CORS-safe load; white-box PNGs need luminance alpha |
| Lenis | Avoid nested page-level scroll containers fighting Lenis |

## Auth

| Lesson | Detail |
|--------|--------|
| Dual gate | Middleware + `requireAdmin` on actions |
| Role source | `profiles.role = 'admin'` — Auth alone is not enough |

## Documentation

| Lesson | Detail |
|--------|--------|
| Living docs | Code-only sessions leave PRD/QA/CHANGELOG lying — closeout is mandatory |
| English only | No German in code/admin UI; translated guides may live under `docs/` as human extras |

## Session additions

### 2026-08-09 — Partners section only (not full Zardonic admin)

- Requested scope: **public Partners & Endorsements logo grids only** — not Zardonic admin rewrite (bio/releases/gigs/merch/…) and not a new Partners admin menu.
- Keep discography `credits` separate from logo-grid `partners`.
- White logo processing: never CSS-invert opaque white plates; use `processLogoToWhiteSilhouette` + CORS-safe canvas load.
- Closed PR #75 (full admin port) as out of scope.

