# Agent Workflow

Rules for AI agent runs on this project. Session start + mandatory CI live in `AGENTS.md`. Never open a PR with failing checks; no `as any` / `@ts-ignore` / `eslint-disable` to silence errors without a justified comment.

## Local CI (gate surface)

Same expectations as pre-commit + PR review, runnable locally:

| Script / command | What runs |
|------------------|-----------|
| `npx tsc --noEmit` | Strict TypeScript (includes `scripts/`) |
| `npm test` | Vitest unit + integration |
| `npm run lint` | ESLint + `check:storage` (no Supabase Storage) |
| `npm run build` | Production Next.js build |
| `npm run test:e2e` | Playwright (when flows changed) |

Prefer full typecheck + tests before every commit. Run `npm run build` before every PR.

## Pull requests

GitHub uses [`.github/pull_request_template.md`](../../.github/pull_request_template.md). Fill the docs checklist **when applicable** (see living docs below) — do not no-op edit docs just to tick boxes. Quality is enforced by agents following this workflow + review.

## Docs review (end of every session) — **always required**

Agents **must always** update documentation and relevant markdown files at the end of the session (or before every PR), as part of the same deliverable as code. Do not wait for the user to ask. “Code-only” handoffs that leave docs stale are incomplete.

**When:** After the feature/fix is implemented and checks pass; **before** you say the task is done, open a PR, or stop.

**What to do:**

1. Re-read what changed (diff / summary).
2. Update **every** markdown that would otherwise lie or omit the new behavior (table below).
3. Prefer small, accurate edits over large rewrites; do not invent product claims.
4. If nothing product-facing changed, still confirm living docs / agent specs need no touch — and note that briefly.

Review and update stale sections in:

| Area | Files |
|------|-------|
| Agent spec | `AGENTS.md`, `docs/agent/*.md` |
| Onboarding | `README.md`, `DEPLOYMENT.md`, `.env.local.example` |
| Product state | `PRD.md`, `INTEGRATION-SUMMARY.md`, `ADMIN.md`, `SECURITY.md` |
| Living docs | `CHANGELOG.md`, `LESSONS_LEARNED.md`, `QA_CHECKLIST.md` (see below) |
| Human ops guides | `docs/development.md`, `docs/operations.md`, `docs/cloudflare-r2.md`, `docs/admin-guide.md` when setup/ops changed |

Mandatory even when the task did not start as a docs task. New public APIs, components, or utilities → update the relevant `docs/agent/*.md` topic file (or JSDoc).

### Living docs (before every PR)

Update when applicable — pure typo/doc-only sessions with no product change may skip CHANGELOG/QA.

| File | When to update |
|------|----------------|
| `CHANGELOG.md` | User-facing features, API/route changes, security fixes, or breaking changes → add bullets under `[Unreleased]`. Skip internal refactors with no observable change. |
| `LESSONS_LEARNED.md` | Session uncovered a recurring anti-pattern, non-obvious failure mode, or process gap → append a dated entry under `## Session additions`. Promote to rule tables only after the pattern recurs. Skip one-off typos. |
| `QA_CHECKLIST.md` | New/changed user flows, auth guards, consent behavior, or E2E-covered features → add or adjust checklist items. Skip internal refactors that don't change testable behavior. |

**Minimal changes:** smallest diff that fully solves the requirement; no unrelated refactors; no new dependencies unless necessary.

## Multi-agent pattern (large tasks)

For tasks with >3 distinct concerns:

1. List sub-tasks in the PR description.
2. One atomic commit per sub-task.
3. Run typecheck + tests after each commit.

Prefer separate GitHub Issues per independent module (schema → service → UI). Mark blocking deps explicitly. Handoff comments must list exports and schema changes for dependent agents.

## Living spec

New conventions → update the matching `docs/agent/*.md` file. New topic → add file and link from `AGENTS.md`.

**Session closeout (non-negotiable):** code complete → mandatory checks → **docs/markdown update** → only then commit/PR or report done.
