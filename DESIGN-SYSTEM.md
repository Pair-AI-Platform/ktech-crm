# ADL Design System — Master Style Guide

> **Codename:** Harvey AI Design System
> **Philosophy:** Warm-Neutral, Enterprise Professional, Clarity-First, Intentionally Restrained
> **Last Updated:** 2026-02-25

Use this file as the single source of truth when applying this design system to any project.

---

## 1. Foundation

### Tech Requirements

```
- Tailwind CSS 4+
- class-variance-authority (cva) for component variants
- tailwind-merge + clsx for className composition
- Radix UI primitives (headless) + Shadcn "new-york" style
- Framer Motion for animations
- Lucide React for icons
- Recharts for data visualization
```

### Utility Function

```ts
// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## 2. Color Palette

### Light Theme (Default)

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#1F1D1A` | Primary actions, text, buttons |
| `--primary-hover` | `#2C2A27` | Primary hover state |
| `--primary-foreground` | `#FAF9F7` | Text on primary backgrounds |
| `--primary-muted` | `rgba(31,29,26,0.08)` | Subtle primary backgrounds |
| `--primary-subtle` | `rgba(31,29,26,0.04)` | Very light primary tint |
| `--accent` | `#0D9488` | Accent/jade highlights |
| `--accent-hover` | `#0F766E` | Accent hover |
| `--accent-foreground` | `#FFFFFF` | Text on accent |
| `--secondary` | `#57534E` | Secondary text/elements |
| `--secondary-hover` | `#44403C` | Secondary hover |

#### Backgrounds

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-base` | `#FAF9F7` | Page background |
| `--bg-surface` | `#FFFFFF` | Cards, dropdowns, panels |
| `--bg-elevated` | `#FFFFFF` | Modals, popovers |
| `--bg-sunken` | `#F5F4F1` | Recessed areas, tab bars |
| `--bg-hover` | `#F0EFEC` | Hover states |
| `--bg-active` | `#E8E7E4` | Active/pressed states |

#### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | `#1F1D1A` | Headings, body text |
| `--text-secondary` | `#57534E` | Supporting text |
| `--text-tertiary` | `#78716C` | Less important text |
| `--text-muted` | `#A8A29E` | Placeholders, labels |
| `--text-disabled` | `#D6D3CD` | Disabled elements |
| `--text-inverse` | `#FAF9F7` | Text on dark surfaces |

#### Borders

| Token | Hex | Usage |
|-------|-----|-------|
| `--border` | `#E7E5E0` | Default borders |
| `--border-subtle` | `#F0EFEC` | Subtle dividers |
| `--border-emphasis` | `#D6D3CD` | Emphasized borders |
| `--border-focus` | `var(--primary)` | Focus rings |

#### Semantic Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--success` | `#16A34A` | `#4ADE80` | Success states |
| `--warning` | `#D97706` | `#FCD34D` | Warning states |
| `--error` | `#DC2626` | `#F87171` | Error states |
| `--info` | `#0D9488` | `#2DD4BF` | Info states |

Each semantic color has `-muted` (8-12% opacity) and `-bg` (4-8% opacity) variants.

### Dark Theme

| Token | Hex |
|-------|-----|
| `--bg-base` | `#1F1D1A` |
| `--bg-surface` | `#292724` |
| `--bg-elevated` | `#33312E` |
| `--bg-sunken` | `#17150F` |
| `--bg-hover` | `#3A3835` |
| `--bg-active` | `#44423F` |
| `--primary` | `#FAF9F7` |
| `--primary-foreground` | `#1F1D1A` |
| `--accent` | `#2DD4BF` |
| `--text-primary` | `#FAF9F7` |
| `--text-secondary` | `#A8A29E` |
| `--border` | `#3A3835` |
| `--border-subtle` | `#33312E` |
| `--border-emphasis` | `#57534E` |

**Rule:** Dark backgrounds are warm charcoal, never cold blue-black.

---

## 3. Typography

### Font Stack

```css
--font-sans: 'Geist', system-ui, -apple-system, sans-serif;
--font-mono: 'Geist Mono', monospace;
--font-rtl: 'IBM Plex Sans Arabic', 'Geist', system-ui, sans-serif;
```

### Base Body

```css
font-size: 14px;
line-height: 1.55;
letter-spacing: -0.006em;
font-weight: 400;
-webkit-font-smoothing: antialiased;
```

### Heading Scale

