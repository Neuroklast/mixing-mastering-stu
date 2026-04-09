# Planning Guide

A professional mixing and mastering service showcase with an advanced audio comparison player featuring real-time multiband EQ visualization, allowing clients to hear before/after transformations of their music.

**Experience Qualities**: 
1. **Professional** - Conveys studio-grade expertise through precise typography, technical accuracy in audio visualization, and meticulous attention to detail
2. **Sophisticated** - Dark, elegant aesthetic with subtle animations and refined interactions that respect the user's focus
3. **Trustworthy** - Clear service information, transparent pricing, and high-quality audio demonstrations that build confidence

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This application requires advanced audio processing with Web Audio API integration, real-time FFT analysis for multiband visualization, state management for audio playback synchronization, and multiple interactive views for services, pricing, and portfolio demonstration.

## Essential Features

### Interactive Audio Comparison Player
- **Functionality**: Play audio samples with seamless switching between Original/Mixed/Mastered versions, synchronized playback position, real-time multiband EQ visualization (bass/low-mid/high-mid/treble/presence bands)
- **Purpose**: Demonstrates the tangible value of mixing/mastering services through direct A/B comparison
- **Trigger**: User clicks play on featured demo track or selects from sample library
- **Progression**: User clicks play → waveform animates → user toggles between versions via segmented control → playback continues from same timestamp → frequency bands visualize in real-time → user hears immediate quality difference
- **Success criteria**: Audio switches versions within <100ms with no audible gap, visualization updates at 60fps, playback position persists across version changes

### Service Packages Display
- **Functionality**: Three-tier service offering (Mixing, Mastering, Mix+Master Bundle) with detailed feature breakdown, turnaround times, revision policies, and CTA buttons
- **Purpose**: Clear presentation of offerings with transparent pricing to convert visitors into clients
- **Trigger**: User scrolls to services section or clicks navigation link
- **Progression**: User views section → scans package comparison → identifies needed service → clicks "Get Started" → contact form opens with service pre-selected
- **Success criteria**: Package differences are immediately clear, pricing is visible without hidden costs, mobile layout stacks cards elegantly

### Portfolio/Demo Library
- **Functionality**: Grid of before/after audio samples across different genres (Rock, Hip-Hop, Electronic, Jazz) with metadata (artist, genre, service type)
- **Purpose**: Showcases versatility and quality across musical styles, builds credibility
- **Trigger**: User navigates to portfolio section or clicks "Hear Samples"
- **Progression**: User browses genre tags → filters samples → clicks demo card → audio player loads with that track → comparison playback begins
- **Success criteria**: Samples load quickly, genre filtering is instant, audio quality is pristine (320kbps minimum)

### Contact/Booking Form
- **Functionality**: Multi-step form collecting project details (service type, genre, track count, timeline, file delivery method), with file upload capability for reference tracks
- **Purpose**: Streamlines client onboarding, gathers necessary project information upfront
- **Trigger**: User clicks any "Get Started" or "Book Now" CTA
- **Progression**: User clicks CTA → dialog opens → fills service selection → enters project details → optionally uploads reference → submits → confirmation message displays with next steps
- **Success criteria**: Form validates in real-time, supports drag-drop file upload, provides immediate confirmation

### About/Credentials Section
- **Functionality**: Brief bio, equipment list, major client logos/credits, certifications, studio photos
- **Purpose**: Establishes authority and expertise in audio engineering
- **Trigger**: User scrolls through landing page or clicks "About" navigation
- **Progression**: User reads credentials → views equipment → sees client logos → trust increases → returns to services
- **Success criteria**: Content is scannable, credentials are verifiable, doesn't feel boastful

## Edge Case Handling

- **No Audio Support**: Display fallback message with visual waveform comparison images for browsers without Web Audio API
- **Slow Network**: Progressive audio loading with buffer indicator, lower quality preview option
- **Mobile Audio Restrictions**: Show "Tap to enable audio" overlay on iOS/mobile browsers that require user gesture
- **Large File Uploads**: Chunked upload with progress bar, file size validation before upload starts
- **Form Abandonment**: Save draft form data to localStorage, restore on return visit
- **Accessibility Navigation**: Full keyboard control of audio player (spacebar play/pause, arrow keys for seeking, number keys for version switching)

## Design Direction

The design should evoke professional recording studio atmosphere—dark, focused, technical precision with subtle elegance. Think late-night studio sessions: deep blacks, cool grays, minimal color accents that recall studio LED indicators and audio meters. The interface should feel like professional audio software (Pro Tools, Logic) but more approachable. Emphasis on spaciousness, clarity, and technical sophistication without intimidation.

## Color Selection

Dark, monochromatic base with strategic accent colors that reference studio equipment aesthetics.

- **Primary Color**: Deep charcoal/near-black (`oklch(0.15 0.01 240)`) - Main backgrounds, evokes studio darkness and focus
- **Secondary Colors**: 
  - Medium gray (`oklch(0.35 0.01 240)`) for cards and elevated surfaces
  - Cool blue-gray (`oklch(0.45 0.02 240)`) for secondary UI elements
- **Accent Color**: Electric cyan (`oklch(0.70 0.15 220)`) - Recalls VU meter LEDs, used for CTAs, active states, and key interactive elements
- **Foreground/Background Pairings**: 
  - Background (Deep Charcoal `oklch(0.15 0.01 240)`): Light gray text (`oklch(0.92 0 0)`) - Ratio 11.2:1 ✓
  - Card (Medium Gray `oklch(0.35 0.01 240)`): White text (`oklch(0.98 0 0)`) - Ratio 9.8:1 ✓
  - Accent (Electric Cyan `oklch(0.70 0.15 220)`): Deep charcoal text (`oklch(0.15 0.01 240)`) - Ratio 8.5:1 ✓
  - Primary CTA (Cyan `oklch(0.70 0.15 220)`): Black text (`oklch(0.1 0 0)`) - Ratio 10.2:1 ✓

