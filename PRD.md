# Planning Guide

An industrial-grade professional mixing and mastering service platform with modal-based navigation, featuring an advanced audio comparison player with real-time multiband frequency visualization. Inspired by modern industrial web aesthetics with subtle CRT effects, vignetting, and scanlines for a distinctive technical character.

**Experience Qualities**: 
1. **Industrial & Technical** - Raw, precise aesthetic with bold typography, minimal radius, and technical UI elements that convey professional-grade engineering
2. **Focused & Immersive** - Modal-based architecture eliminates distractions, full-screen overlays for deep engagement with audio demos and services
3. **Refined & Subtle** - Sophisticated visual effects (vignette, scanlines, grain) applied with restraint for atmospheric depth without overwhelming content

**Complexity Level**: Complex Application (advanced functionality with modal architecture)
This application requires Web Audio API integration for real-time FFT analysis, sophisticated state management for synchronized audio playback across multiple tracks, framer-motion for smooth modal transitions, and custom React hooks for audio context management following SOLID principles.

## Essential Features

### Interactive Audio Comparison Player
- **Functionality**: Real-time A/B/C switching between Original/Mixed/Mastered versions with synchronized playback, 5-band frequency spectrum analyzer with live visualization
- **Purpose**: Provides immediate, tangible proof of mixing/mastering value through direct audio comparison
- **Trigger**: User opens Demo modal from hero CTA or navigation
- **Progression**: Modal opens with scale animation → User clicks demo track → Player initializes → Frequency analyzer activates → User switches versions via badge interface → Audio seamlessly continues from same timestamp → Visual feedback shows frequency changes
- **Success criteria**: <100ms version switching, no playback gaps, 60fps spectrum animation, position persistence across versions

### Modal Navigation Architecture
- **Functionality**: Full-screen modals for Demo, Services, and About sections with smooth enter/exit animations, backdrop blur, and escape-key dismissal
- **Purpose**: Creates focused, distraction-free experiences for each major section while maintaining simple hero landing page
- **Trigger**: User clicks navigation items or hero CTAs
- **Progression**: User clicks nav item → Page darkens with backdrop → Modal scales in from center → User interacts with content → User clicks X or backdrop → Modal scales out → Returns to hero
- **Success criteria**: Smooth 300ms spring animations, backdrop prevents scroll-through, modals are fully accessible via keyboard

### Service Packages Display
- **Functionality**: Three-tier offering (Mixing, Mastering, Mix+Master) with feature checkboxes, pricing, turnaround times, "Best Value" highlighting
- **Purpose**: Clear service comparison with transparent pricing to drive conversion
- **Trigger**: User opens Services modal
- **Progression**: Modal opens → User scans packages side-by-side → Identifies features → Clicks "Get Started" → Contact dialog opens with service pre-selected
- **Success criteria**: Instant visual hierarchy, mobile stacks vertically, desktop displays 3-column grid

### Contact/Booking System
- **Functionality**: Persistent contact dialog with service selection, project details form (genre, track count, timeline), data stored via useKV hook
- **Purpose**: Streamlines client onboarding with structured project information collection
- **Trigger**: Any "Get Started" or "Contact" CTA
- **Progression**: Dialog opens → User selects service → Fills project details → Submits → Data persists to useKV → Toast confirmation appears
- **Success criteria**: Real-time validation, form data persistence, accessible form labels

### About/Credentials Section
- **Functionality**: Studio experience, equipment highlights, statistics (turnaround, tracks completed, satisfaction), CTA to start project
- **Purpose**: Builds credibility and trust through verifiable credentials
- **Trigger**: User clicks About in navigation
- **Progression**: Modal opens → User reads credentials → Views stats → Gains confidence → Clicks CTA to contact
- **Success criteria**: Scannable layout, emphasis on key metrics, clear path to action

## Edge Case Handling