| Level | Size | Weight | Letter Spacing | Line Height |
|-------|------|--------|----------------|-------------|
| h1 | 1.875rem (30px) | 700 | -0.02em | 1.1 |
| h2 | 1.5rem (24px) | 600 | -0.02em | 1.2 |
| h3 | 1.25rem (20px) | 600 | -0.01em | 1.3 |
| h4 | 1rem (16px) | 600 | -0.01em | 1.4 |
| h5 | 0.875rem (14px) | 600 | default | default |
| h6 | 0.8125rem (13px) | 600 | default | default |

### Special Text Classes

```css
.label-caps    → 0.6875rem, weight 500, letter-spacing 0.05em, uppercase, color: --text-muted
.stat-number   → tabular-nums, weight 600, letter-spacing -0.02em
.stat-hero     → 2.5rem, weight 700, letter-spacing -0.02em, line-height 1
.font-display  → weight 600, letter-spacing -0.02em
.font-mono     → 'Geist Mono', 0.9em, letter-spacing 0
```

---

## 4. Spacing

4px baseline grid:

```
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
```

---

## 5. Border Radius

```
--radius-xs:   4px   → tiny elements, checkboxes
--radius-sm:   6px   → small pills, skeleton text
--radius:      8px   → default (inputs, nav items)
--radius-md:   10px  → medium elements
--radius-lg:   12px  → cards, dropdowns, tables
--radius-xl:   16px  → modals, dialogs
--radius-2xl:  20px  → large panels
--radius-3xl:  24px  → hero sections
--radius-full: 9999px → pills, avatars, badges
```

---

## 6. Shadows

### Light Theme

```css
--shadow-xs:         0 1px 2px rgba(31,29,26, 0.03)
--shadow-sm:         0 1px 3px rgba(31,29,26, 0.04), 0 1px 2px rgba(31,29,26, 0.02)
--shadow-md:         0 4px 6px -1px rgba(31,29,26, 0.06), 0 2px 4px -2px rgba(31,29,26, 0.04)
--shadow-lg:         0 10px 15px -3px rgba(31,29,26, 0.08), 0 4px 6px -4px rgba(31,29,26, 0.04)
--shadow-xl:         0 20px 25px -5px rgba(31,29,26, 0.10), 0 8px 10px -6px rgba(31,29,26, 0.06)
--shadow-2xl:        0 25px 50px -12px rgba(31,29,26, 0.18)
--shadow-inner:      inset 0 2px 4px rgba(31,29,26, 0.03)
--shadow-focus:      0 0 0 2px var(--bg-surface), 0 0 0 4px var(--primary-muted)
--shadow-card:       0 1px 2px rgba(31,29,26, 0.04)
--shadow-card-hover: 0 4px 12px rgba(31,29,26, 0.08)
```

**Rule:** Shadow base color is warm `(31,29,26)` in light, pure `(0,0,0)` with higher opacity in dark.

---

## 7. Transitions & Animations

### Timing

```
--transition-fast: 150ms ease
--transition-base: 200ms ease
--transition-slow: 300ms ease
```

### Keyframes

| Name | Effect | Duration |
|------|--------|----------|
| `fadeIn` | opacity 0→1 | 0.2s |
| `fadeInUp` | opacity + translateY(8px→0) | 0.25s |
| `fadeInDown` | opacity + translateY(-8px→0) | 0.25s |
| `scaleIn` | opacity + scale(0.97→1) | 0.2s |
| `shimmer` | background-position sweep | 1.5s infinite |
| `pulse-soft` | opacity 1→0.5→1 | 2s infinite |
| `spin` | rotate(360deg) | 0.6s linear |
| `slideInFromBottom` | translateY(16px→0) + opacity | 0.2s |

### Interaction Classes

```css
.hover-lift:hover    → translateY(-1px), shadow-md
.press-effect:active → scale(0.98)
.page-enter          → fadeInUp 0.25s
.stagger-1 to .stagger-8 → 30ms increments (30ms–240ms)
```

### Framer Motion Patterns

```tsx
// Sidebar expand/collapse
initial={{ height: 0, opacity: 0 }}
animate={{ height: "auto", opacity: 1 }}
exit={{ height: 0, opacity: 0 }}
transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}

// Shared layout elements
layoutId="indicator"
transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
```

---

## 8. Component Specifications

### Button

**Variants:**

