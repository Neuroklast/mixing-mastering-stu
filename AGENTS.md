# SONORATIVA — Agent Guidelines

Next.js App Router studio site: public marketing site + admin CMS for mixing & mastering.
Stack: React 19, Supabase (PostgreSQL + Auth), Cloudflare R2, Vercel.

**Package manager:** npm only (`npm ci` in CI).

## Session start (read before coding)

1. **This file** — critical rules, checks, and docs closeout.
2. **Topic file** — open the matching `docs/agent/{topic}.md` from the table below for the area you touch.
3. **PRD.md** — only when the task is product/feature-shaped (not pure refactors/CI).
4. **End of session** — docs refresh is mandatory; follow [workflow.md](docs/agent/workflow.md).

Skipping specs and fixing CI later costs more than reading first.

## Mandatory checks (every code change)

Prefer the full local gate surface:

```bash
npx tsc --noEmit
npm test
npm run lint
```

Before opening a PR, also ensure:

```bash
npm run build
```

| Gate | Command | Rule |
|------|---------|------|
| Types | `npx tsc --noEmit` | **Must** pass cleanly before every commit. Husky pre-commit runs this. |
| Unit/integration | `npm test` | No regressions. |
| Storage ban | `npm run check:storage` | No Supabase Storage reintroduction. |
| Build | `npm run build` | Must succeed locally before PR. |
| E2E | `npm run test:e2e` | When user-facing flows changed. |

No PR with failing checks. No `as any`, `@ts-ignore`, or `eslint-disable` to silence errors (justify in a comment if truly required). **`--no-verify` is forbidden.**

## Mandatory docs update (end of every agent session)

**Always** refresh documentation and markdown before you declare work done, open a PR, or hand off — not only when the user asks. Treat docs as part of the deliverable, same as code.

1. Update every **stale** markdown that describes what you changed (agent specs, product docs, living docs).
2. Run the full end-of-session review in [workflow.md](docs/agent/workflow.md) (checklist of files).
3. When product behavior changed: [CHANGELOG.md](CHANGELOG.md), [QA_CHECKLIST.md](QA_CHECKLIST.md); when a reusable lesson appeared: [LESSONS_LEARNED.md](LESSONS_LEARNED.md).
4. New/changed patterns → matching `docs/agent/*.md`. Public surface / ops → `README.md`, `ADMIN.md`, `DEPLOYMENT.md`, `SECURITY.md` as applicable.

Skipping docs because “the task was only code” is a process failure.

## Critical rules (always apply)

- **Schema:** Only `supabase/init_all.sql` as the idempotent SSOT. Prefer folding changes there (no ad-hoc migration sprawl). See [supabase/DB_REQUIREMENTS.md](supabase/DB_REQUIREMENTS.md).
- **Backend:** Supabase is the sole backend — **no Payload CMS**. Services live in `services/*.ts`.
- **Storage:** **Cloudflare R2 only.** `lib/storage/index.ts` always returns `r2StorageProvider`. Do **not** restore Supabase Storage / TUS.
- **Paths, not URLs:** DB columns store object paths (e.g. `gallery/image-1234.jpg`), never full URLs. Prefer `*_storage_path` over legacy `*_url`.
- **Admin auth:** `/admin/*` protected by `middleware.ts` (session + `profiles.role = 'admin'`). Mutations use `requireAdmin()` + `createAdminClient()` (service role).
- **Service pattern:** Services check `isDev` first → mock data. Production → `createClient()` from `@/lib/supabaseServer`. Prefer `ServiceResult<T>` via `ok()` / `err()`.
- **Zod boundaries:** Parse all service/DB boundaries with schemas in `lib/schemas/*.ts`.
- **Supabase row fields:** Untyped — always `String(row.field ?? '')` (or `Number(...)`) when reading rows. No overlapping type assertions (`as string` when types do not overlap).
- **Language:** All code, comments, documentation, and admin UI strings must be **English**. No German strings in the codebase.
- **Env for tsc:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` (validated in `env.mjs`).
- **R2_PUBLIC_HOST:** Required on Vercel production (build-time `images.remotePatterns` in `next.config.mjs`).
- **Dev mode:** `NEXT_PUBLIC_DEV_MODE=true` → mocks only; **must never be true in production.**
- **Demo fallback:** Empty tables fall back to demo unless `NEXT_PUBLIC_HIDE_DEMO_FALLBACK=true`.
- **Minimal changes:** Smallest diff that fully solves the task. No speculative features (YAGNI).
- **Docs:** Always update documentation/markdown at session end (see above).

## Detailed guidelines

Read the relevant file before working in that area:

| Topic | File |
|-------|------|
| CI loop, docs maintenance, multi-agent | [workflow.md](docs/agent/workflow.md) |
| RSC/client, services, naming, conventions | [architecture.md](docs/agent/architecture.md) |
| Services, SSOT, R2 keys, DB schema | [data-and-schema.md](docs/agent/data-and-schema.md) |
| Tailwind, a11y, Lenis, sections, modals | [frontend.md](docs/agent/frontend.md) |
| Vitest, Playwright, perf | [testing-performance.md](docs/agent/testing-performance.md) |
| Admin auth, uploads, email, middleware | [backend.md](docs/agent/backend.md) |
| Public site + admin CMS features | [features.md](docs/agent/features.md) |
| Legacy / hardcode / security residual | [debt-inventory.md](docs/agent/debt-inventory.md) |

After introducing new patterns, update the relevant `docs/agent/*.md` file.

**Before finishing any session or opening a PR:** complete the mandatory docs update above and the end-of-session review in [workflow.md](docs/agent/workflow.md) — including [CHANGELOG.md](CHANGELOG.md), [LESSONS_LEARNED.md](LESSONS_LEARNED.md), and [QA_CHECKLIST.md](QA_CHECKLIST.md) when the session changed product behavior.

## External docs

[PRD.md](PRD.md) · [README.md](README.md) · [DEPLOYMENT.md](DEPLOYMENT.md) · [ADMIN.md](ADMIN.md) · [SECURITY.md](SECURITY.md) · [INTEGRATION-SUMMARY.md](INTEGRATION-SUMMARY.md) · [CHANGELOG.md](CHANGELOG.md) · [LESSONS_LEARNED.md](LESSONS_LEARNED.md) · [QA_CHECKLIST.md](QA_CHECKLIST.md) · [supabase/DB_REQUIREMENTS.md](supabase/DB_REQUIREMENTS.md) · [supabase/SETUP.md](supabase/SETUP.md) · [docs/development.md](docs/development.md) · [docs/cloudflare-r2.md](docs/cloudflare-r2.md) · [docs/operations.md](docs/operations.md) · [docs/admin-guide.md](docs/admin-guide.md)
