# Frontend, UI & Accessibility

## Design tokens

Match existing CSS variables / Tailwind theme (dark studio aesthetic):

- Backgrounds: near-black surfaces (`background`, `card`, `secondary`)
- Accent: brand accent for CTAs and section underlines
- Typography: heading font + mono labels (`font-mono` uppercase tracking)

Do not invent a second palette. Prefer semantic tokens (`text-muted-foreground`, `border-border`, `bg-accent`) over one-off hex in new code.

## Public sections

| Section | Component | Data |
|---------|-----------|------|
| Hero | `HeroSection` + 3D scene | `siteContent` |
| Showcase player | `ClientMasteringPlayer` | `showcase` tracks |
| Discography credits | `CreditsSection` | `credits` |
| Partners & endorsements | `PartnersSection` | `partners` (logo grids) |
| Team | `MembersSection` | `members` |
| Reviews | `ReviewsSection` | `reviews` |
| Gallery | `GallerySection` | `gallery` |
| Footer | `Footer` | `siteContent` |

Section pattern:

- `container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-32`
- Mono uppercase `h2` + accent underline bar
- Empty state copy when no items

Wrap each section in `ErrorBoundary` on the homepage.

## Lenis smooth scroll

Public site uses Lenis via `LenisProvider`. Do not fight Lenis with nested full-page `overflow-y-auto` on the main document.

- Carousels / third-party scroll widgets → `data-lenis-prevent` if scroll capture conflicts
- Modal bodies that scroll → contain overflow and prevent background scroll

## WCAG 2.1 AA (mandatory on public UI)

- Visible focus styles on interactive controls
- Icon-only buttons need `aria-label`
- Touch targets ≥ 44px where practical (`min-h-[44px]` on tabs/buttons)
- Do not convey meaning by color alone
- Prefer reduced-motion respect for non-essential animation when adding heavy motion
- External links: `rel="noopener noreferrer"` + `target="_blank"` when opening new tab

## Images

- Prefer `next/image` for CMS photos with known domains
- `R2_PUBLIC_HOST` must be in `images.remotePatterns` (build-time)
- Partner white logos may use canvas + raw `<img>` for processed data URLs (see `partner-logo-white.ts`) — document any `eslint-disable` reason

## Modals

- Services / contact: `ServicesModal`, `ContactDialog` (Radix/shadcn dialog patterns)
- Controlled `open` / `onOpenChange`
- Focus trap provided by dialog primitive — do not break with nested portals without testing

## Admin UI

Admin chrome is denser, zinc-palette, English-only labels. Prefer existing inline style patterns / shared fields:

- `FormField`, `ImageUploadField`, `AudioUploadField`, `ConfirmDeleteButton`
- List pages: table + Edit + Delete
- New/edit pages under `new/` and `[id]/`

## Class names

- Use `cn()` from `lib/utils` for conditional classes
- Avoid one-off global CSS unless necessary

## Cookie / analytics consent

`CookieBanner` + `useConsent` gate analytics. Do not fire tracking before consent.

## Cross-references

- Features inventory → [features.md](./features.md)
- Uploads / audio → [backend.md](./backend.md)
