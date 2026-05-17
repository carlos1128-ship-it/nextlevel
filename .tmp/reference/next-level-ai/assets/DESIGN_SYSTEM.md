---
name: Next Level AI
colors:
  surface: '#111412'
  surface-dim: '#111412'
  surface-bright: '#373a37'
  surface-container-lowest: '#0c0f0c'
  surface-container-low: '#191c1a'
  surface-container: '#1d201e'
  surface-container-high: '#272b28'
  surface-container-highest: '#323632'
  on-surface: '#e1e3de'
  on-surface-variant: '#c2caad'
  inverse-surface: '#e1e3de'
  inverse-on-surface: '#2e312e'
  outline: '#8c9479'
  outline-variant: '#424a33'
  surface-tint: '#9bd900'
  primary: '#ffffff'
  on-primary: '#243600'
  primary-container: '#b1f800'
  on-primary-container: '#4d6e00'
  inverse-primary: '#486800'
  secondary: '#c3c8c3'
  on-secondary: '#2c322e'
  secondary-container: '#454a46'
  on-secondary-container: '#b5bab5'
  tertiary: '#ffffff'
  on-tertiary: '#2d3135'
  tertiary-container: '#e0e3e8'
  on-tertiary-container: '#61656a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#b1f800'
  primary-fixed-dim: '#9bd900'
  on-primary-fixed: '#131f00'
  on-primary-fixed-variant: '#354e00'
  secondary-fixed: '#dfe4de'
  secondary-fixed-dim: '#c3c8c3'
  on-secondary-fixed: '#181d1a'
  on-secondary-fixed-variant: '#434844'
  tertiary-fixed: '#e0e3e8'
  tertiary-fixed-dim: '#c3c7cc'
  on-tertiary-fixed: '#181c20'
  on-tertiary-fixed-variant: '#43474c'
  background: '#111412'
  on-background: '#e1e3de'
  surface-variant: '#323632'
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Sora
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Sora
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Sora
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-uppercase:
    fontFamily: Sora
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2.5rem
  sidebar-width: 280px
  gutter: 24px
  container-max: 1440px
---

## Brand & Style

The design system is engineered for a high-performance, B2B AI ERP environment. The aesthetic is **Tactile Minimalism mixed with Tech-Noir**, characterized by deep obsidian surfaces and high-energy kinetic accents. The goal is to evoke a sense of precision, intelligence, and "Next-Gen" operational control.

The visual language relies on high-contrast interaction points against a dark, multi-layered background. It utilizes a **Modern Corporate** structure with **Glassmorphic** accents to maintain a professional yet cutting-edge atmosphere. Every element is designed to feel like a high-end dashboard found in advanced aerospace or fintech terminals, providing the user with a sense of mastery over complex data.

## Colors

The palette is strictly dark-mode, utilizing a range of "near-black" greens and grays to create depth without losing the premium feel. 

- **Primary Accent:** The Neon Green (#B6FF00) is used sparingly but impactfully—reserved for primary actions, active navigation states, and critical data points.
- **Surface Tiers:** We use four distinct levels of darkness to establish hierarchy. The background is the darkest, while cards and interactive elements are progressively lighter to "float" above the base.
- **State Feedback:** Hover states on primary elements should shift toward a deeper, more saturated green (#9BE600), while borders on focused inputs use a semi-transparent glow of the primary neon.

## Typography

This design system uses **Sora** for its geometric yet approachable tech aesthetic. 

- **Hierarchy:** Use `display-lg` for hero numbers and KPIs. `headline-md` should be used for card titles.
- **Eyebrows:** The `label-uppercase` style is critical for categorizing sections and providing context above headings. It should always use the `text_muted` color.
- **Readability:** Body text uses a generous line height (1.6) to ensure long-form ERP data remains legible against the dark background.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. The sidebar remains a fixed width of 280px to provide a stable anchor for navigation, while the main content area utilizes a fluid 12-column grid.

- **Vertical Rhythm:** Spacing between sections should consistently use the `xl` (40px) unit. Internal card padding is strictly `lg` (24px) to provide a spacious, luxury feel.
- **Alignment:** All elements must align to a 4px baseline grid to maintain the "tactical" precision expected of a high-end ERP.
- **Mobile Reflow:** On mobile, the 280px sidebar transforms into a bottom navigation bar or a hidden hamburger menu, and horizontal container margins reduce from 24px to 16px.

## Elevation & Depth

In this design system, depth is communicated through **Tonal Layering** and **Soft Luminescence** rather than traditional heavy shadows.

- **The Stack:**
    1. **Base:** `background_main` (#050706) - The canvas.
    2. **Structural:** `background_sidebar` and `background_topbar` - Fixed elements that define the workspace.
    3. **Content:** `card_base` (#111613) - Used for standard data containers.
    4. **Interactive/Overlay:** `card_elevated` (#171D1A) - Used for modals, dropdowns, and cards being hovered.
- **Shadows:** Use extremely subtle, large-radius shadows (0px 20px 40px rgba(0,0,0,0.5)) to lift elevated cards.
- **Inner Glow:** Interactive elements like active buttons or focused inputs should have a very faint inner-shadow or 1px border to give them a "machined" look.

## Shapes

The shape language is **Rounded and Modern**, contrasting the technical fonts with friendly, accessible corners.

- **Containers:** All primary cards and modals use a 20px (`rounded-xl`) radius.
- **Small Elements:** Buttons and input fields use a consistent 8px (`rounded-md`) radius.
- **Active Indicators:** Vertical indicators in the sidebar (the active state markers) use a pill shape (fully rounded) to contrast against the rectangular structure of the menu.

## Components

### Buttons
- **Primary:** Background `primary_color_hex` (#B6FF00), Text `#050706` (Black), Bold weight.
- **Secondary:** Transparent background, 1px border `border_subtle`, Text `text_primary`.
- **Tertiary/Ghost:** No border, Text `text_secondary`, Primary color on hover.

### Input Fields
- **Base:** Background `input_bg`, border `border_subtle`.
- **Focus:** Border becomes `border_active` with a 2px outer glow (drop-shadow) using 15% opacity of the neon green.

### Cards
- **Structure:** 20px border-radius, `card_base` background, 1px `border_subtle` stroke.
- **Header:** Title in `headline-md`, separated by a subtle horizontal rule or generous whitespace.

### Sidebar
- **Groupings:** Nav items are grouped under `label-uppercase` category headers.
- **Active State:** The active item receives a `primary_color_hex` text color and a vertical pill-shaped "light bar" on the far left or right of the item.

### Chips/Badges
- Small, uppercase, with a background of 10% opacity of the status color (Green for success, Red for error, Primary for neutral info).