- **No Web Audio API Support**: Graceful degradation with static frequency bars, playback still functional via HTML5 Audio
- **Mobile Audio Autoplay Restrictions**: Initial play requires user gesture, clear play button with hover state
- **Slow Network**: Audio preloading with metadata, duration available before full download
- **Browser Compatibility**: Feature detection for backdrop-filter, fallback to solid backgrounds
- **Keyboard Navigation**: All modals close with Escape, focus trapped within open modal, tab order logical
- **Screen Readers**: ARIA labels on all interactive elements, modal announces when opened, frequency bands labeled

## Design Direction

Industrial, technical, and uncompromisingly professional. The aesthetic should feel like specialized audio engineering software or high-end studio control rooms—dark environments with glowing accents, precise geometry, and technical typefaces. Subtle atmospheric effects (CRT scanlines, film grain, vignette) add character without kitsch. Bold typography with tight tracking and minimal border radius reinforces the technical, no-nonsense character. Think modern industrial design meets boutique audio equipment.

## Color Selection

Deep, near-black backgrounds with high-chroma cyan-green accent creating stark technical contrast.

- **Primary Color (Background)**: Rich black (`oklch(0.08 0.01 240)`) - Studio darkness, focus-inducing environment
- **Secondary Colors**: 
  - Card surfaces (`oklch(0.12 0.015 240)`) - Slightly elevated elements
  - Muted backgrounds (`oklch(0.16 0.02 240)`) - Secondary surfaces
  - Borders (`oklch(0.22 0.02 240)`) - Subtle separation
- **Accent Color**: Bright cyan-green (`oklch(0.75 0.20 160)`) - High-tech LED aesthetic, used for CTAs, active states, frequency visualization. This color channels modern studio equipment indicators and terminal UI.
- **Foreground/Background Pairings**: 
  - Background (`oklch(0.08 0.01 240)`): Light gray text (`oklch(0.95 0.01 220)`) - Ratio 13.8:1 ✓
  - Card (`oklch(0.12 0.015 240)`): Light gray text (`oklch(0.95 0.01 220)`) - Ratio 12.5:1 ✓
  - Accent (`oklch(0.75 0.20 160)`): Dark text (`oklch(0.08 0.01 240)`) - Ratio 12.1:1 ✓
  - Muted text (`oklch(0.55 0.01 240)`): on background - Ratio 6.8:1 ✓

## Font Selection

Industrial, technical typography with tight spacing and geometric forms that convey precision.

- **Primary Font**: Space Grotesk - Geometric sans with industrial character, condensed letter-spacing for headings
- **Secondary Font**: Inter - Clean, legible system font for body copy and UI
- **Monospace**: JetBrains Mono - Technical details, timestamps, file formats, metadata

- **Typographic Hierarchy**:
  - H1 (Hero Title): Space Grotesk Bold / 80px desktop, 48px mobile / -0.02em letter-spacing / line-height 0.9 / uppercase
  - H2 (Section Headers): Space Grotesk Bold / 36px / -0.02em letter-spacing / line-height 1.1 / uppercase / tracking-tighter
  - H3 (Card Titles): Space Grotesk Bold / 20px / -0.01em / uppercase
  - Body Text: Inter Regular / 16px / normal letter-spacing / line-height 1.6
  - Small Text: Inter Regular / 14px / font-mono for technical contexts
  - Labels: Inter Medium / 12px / uppercase / wide tracking (0.08em)

## Animations

Precise, mechanical animations that suggest quality engineering and professional equipment response.

- **Modal Entrance**: Scale from 0.95 to 1.0 with spring physics (damping: 25, stiffness: 300), simultaneous opacity fade
- **Backdrop**: Fade to 95% opacity over 200ms ease-out
- **Frequency Visualizer**: 100ms transition between bar heights, subtle glow pulse on peaks over 60% amplitude
- **Button Interactions**: Scale to 1.05 on hover (200ms ease-out), 0.95 on active (100ms), crisp spring-back
- **Version Switching**: Badge highlights with border glow (150ms), audio cross-fade implied by UI (actual switching instant)
- **Page Load**: Hero content staggers in with 100ms delays (badge → title → description → buttons)
- **Hover States**: Subtle accent glow on borders (box-shadow transition 200ms ease-out)

