---
name: Aeronautic Intelligence Interface
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353942'
  surface-container-lowest: '#0a0e16'
  surface-container-low: '#181c24'
  surface-container: '#1c2028'
  surface-container-high: '#262a33'
  surface-container-highest: '#31353e'
  on-surface: '#dfe2ee'
  on-surface-variant: '#e6bdb5'
  inverse-surface: '#dfe2ee'
  inverse-on-surface: '#2c3039'
  outline: '#ad8881'
  outline-variant: '#5c403a'
  surface-tint: '#ffb4a5'
  primary: '#ffb4a5'
  on-primary: '#640c00'
  primary-container: '#cc2200'
  on-primary-container: '#ffe3dd'
  inverse-primary: '#b91e00'
  secondary: '#f4be5d'
  on-secondary: '#422c00'
  secondary-container: '#8d6300'
  on-secondary-container: '#ffe9ca'
  tertiary: '#bbc7df'
  on-tertiary: '#253144'
  tertiary-container: '#5e697f'
  on-tertiary-container: '#e0e9ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad3'
  primary-fixed-dim: '#ffb4a5'
  on-primary-fixed: '#3e0400'
  on-primary-fixed-variant: '#8e1500'
  secondary-fixed: '#ffdeab'
  secondary-fixed-dim: '#f4be5d'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5f4100'
  tertiary-fixed: '#d7e3fc'
  tertiary-fixed-dim: '#bbc7df'
  on-tertiary-fixed: '#101c2e'
  on-tertiary-fixed-variant: '#3c475b'
  background: '#0f131c'
  on-background: '#dfe2ee'
  surface-variant: '#31353e'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.15em
  mono-data:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system is engineered for the Uganda Air Cargo Corporation's Digital Information and Management System. It evokes a sense of high-stakes precision, government-grade security, and futuristic aviation technology. 

The aesthetic is a sophisticated fusion of **Minimalism** and **Glassmorphism**, drawing inspiration from modern aerospace cockpits and premium enterprise SaaS platforms. The interface prioritizes data density and clarity while maintaining a prestigious, "black-ops" atmosphere. High-contrast accents are used sparingly to signal critical information pathways against a void-like backdrop.

## Colors
The palette is rooted in a "Deep Space" foundation to minimize eye strain during long-duration logistics monitoring.

- **Base Surface:** #080C14 (Deep Space Black) provides the infinite canvas.
- **Atmospheric Gradient:** Subtle transitions to #0A1628 (Dark Navy) are used to define large structural regions.
- **Primary (UACC Red):** #CC2200 is reserved for mission-critical actions, status alerts, and primary branding elements.
- **Secondary (UACC Gold):** #C9973A acts as a premium "instrumentation" color, used for borders, active states, and decorative accents that imply high-value status.
- **Typography:** Headlines utilize pure #FFFFFF for maximum punch, while body text uses #A0AEC0 to maintain hierarchy and readability.

## Typography
The typographic system balances the technical, geometric nature of **Space Grotesk** with the utilitarian precision of **Inter**.

- **Headlines:** Space Grotesk should be set with tight tracking to create a "dense" and authoritative feel.
- **Body:** Inter provides neutral readability for complex data tables and logistics reports.
- **Specialty Labels:** For technical metadata or navigation categories, use the `label-caps` style with wide tracking to emulate aviation instrument panels.
- **Mobile Adjustments:** `headline-xl` should scale down to 32px on mobile devices to ensure readability without horizontal scrolling.

## Layout & Spacing
The layout follows a **Fluid Grid** system based on an 8px technical rhythm.

- **Desktop:** 12-column grid with 24px gutters. Use wide 40px outer margins to create a "letterboxed" cinematic feel.
- **Content Density:** In data-heavy views (e.g., Cargo Manifests), utilize a high-density spacing model (4px/8px increments) to maximize information visibility.
- **Reflow:** On mobile, columns collapse to a single stack with 16px side margins. Glass containers should stretch full-width to maximize the blur surface area.

## Elevation & Depth
Depth is achieved through **Glassmorphism** and light-based hierarchy rather than traditional shadows.

- **Surface Tiers:** Background is the lowest level. Content containers use `rgba(255, 255, 255, 0.05)` with a `12px` backdrop-filter blur.
- **Borders:** Instead of shadows, use 1px "inner-glow" borders. Default borders use `rgba(201, 151, 58, 0.2)` (Gold). Active or critical elements use `rgba(204, 34, 0, 0.4)` (Red).
- **Interactive Depth:** On hover, increase the background opacity to `0.08` and the border opacity to `0.4`. This creates a tactile "lighting up" effect similar to a cockpit button.

## Shapes
The shape language is **Soft** but disciplined. 

- **Containers:** 0.25rem (4px) base radius. This maintains a sharp, professional military-grade appearance while avoiding the aggression of 0px corners.
- **Interactive Elements:** Buttons and tags follow the same 4px logic.
- **Exceptions:** Large modal containers or dashboard "hero" cards can use `rounded-lg` (8px) to subtly differentiate them from the main background grid.

## Components
- **Buttons:** Primary buttons use a solid UACC Red fill with white uppercase text. Secondary buttons use a glass background with a Gold border. All buttons feature a 1px top-edge highlight to simulate a physical edge.
- **Input Fields:** Ghost-style inputs with `rgba(255,255,255,0.03)` fill and a bottom-only 2px border in Gold when focused.
- **Cards:** Utilize the standard glassmorphic formula. Card headers should be separated by a thin 1px line of `rgba(201,151,58,0.1)`.
- **Status Chips:** Small, rectangular tags with low-opacity background fills of Red (Alert), Gold (Processing), or Green (Clear), paired with high-contrast text.
- **Flight Trackers:** Custom component using a dashed Gold line and a glowing Red dot to indicate cargo location.
- **Lists:** Clean rows separated by subtle `rgba(255,255,255,0.05)` dividers. No borders on the left/right of list items to maintain a fluid, modern look.