## Font Selection

Typography should convey technical precision and modern professionalism with excellent readability in dark UI contexts.

- **Primary Font**: Space Grotesk - Geometric sans-serif that balances technical feel with warmth, excellent for headings and key UI
- **Secondary Font**: Inter - Clean, highly legible system font for body text and controls
- **Monospace**: JetBrains Mono - For technical details like sample rates, file formats, timestamps

- **Typographic Hierarchy**:
  - H1 (Hero Title): Space Grotesk Bold / 48px desktop, 32px mobile / -0.02em letter-spacing / line-height 1.1
  - H2 (Section Headers): Space Grotesk Bold / 36px desktop, 28px mobile / -0.01em letter-spacing / line-height 1.2
  - H3 (Service Package Names): Space Grotesk Semibold / 24px / normal letter-spacing / line-height 1.3
  - Body Text: Inter Regular / 16px / normal letter-spacing / line-height 1.6
  - Small/Metadata: Inter Regular / 14px / normal letter-spacing / line-height 1.5
  - Technical Labels: JetBrains Mono Regular / 13px / normal letter-spacing / line-height 1.4

## Animations

Animations should feel precise and purposeful, like studio equipment responding to input—immediate feedback with subtle easing that suggests quality engineering.

- **Audio Visualizer**: Continuous 60fps FFT analysis animation with smooth interpolation between frequency values, subtle glow effect on peak frequencies
- **Version Switching**: 150ms cross-fade between audio states, segmented control slides with elastic easing
- **Waveform Progress**: Smooth scrubbing animation, playhead glides with momentum-based physics
- **Card Interactions**: Subtle lift on hover (2px translate-y) with 200ms ease-out, border glow on focus
- **Page Transitions**: Smooth scroll behavior, section reveals with fade-up (300ms) as they enter viewport
- **CTA Buttons**: Micro-interaction on click—scale(0.98) for 100ms then spring back, creates tactile feedback

## Component Selection

- **Components**:
  - **Card**: Service packages, demo track cards—dark background with subtle border, hover state with border glow
  - **Button**: Primary (cyan accent, bold), Secondary (outlined, muted), Ghost (text-only for navigation)
  - **Tabs**: For audio version switcher (Original/Mixed/Mastered)—styled as segmented control with sliding indicator
  - **Dialog**: Contact form, track info modals—centered overlay with backdrop blur
  - **Slider**: Audio scrubber, volume control—custom styled with cyan accent track
  - **Progress**: Audio buffering indicator—thin line at top of player
  - **Badge**: Genre tags, service type indicators—small, rounded, muted background
  - **Separator**: Section dividers—subtle, low-contrast horizontal rules
  - **Form** (Input, Textarea, Select): Dark styled with focus ring, inline validation

- **Customizations**:
  - **Audio Player Component**: Custom-built player with waveform canvas, multiband visualizer (5-band: 20-250Hz bass, 250-500Hz low-mid, 500-2kHz mid, 2-6kHz high-mid, 6-20kHz presence), transport controls
  - **Multiband Visualizer**: SVG-based bar chart updating in real-time via Web Audio API AnalyserNode, each band color-coded with gradient
  - **Waveform Display**: Canvas-rendered waveform from audio buffer, clickable for seeking
  - **Service Comparison Table**: Custom grid layout comparing package features with checkmarks/X icons

- **States**:
  - **Buttons**: Default (subtle gradient), Hover (brightness increase + border glow), Active (scale down), Focus (cyan ring), Disabled (50% opacity)
  - **Player Controls**: Play/Pause icon transition, loading spinner during buffer, disabled state when switching versions
  - **Form Inputs**: Default (border-input), Focus (cyan ring + border-accent), Error (red border + error text below), Success (green border + checkmark icon)

- **Icon Selection**:
  - **Play/Pause**: `Play`, `Pause` (player control)
  - **Audio Versions**: `Waveform`, `SlidersHorizontal`, `Sparkle` (Original, Mixed, Mastered indicators)
  - **Navigation**: `House`, `MusicNotes`, `Briefcase`, `Envelope`, `Info`
  - **Service Features**: `Check`, `X` (comparison table)
  - **Upload**: `Upload`, `File` (form)
  - **Social Proof**: `Star`, `Users`, `TrendUp` (testimonials/stats)

- **Spacing**:
  - **Container Max Width**: 1280px with px-4 mobile, px-6 tablet, px-8 desktop
  - **Section Padding**: py-16 mobile, py-24 desktop
  - **Card Padding**: p-6 mobile, p-8 desktop
  - **Component Gaps**: gap-4 for tight groups, gap-6 for standard spacing, gap-12 for section separation
  - **Typography Spacing**: mb-2 between label-input, mb-4 between form fields, mb-8 between subsections

- **Mobile**:
  - **Navigation**: Fixed bottom tab bar on mobile (<768px), horizontal nav at top on desktop
  - **Audio Player**: Stacked vertical layout on mobile (waveform → controls → version switcher → visualizer), horizontal split on desktop
  - **Service Cards**: Single column stack on mobile with full-width CTAs, 3-column grid on desktop (>1024px)
  - **Hero Section**: Centered content on mobile, split layout with visual on desktop
  - **Form**: Single-column on mobile, two-column for related fields on desktop
  - **Visualizer**: Simplified 3-band on mobile to reduce performance overhead, full 5-band on desktop