| Variant | Style |
|---------|-------|
| `default` | bg: primary, text: primary-foreground, hover elevation |
| `destructive` | bg: error, text: white |
| `outline` | border + hover bg |
| `secondary` | bg: sunken |
| `ghost` | transparent, text only |
| `link` | underline, no padding |
| `success` | bg: success |
| `accent` | bg: accent (jade) |
| `gradient` | primary gradient background |
| `soft` | muted bg with text color |
| `soft-success/warning/error` | semantic soft fills |
| `glass` | surface bg with border |

**Sizes:**

| Size | Height | Padding | Text | Radius |
|------|--------|---------|------|--------|
| `xs` | h-7 (28px) | px-2.5 | text-xs | rounded-md |
| `sm` | h-8 (32px) | px-4 | text-xs | rounded-md |
| `default` | h-10 (40px) | px-5 | text-sm | rounded-lg |
| `lg` | h-12 (48px) | px-6 | text-base | rounded-lg |
| `xl` | h-14 (56px) | px-8 | text-lg | rounded-xl |
| `icon` | 40x40 | — | — | rounded-lg |
| `icon-xs` | 28x28 | — | — | rounded-md |
| `icon-sm` | 32x32 | — | — | rounded-md |
| `icon-lg` | 48x48 | — | — | rounded-lg |
| `pill` | h-10 | px-5 | text-sm | rounded-full |
| `pill-sm` | h-8 | px-4 | text-xs | rounded-full |
| `pill-lg` | h-12 | px-6 | text-base | rounded-full |

**Features:** Loading spinner, left/right icons, disabled opacity 0.5, active scale(0.98).

---

### Card

**Props:**

| Prop | Effect |
|------|--------|
| `hover` | border-emphasis + shadow-card-hover on hover |
| `glow` | shadow + border glow |
| `elevated` | shadow-md, no border |
| `flat` | no shadow |
| `interactive` | cursor pointer, active scale(0.995) |
| `gradient` | background gradient |
| `padding` | none / sm(p-4) / default(p-5) / lg(p-6) |

**Sub-components:** CardHeader, CardTitle (text-lg semibold), CardDescription (text-sm secondary), CardContent, CardFooter.

**StatCard:** Animated stat display with color variants (primary/success/warning/error/accent), icon bg, trend indicator.

---

### Badge

**Variants:** default, secondary, destructive, outline, success, warning, error, info, accent, solid-*, gradient, pipeline stages.

**Sizes:**

| Size | Height | Padding | Font |
|------|--------|---------|------|
| `xs` | h-5 | px-1.5 | 10px |
| `sm` | h-6 | px-2 | 11px |
| `default` | h-7 | px-2.5 | 12px (text-xs) |
| `lg` | h-8 | px-3 | 14px (text-sm) |

**Shapes:** default, pill (rounded-full), square (rounded-md).

**Features:** pulse animation, dot indicator, left/right icons, removable (X), interactive mode.

**Special Types:**
- `StatusBadge` — online/offline/busy/away with animated dot
- `CounterBadge` — notification count (0-99+)
- `BadgeGroup` — multiple badges with +N overflow

---

### Input

**Variants:** default (border), filled (bg, no border), ghost (transparent), glass (surface border).

**Sizes:**

| Size | Height | Padding | Text | Radius |
|------|--------|---------|------|--------|
| `sm` | h-9 | px-3 | text-xs | rounded-md |
| `default` | h-10 | px-4 | text-sm | rounded-lg |
| `lg` | h-12 | px-5 | text-base | rounded-lg |

**Features:** Icon left/right, prefix/suffix, error state (red border + ring), focus ring offset.

**SearchInput:** Magnifying glass icon + clear button.

**Textarea:** Same variants, min-height 120px, resize none.

---

### Avatar

**Sizes:**

| Size | Dimensions | Font |
|------|-----------|------|
| `xs` | 24x24 | 10px |
| `sm` | 32x32 | text-xs |
| `md` | 40x40 | text-sm |
| `lg` | 48x48 | text-base |
| `xl` | 64x64 | text-lg |

**Status:** online/offline/busy/away — positioned bottom-right with ring.

**AvatarGroup:** Overlapping with -ml spacing, max count with +N badge.

---

### Dialog / Modal

**Sizes:**

| Size | Max Width |
|------|-----------|
| `sm` | 384px |
| `md` | 512px |
| `lg` | 672px |
| `xl` | 896px |
| `full` | 95vw / 95vh |

**Overlay:** `rgba(31,29,26,0.5)` light, `rgba(0,0,0,0.6)` dark.

