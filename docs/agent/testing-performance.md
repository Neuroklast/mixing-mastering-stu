# Testing & Performance

## Unit & integration (Vitest)

```bash
npm test
npm run test:watch
```

| Area | Path |
|------|------|
| Unit | `tests/unit/**` |
| Integration (services) | `tests/integration/**` |
| Config | `vitest.config.ts` |

Rules:

- Mock external APIs; no network in unit tests
- Every new service: cover **dev mode** path and **empty DB + demo fallback** (and hide-fallback when applicable)
- Schema tests under `tests/unit/schemas/`
- Prefer `vi.resetModules()` when reading `process.env` flags (`isDev`, `hideDemoFallback`)

## E2E (Playwright)

```bash
npm run test:e2e
```

Specs: `tests/e2e/` (homepage, contact, admin CMS). Config: `playwright.config.ts`.

- `baseURL` from `NEXT_PUBLIC_SITE_URL` or `http://localhost:3000`
- Skip gracefully when credentials missing for authenticated flows
- When adding admin E2E, never commit real secrets

## Performance guidelines

| Concern | Guidance |
|---------|----------|
| Homepage | RSC data fetch once; dynamic import heavy client sections |
| Images | `next/image` + remotePatterns for R2 host |
| Audio | Stream via signed URLs; do not load multi-GB into memory on server |
| 3D hero | Lazy / dynamic; respect low-power devices |
| Partner logos | Cap canvas process size (max dim 512) |

No formal Lighthouse CI gate yet — still aim for stable LCP on hero and avoid layout shift on media.

## Coverage expectations

When adding modules > ~100 lines of non-UI logic (services, logo processing, upload helpers):

- [ ] Unit or integration tests added
- [ ] Happy path + failure/empty path
- [ ] Docs/QA checklist updated if user-visible

## Commands quick ref

| Command | Purpose |
|---------|---------|
| `npx tsc --noEmit` | Types |
| `npm test` | Vitest |
| `npm run lint` | ESLint + storage ban |
| `npm run build` | Production build |
| `npm run test:e2e` | Playwright |
