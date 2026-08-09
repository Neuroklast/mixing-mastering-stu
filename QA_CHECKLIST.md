# Pre-Release QA Checklist

Use before production deploys or major PRs. Agents: add items when user-testable flows change (`docs/agent/workflow.md`).

## Functional tests

### Public homepage

- [ ] Hero renders titles/CTAs from CMS (or defaults)
- [ ] 3D/hero model loads or fails gracefully
- [ ] Showcase player: track list, before/after switch, no uncaught errors when empty
- [ ] Credits: filters, featured cards, search
- [ ] Partners & endorsements: grids for each non-empty category; links open in new tab
- [ ] Members: featured + grid; social links
- [ ] Reviews: ratings/text visible for active only
- [ ] Gallery: images load from R2 public host
- [ ] Services modal opens packages
- [ ] Contact dialog submits (or shows validation errors)
- [ ] Footer legal links work
- [ ] Cookie banner accept/reject; analytics only after consent

### Review invite

- [ ] Valid token form works
- [ ] Invalid/expired token shows safe error

### Admin

- [ ] Login / logout
- [ ] Non-admin cannot access `/admin`
- [ ] Dashboard counts load
- [ ] CRUD smoke: content, showcase, gallery, members, services, reviews, credits, partners, legal
- [ ] Image upload → path stored → preview URL works
- [ ] Audio multipart upload completes; paths saved on showcase
- [ ] Partners admin: create logo entry, appears on public section when active
- [ ] Delete confirms and removes row

## Security

- [ ] `SUPABASE_SERVICE_ROLE_KEY` not present in client bundles
- [ ] Direct `/admin/*` without session redirects to login
- [ ] RLS: anon cannot write CMS tables
- [ ] Private audio not listable as public objects
- [ ] `NEXT_PUBLIC_DEV_MODE` is false/unset in production

## Accessibility (WCAG 2.1 AA smoke)

- [ ] Keyboard reach primary nav, modals, player controls
- [ ] Focus visible on interactive elements
- [ ] Icon buttons have accessible names
- [ ] Images have alt text where meaningful
- [ ] No essential info by color alone

## Responsive

- [ ] Mobile nav / menus
- [ ] Player usable on narrow viewports
- [ ] Partner logo grids reflow (2→6 columns)
- [ ] Admin tables scroll horizontally if needed

## Performance smoke

- [ ] Homepage interactive without multi-second freeze
- [ ] Heavy sections do not block first paint forever
- [ ] Large audio not downloaded until play

## Storage / media

- [ ] `R2_PUBLIC_HOST` set; `next/image` serves media
- [ ] DB stores paths, not ephemeral signed URLs, for media
- [ ] `npm run check:storage` passes (no Supabase Storage regressions)

## Environment / demo content

- [ ] Production: demo fallback policy decided (`HIDE_DEMO_FALLBACK`)
- [ ] No accidental demo badge on production unless intended

## GDPR & consent

- [ ] Cookie banner present
- [ ] Privacy/legal pages linked
- [ ] Analytics gated by consent

## Documentation

- [ ] `CHANGELOG.md` `[Unreleased]` updated if user-facing
- [ ] `QA_CHECKLIST` / agent docs updated if new flows
- [ ] `DEPLOYMENT.md` env list still accurate

## Test execution

- [ ] `npx tsc --noEmit`
- [ ] `npm test`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm run test:e2e` (or documented skip reason)

## Schema parity

- [ ] Live Supabase has tables from `init_all.sql` including `partners`
- [ ] Admin profile role is `admin`
