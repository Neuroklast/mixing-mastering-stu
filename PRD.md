# Planning Guide

A professional audio engineering website for SONORATIVA featuring scroll-controlled video animation with Lenis smooth scroll, where video playback speed and progression are synchronized with scroll position. Red and black color scheme for a bold, modern aesthetic.

**Experience Qualities**:
1. **Cinematic** - Immersive scroll-driven video experience that creates a film-like presentation
2. **Fluid** - Buttery-smooth Lenis scrolling that feels natural and responsive
3. **Synchronized** - Precise coordination between scroll position and video playback for seamless storytelling

**Complexity Level**: Light Application (multiple features with basic state)
This app combines smooth scrolling mechanics with video synchronization and audio engineering service presentation, maintaining manageable complexity while delivering an engaging experience.

## Essential Features

### Lenis Smooth Scroll Integration
- **Functionality**: Implements Lenis smooth scroll library for momentum-based, buttery scrolling
- **Purpose**: Creates a premium, fluid browsing experience that enhances engagement
- **Trigger**: Automatically activated on page load
- **Progression**: User scrolls → Lenis interpolates scroll position → Smooth momentum-based animation
- **Success criteria**: Scrolling feels natural with easing, no janky frame drops

### Scroll-Controlled Video Playback
- **Functionality**: Video playback position directly mapped to scroll progress, playing forward/backward based on scroll direction with optimized performance
- **Purpose**: Creates an interactive storytelling experience synchronized with user exploration
- **Trigger**: User scrolls the page
- **Progression**: User scrolls down → Video plays forward proportionally → User scrolls up → Video plays backward → Seamless bidirectional control with optimized frame updates
- **Success criteria**: Video frame updates match scroll position precisely, smooth 60fps performance, no lag or stuttering, efficient RAF usage

### Video-Inspired Color Palette
- **Functionality**: Website theme using bold red and black color scheme
- **Purpose**: Creates a striking, modern, and professional visual identity for SONORATIVA
- **Trigger**: Applied globally to all UI elements
- **Progression**: Red accent colors highlight key actions → Black backgrounds provide depth → High contrast ensures readability
- **Success criteria**: Bold visual experience with excellent contrast and readability

### Service Presentation
- **Functionality**: Audio engineering services displayed with demo player, packages, and contact form
- **Purpose**: Convert visitors into clients through clear service presentation
- **Trigger**: User navigates to service sections or clicks CTAs
- **Progression**: User explores hero → Views services → Tries demo → Contacts for booking
- **Success criteria**: Clear value proposition with smooth modal transitions

## Edge Case Handling

- **Video Loading State** - Display placeholder or loading indicator while video loads
- **Scroll Performance** - Throttle/optimize video frame updates to prevent performance issues on slower devices
- **Mobile Touch Scrolling** - Ensure Lenis works smoothly with touch-based scrolling gestures
- **Browser Compatibility** - Fallback for browsers that don't support smooth scrolling or video playback
- **Video Decode Errors** - Graceful degradation if video fails to load or decode

## Design Direction

The design should evoke a sense of precision, power, and technical sophistication - matching the bold aesthetic of professional audio engineering. Red and black create a striking, memorable brand identity. The scroll experience should feel like operating high-end equipment: responsive, precise, and premium.

## Color Selection

Red and black color scheme for a bold, striking, and modern aesthetic:

- **Primary Color**: Deep black `oklch(0.15 0.01 0)` - Represents sophistication and professional precision
- **Secondary Colors**: Pure black backgrounds `oklch(0.08 0.01 0)` for depth, dark charcoal `oklch(0.22 0.02 0)` for secondary surfaces
- **Accent Color**: Vibrant red `oklch(0.55 0.22 25)` - Bold highlight for CTAs and interactive elements
- **Foreground/Background Pairings**: 
  - Background (Pure Black #121212): Light text (#F2F2F2) - Ratio 17.8:1 ✓
  - Card (Charcoal #1E1E1E): Light text (#F5F5F5) - Ratio 16.2:1 ✓
  - Accent (Vibrant Red #D94848): White text (#FAFAFA) - Ratio 5.2:1 ✓
  - Muted (Dark Grey #383838): Light grey text (#8C8C8C) - Ratio 4.8:1 ✓

## Font Selection

Fonts should convey technical precision and modern digital aesthetics, matching the industrial audio engineering theme.

- **Typographic Hierarchy**:
  - H1 (Hero Title): Space Grotesk Bold/clamp(2.5rem, 8vw, 5rem)/tight letter spacing/-0.02em
  - H2 (Section Headers): Space Grotesk SemiBold/clamp(1.75rem, 5vw, 2.5rem)/tight/-0.02em
  - H3 (Subsections): Space Grotesk Medium/1.5rem/normal/-0.01em
  - Body: Inter Regular/1rem/relaxed (1.6)/normal
  - Labels/UI: JetBrains Mono Medium/0.875rem/normal/0.05em uppercase

## Animations

Animations should emphasize the scroll-video synchronization as the hero feature, with subtle supporting animations for UI elements. Balance between the dramatic scroll effect and functional micro-interactions.

- Lenis smooth scroll with custom easing (duration: 1.2s, easing: cubic-bezier(0.25, 0.46, 0.45, 0.94))
- Video transitions synchronized perfectly with scroll (no additional easing)
- Modal/dialog appearances: scale + fade, 300ms spring animation
- Button hover states: subtle glow expansion, 200ms ease-out
- Navigation: backdrop blur fade-in on scroll, 250ms

## Component Selection

- **Components**: 
  - Dialog (for modals - demo, services, about, contact)
  - Button (primary actions with red glow effects)
  - Card (service packages with red-themed borders)
  - Badge (labels with red accent styling)
  - Separator (visual breaks between sections)
  - Input, Textarea, Label (contact form with focus states)
  - Sonner (toast notifications for form submissions)
  
- **Customizations**: 
  - Custom scroll-controlled video component with optimized RAF and performance
  - Lenis wrapper component for smooth scroll initialization
  - Custom hero section with absolute-positioned video background
  - Extended card hover effects with red glow matching brand aesthetic
  
- **States**: 
  - Buttons: default with subtle red glow → hover with expanded glow + slight scale → active with compressed scale
  - Inputs: default with muted border → focus with bright red ring + border color shift
  - Video: loading state with skeleton → playing state synced to scroll with optimized performance
  
- **Icon Selection**: 
  - Phosphor Icons bold weight for technical/industrial feel
  - Waveform for branding, Play for demo CTAs, Briefcase for services, Envelope for contact
  
- **Spacing**: 
  - Container max-width: 1280px (7xl)
  - Section padding: py-20 md:py-32 (generous vertical rhythm)
  - Element gaps: gap-6 for grids, gap-4 for form fields, gap-2 for inline elements
  
- **Mobile**: 
  - Hamburger menu for navigation on <768px
  - Single column layouts for service cards
  - Reduced video height on mobile (60vh vs 100vh desktop)
  - Touch-optimized Lenis scroll behavior with lower friction
  - Reduced motion for video scroll effects on mobile (CSS prefers-reduced-motion)