**Content:** shadow-2xl, border, rounded-xl, zoom-in-95 animation.

**Structure:** Header (p-5 px-6, border-bottom), Body (p-6, overflow-y-auto, max-h 60vh), Footer (p-4 px-6, border-top, bg-sunken).

---

### Select

Trigger: h-10, px-3, rounded-lg, border, focus ring.
Content: rounded-xl, bg-surface, shadow-xl, zoom-in-95 animation.
Item: focus bg-hover, selected checkmark with primary color.

---

### Tabs

TabsList: h-10, p-1, rounded-xl, bg-sunken with border.
TabsTrigger: px-3, py-1.5, text-sm, rounded-lg. Active: bg-surface, shadow-sm.

---

### Tooltip

Fixed position, z-9999, width 260px, opacity animation, 200ms hover delay.

---

## 9. Layout

### Sidebar

- **Expanded:** 264px width
- **Collapsed:** 76px width
- **Mobile:** 280px, fixed z-50, slide-in animation
- **Structure:** Logo → Quick Find (Cmd+K) → Primary Nav → Secondary Nav → Admin → Theme Toggle → User Card
- **Active Nav Item:** bg-hover, text-primary, left indicator bar (2px wide, 20px tall, rounded)

### Header

- Sticky top-0, z-20, bg-surface, border-bottom
- Height: 4.5rem mobile, 4rem desktop
- Layout: Breadcrumbs + Title (left) → Notifications + Action button (right)

### Dashboard Shell

- Root: h-screen, bg-background, overflow-hidden
- Sidebar padding: lg:pl-[260px] expanded / lg:pl-[72px] collapsed
- Mobile bottom nav: 64px height with safe-area padding

---

## 10. Surfaces & Containers

```css
.surface          → bg-surface, 1px border, radius-lg
.surface-elevated → bg-elevated, 1px border, radius-lg, shadow-sm (hover: shadow-md)
.surface-sunken   → bg-sunken, radius-lg
.surface-inset    → bg-sunken, radius-lg, shadow-inner
```

**No glass morphism.** Flat, intentional surfaces only.

---

## 11. Tables

```css
.table-container → radius-lg, overflow hidden, 1px border
.table-header    → bg-sunken, border-bottom, th: 0.6875rem uppercase 500 weight, letter-spacing 0.05em
.table-cell      → padding space-4, border-bottom border-subtle
.table-row-hover → bg-hover on hover
.table-row-selected → bg primary-subtle
.table-striped   → even rows bg-sunken
```

---

## 12. Forms

```css
.input-group       → position relative (for icon positioning)
.input-icon-left   → absolute, left space-3, centered vertically, color text-muted
.input-icon-right  → absolute, right space-3, centered vertically
.checkbox-fancy    → 16x16, radius-xs, checked: primary bg with white checkmark
```

---

## 13. Feedback

### Toasts

```css
.toast → bg-surface, border, radius-lg, shadow-lg, slideInFromBottom animation
.toast-success → 3px left border success
.toast-error   → 3px left border error
.toast-warning → 3px left border warning
.toast-info    → 3px left border info
```

### Alerts

```css
.alert → padding space-4, radius-lg, flex, gap space-3
.alert-success/error/warning/info → semantic bg + text color
```

### Empty States

```css
.empty-state → flex-col centered, padding space-12
.empty-state-icon → 56x56, padding space-4, bg-sunken, radius-lg, color text-muted
.empty-state-title → 1rem, weight 600, text-primary
.empty-state-description → text-muted, max-w 280px, 0.875rem
```

---

## 14. Loading States

```css
.loading-spinner    → 32x32, 2px border, primary top-color, spin 0.6s
.loading-spinner-sm → 16x16
.loading-spinner-lg → 48x48, 3px border
.loading-dots       → 3 dots, 6x6 each, pulse-soft staggered
.skeleton           → shimmer gradient animation, radius default
.skeleton-text      → height 1em, radius-sm
.skeleton-avatar    → radius-full
.skeleton-card      → radius-lg, min-height 100px
```

---

## 15. Scrollbar

```css
width: 8px (thin: 4px)
thumb: border-emphasis color, 4px radius, 2px transparent border
thumb:hover: text-muted color
track: transparent
.hide-scrollbar → fully hidden
```

---

