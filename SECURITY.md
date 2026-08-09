# Security Policy — SONORATIVA

## Supported versions

| Version | Supported |
|---|---|
| `main` branch | ✅ |
| Older branches | ❌ |

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report privately via GitHub private vulnerability reporting (if enabled) or maintainer contact channels for this repository.

Include:

- Type of issue (XSS, broken auth, IDOR, etc.)
- Affected files / routes
- Steps to reproduce
- Potential impact

## Security practices

- **Row-Level Security (RLS)** on CMS/public tables. Public policies typically allow `SELECT` only for active content. Writes go through **service role** in admin Server Actions after `requireAdmin()`.
- **Admin protection** at Edge Middleware (`middleware.ts`): session required; `profiles.role` must be `admin`. Mutations call `requireAdmin()` again.
- **Service role key** (`SUPABASE_SERVICE_ROLE_KEY`) never prefixed with `NEXT_PUBLIC_`; never sent to the browser.
- **Anon key** is public by design; authority is RLS.
- **R2 credentials** stay server-side; browser receives **signed upload/download URLs** only.
- **Private audio** (`sonorativa-audio`): signed download URLs with TTL — not permanent public objects.
- **Paths not secrets in DB:** media columns store object keys; do not store long-lived credentials.
- **Env validation** via Zod (`env.mjs`) for required bootstrap vars.
- **Dev mode** must never be enabled in production (`NEXT_PUBLIC_DEV_MODE=true` short-circuits services to mocks and is unsafe as a “prod toggle”).
- **Demo fallback:** disable on production with `NEXT_PUBLIC_HIDE_DEMO_FALLBACK=true` so empty tables do not look like client work.
- Dependencies: run `npm audit` before adding packages; keep lockfile intentional.

## Known residual risks

| Risk | Why it remains | Mitigation / follow-up |
|------|----------------|------------------------|
| Service role in admin actions | Required for CMS writes | Dual gate: middleware + `requireAdmin` |
| Contact spam | Public form | Validation + optional rate limits / honeypot; WAF |
| Signed URL sharing | URL valid until expiry | Short TTL; private bucket |
| Third-party logo proxy (`wsrv.nl`) | Canvas CORS for white logos | Fail open; only for public logo assets |
| Untyped Supabase rows | No generated `database.types.ts` required | Zod parse at boundaries; `String(row.x ?? '')` |

Debt tracking: [docs/agent/debt-inventory.md](docs/agent/debt-inventory.md).

## CSRF

Server Actions in App Router enforce same-origin checks via `Origin`. Do not add conflicting CSRF middleware that breaks Server Actions. Admin cookie auth is not replaced by Bearer tokens in this app.

## Upload limits

| Path | Guidance |
|------|----------|
| Images (signed PUT) | Practical limit ~100 MB; MIME whitelist in upload field |
| Audio multipart | Multi-GB capable via R2 multipart; chunk ~6 MB |
| Never | Stream multi-GB through Next.js request body as default path |

## Auth failure modes

| Condition | Behavior |
|-----------|----------|
| No session on `/admin/*` | Redirect `/admin/login` |
| Session but non-admin | Redirect forbidden |
| Missing Supabase env in middleware | Fail closed → login |

## Related

- [DEPLOYMENT.md](DEPLOYMENT.md)
- [docs/agent/backend.md](docs/agent/backend.md)
- [AGENTS.md](AGENTS.md)