## Animations

Animations should feel precise and purposeful, like studio equipment responding to input—immediate feedback with subtle easing that suggests quality engineering.

- **Audio Visualizer**: Continuous 60fps FFT analysis animation with smooth interpolation between frequency values, subtle glow effect on peak frequencies
- **Version Switching**: Instant audio switching with synchronized UI feedback via badge highlight
- **Modal Transitions**: Spring-based scale and opacity animations (300ms) with backdrop blur
- **Button Interactions**: Scale micro-interactions (hover: 1.05, active: 0.95) with 200ms ease-out
- **Card Interactions**: Subtle border glow on hover (200ms), emphasis on interactive elements
- **Scroll Behavior**: Smooth scrolling within modals, momentum preserved

## Component Selection

- **Components**:
  - **Card**: Service packages, audio players—minimal border radius (0.25rem), dark backgrounds, border glow on hover
  - **Button**: Accent (cyan bg, dark text, glow effect), Outline (accent border, hover glow), Icon (minimal, accent on hover)
  - **Badge**: Version switcher (Original/Mixed/Mastered), genre tags—small, uppercase mono, cursor pointer
  - **Dialog**: Contact form, overlays with backdrop blur and border
  - **Modal**: Full-screen content overlays for Demo/Services/About with close button, animated entrance
  - **Slider**: Audio seek bar, volume—custom styled with accent track and handle
  - **Separator**: Minimal horizontal rules for content separation
  - **Form**: Inputs, selects, textareas with dark styling, mono labels, accent focus rings

- **Customizations**:
  - **Audio Player Component**: Custom component with version badges, transport controls, time display (mono font), frequency analyzer section
  - **Frequency Visualizer**: 5 vertical bars (Bass, Low Mid, Mid, High Mid, Treble) with gradient fills and dynamic height based on FFT data
  - **Navigation**: Minimal top nav with logo, centered links (mono uppercase), mobile hamburger
  - **Hero Section**: Centered layout with massive title, grid/scan line background pattern (CSS), subtle vignette overlay
  - **Modal Container**: Custom full-screen overlay with close button, scrollable content area, click-outside-to-close

- **States**:
  - **Buttons**: Default (subtle gradient), Hover (scale 1.05 + glow), Active (scale 0.95), Focus (accent ring), Disabled (50% opacity)
  - **Audio Player**: Playing (animated bars), Paused (static bars), Loading (skeleton), Version Active (badge highlight)
  - **Form Inputs**: Default (border-input), Focus (accent ring + border), Error (red border + message), Filled (subtle checkmark)
  - **Modal**: Opening (scale up), Open (scale 1), Closing (scale down, opacity out)

- **Icon Selection** (Phosphor Icons, bold weight):
  - **Audio**: Waveform (logo/brand), Play, Pause, SpeakerHigh (volume)
  - **Navigation**: List (mobile menu), X (close modal)
  - **Actions**: Envelope (contact), Briefcase (services), Play (demo CTA)
  - **Features**: Check (included), X (not included)

- **Spacing**:
  - **Container Max Width**: 1280px with px-4 mobile, px-6 tablet, px-8 desktop
  - **Section Padding**: py-16 mobile, py-24 desktop within modals
  - **Card Padding**: p-6 mobile, p-8 desktop
  - **Component Gaps**: gap-4 (tight), gap-6 (standard), gap-8 (sections)
  - **Grid Spacing**: grid gap-6 on mobile, gap-8 on desktop

- **Mobile**:
  - **Navigation**: Top nav collapses to hamburger <768px, dropdown menu with backdrop
  - **Modals**: Full-screen on all viewports, scrollable content area
  - **Audio Player**: Vertical stack (title/artist → version badges → controls → visualizer)
  - **Service Cards**: Single column stack, full-width CTAs
  - **Hero Text**: Reduced font sizes (48px title), maintained uppercase style
  - **Frequency Visualizer**: Full 5-band retained for mobile (performant with Web Audio API)