## 16. Responsive Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| mobile | < 640px | Stack layouts, 16px min font for inputs |
| sm | 640px+ | Side-by-side layouts |
| md | 768px+ | Tablet views |
| lg | 1024px+ | Desktop sidebar visible |

### Mobile Utilities

```css
.mobile-stack     → flex-direction: column, gap 1rem
.mobile-full      → width 100%
.mobile-hide      → display none on mobile
.mobile-grid-1    → single column grid
.desktop-hide     → display none on desktop
```

**Rule:** All text inputs force 16px on mobile to prevent iOS zoom.

---

## 17. Focus & Selection

```css
*:focus-visible → outline: none, box-shadow: shadow-focus
::selection     → bg: primary, color: primary-foreground
```

---

## 18. Print

```css
@media print {
  body → white bg, black text, 12pt
  sidebar, mobile-nav, buttons → hidden
  cards → no shadow, 1px #ddd border
  headings → page-break-after: avoid
}
```

---

## 19. Accessibility

```css
@media (prefers-reduced-motion: reduce) → all animations/transitions to 0.01ms
.sr-only → visually hidden, screen-reader accessible
.skip-link → hidden until focused, then positioned top-0
```

Touch targets: min 44x44 on coarse pointer devices.

---

## 20. Dark Mode Implementation

1. Inline script in `<head>` checks `localStorage("ktech-theme")` then `prefers-color-scheme`
2. Applies `class="dark"` or `class="light"` to `<html>`
3. Sets `document.documentElement.style.colorScheme`
4. All colors switch via CSS variables — no JavaScript color manipulation
5. Theme toggle stores 3 modes: light, dark, system
6. Custom `"theme-change"` event for cross-component sync

---

## 21. Design Principles (Non-Negotiable)

1. **Warm tones only** — Ink (#1F1D1A), Stone (#57534E), Jade (#0D9488). Never cold blue-grays.
2. **No glass morphism** — Flat, intentional surfaces with subtle warm shadows.
3. **Restrained animations** — 150-300ms, ease curve. No bouncy/playful motion.
4. **Typography-driven** — Geist family, tight letter-spacing on headings, generous on labels.
5. **4px grid** — All spacing derived from 4px baseline.
6. **Clarity over decoration** — Every element earns its place. No ornamental flourishes.
7. **Semantic color usage** — Green=success, Amber=warning, Red=error, Jade=accent. Never arbitrary.
8. **Consistent radius** — 8px default, 12px cards, 16px modals, 9999px pills. No mixing.
9. **Focus accessibility** — Every interactive element has a visible focus ring.
10. **RTL-ready** — IBM Plex Sans Arabic configured, directional layouts considered.

---

## 22. Quick Setup for New Projects

### 1. Install Dependencies

```bash
npm install tailwindcss@latest clsx tailwind-merge class-variance-authority
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-tooltip
npm install framer-motion lucide-react recharts
```

### 2. Copy globals.css

Copy the full `globals.css` from this project as your base stylesheet. It contains all CSS variables, animations, utility classes, and component styles.

### 3. Create lib/utils.ts

```ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 4. Configure Shadcn

```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "css": "app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "iconLibrary": "lucide"
}
```

### 5. Add Theme Script to Layout

```tsx
<html suppressHydrationWarning>
  <head>
    <script dangerouslySetInnerHTML={{ __html: `
      (function() {
        var t = localStorage.getItem('ktech-theme');
        var dark = t === 'dark' || (!t && matchMedia('(prefers-color-scheme:dark)').matches);
        document.documentElement.classList.add(dark ? 'dark' : 'light');
        document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
      })()
    `}} />
  </head>
  <body className="font-sans bg-[var(--bg-base)] text-[var(--text-primary)]">
    {children}
  </body>
</html>
```

---

## 23. Token Quick Reference

```
PRIMARY:    light #1F1D1A  |  dark #FAF9F7
ACCENT:     light #0D9488  |  dark #2DD4BF
SUCCESS:    light #16A34A  |  dark #4ADE80
WARNING:    light #D97706  |  dark #FCD34D
ERROR:      light #DC2626  |  dark #F87171
SURFACE:    light #FFFFFF  |  dark #292724
SUNKEN:     light #F5F4F1  |  dark #17150F
BORDER:     light #E7E5E0  |  dark #3A3835
TEXT-1:     light #1F1D1A  |  dark #FAF9F7
TEXT-2:     light #57534E  |  dark #A8A29E
TEXT-MUTED: light #A8A29E  |  dark #57534E
```
