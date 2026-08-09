# Debt inventory — legacy, hardcodes, residual risk

Living list of known debt. Update when cleaning or discovering items.

## Legacy (keep for now)

| Item | Why kept | Notes |
|------|----------|-------|
| `*_url` columns beside `*_storage_path` | Back-compat for pre-R2 rows | Prefer path at read time |
| `supabase/schema.sql` | Early orders/products bootstrap | Prefer `init_all.sql` for full installs |
| `products` / `licenses` tables | Stripe-ready future digital goods | Not primary CMS path |
| Docs under `docs/admin-guide*.md` (incl. DE/ES) | Operator translations | **Code** remains English-only |

## Legacy (cleaned / forbidden)

| Item | Status |
|------|--------|
| Supabase Storage provider for app media | Removed — R2 only |
| TUS upload hooks | Removed — R2 multipart for audio |
| Payload CMS | Never reintroduce |

## Hardcode / config hotspots

| Location | Risk | Mitigation |
|----------|------|------------|
| Default bucket names `sonorativa-media` / `sonorativa-audio` | Env drift | Override via `R2_BUCKET_*` |
| `env.mjs` required set for tsc | Local without secrets fails | Use `.env.local.example` values for typecheck |
| Demo names in `mockData` / services | Looks real if fallback left on prod | `NEXT_PUBLIC_HIDE_DEMO_FALLBACK=true` on production |
| Partner logo proxy `wsrv.nl` | Third-party dependency for canvas CORS | Fail open to original image |

## Security residual

| Risk | Why remains | Mitigation |
|------|-------------|------------|
| Service role in admin actions | Required to manage all rows | `requireAdmin` + middleware; never to client |
| In-memory rate limits (if any) | Serverless multi-instance | Prefer edge/WAF for production contact spam |
| Signed audio URL leakage | Shareable while valid | Short TTL; private bucket |
| Admin cookie session | Standard web risk | HTTPS, Supabase Auth rotation |

## Follow-up (not blocking)

- [ ] Align outdated prose in `docs/architecture.md` storage diagram with R2 (agent docs are SSOT for agents)
- [ ] Generate and commit `database.types.ts` workflow if team wants typed rows
- [ ] Optional E2E smoke for public partners grids
- [ ] Formal performance budgets in CI

## Doc process debt

If agents skip living docs updates, product markdown rots. Enforcement is process-only (`AGENTS.md` + PR template) — treat violations as review blockers.
