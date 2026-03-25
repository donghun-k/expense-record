# Glassmorphism UI + Dark Mode Design Spec

## Overview

Apple-inspired glassmorphism UI redesign with dark mode support for the expense-record app.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Style | Subtle Glass | Gradient background with translucent frosted glass cards. Vision Pro / macOS Sonoma aesthetic. |
| Color Palette | Warm Sunset | Pink → Coral → Orange gradient (`#f093fb → #f5576c → #ffd194`). Distinctive, warm personality. |
| Dark Mode Toggle | Nav bar icon button | Right side of navigation. Simple light/dark toggle. |
| Dark Gradient | Muted Warm Sunset | `#4a1942 → #3d1229 → #5c3d1e`. Same hues, deeply darkened. |

## Color System Migration

The current OKLch variable system migrates to hex/RGBA for glassmorphism compatibility.

**Variables that change:** `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--border`, `--input`, `--ring`, all sidebar variants.

**Variables that stay as-is:** `--chart-1` through `--chart-5` (unused in glass context), `--radius` system.

**Key foreground strategy:** Since both light and dark modes render content on a vivid gradient, `--foreground` is **white** (`rgba(255,255,255,0.95)`) in both modes. `--muted-foreground` uses `rgba(255,255,255,0.6)` light / `rgba(255,255,255,0.4)` dark. All text is light-on-dark.

## Glass CSS Variables

```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.15);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-blur: 20px;
}
.dark {
  --glass-bg: rgba(255, 255, 255, 0.06);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur: 20px;
}
```

Always use Tailwind's `backdrop-blur-*` utilities (which emit both `-webkit-backdrop-filter` and `backdrop-filter`) rather than raw `backdrop-filter` CSS to ensure Safari compatibility.

## Scope of Changes

### 1. Theme Infrastructure

**`app/layout.tsx`**
- Wrap app with `ThemeProvider` from `next-themes` (attribute: `class`, defaultTheme: `system`, enableSystem: true)
- Add `suppressHydrationWarning` to `<html>` (required by next-themes)
- This also fixes the pre-existing issue where Sonner's `useTheme()` had no provider

**`app/globals.css`**
- Migrate color variables from OKLch to hex/RGBA (see Color System Migration above)
- Add glass CSS variables (`--glass-bg`, `--glass-border`, `--glass-blur`)
- Body gradient: light `linear-gradient(135deg, #f093fb, #f5576c, #ffd194)`, dark `linear-gradient(135deg, #4a1942, #3d1229, #5c3d1e)`
- `min-height: 100dvh`, `background-attachment: fixed` on body

### 2. Navigation (`components/nav.tsx`)

- Glassmorphism nav bar: Tailwind `backdrop-blur-xl` + translucent background via `--glass-bg`
- Add `ThemeToggle` component on the right side
- Active link accent color: coral (`#f5576c` light) / pink (`#f093fb` dark)
- Sticky top positioning

### 3. New Component: ThemeToggle (`components/theme-toggle.tsx`)

- Uses `useTheme()` from `next-themes`
- **Simple light/dark toggle** (no system cycling — `defaultTheme: system` handles initial state)
- Lucide icons: `Sun`, `Moon`
- Glass-styled button matching nav aesthetic
- `mounted` state check to avoid hydration mismatch

### 4. UI Components Updates

All glass-panel components use shared CSS variables + Tailwind utilities:

**Components to update:**
- **Card** (`components/ui/card.tsx`) — glass bg via `--glass-bg`, `backdrop-blur-xl`, `--glass-border`
- **Dialog** (`components/ui/dialog.tsx`) — glass overlay + glass content panel. Use `isolation: isolate` on dialog content to fix Safari nested backdrop-filter compositing.
- **Select dropdown** (`components/ui/select.tsx`) — glass popup
- **Popover** (`components/ui/popover.tsx`) — glass popup
- **Input** (`components/ui/input.tsx`) — translucent input bg (`rgba(255,255,255,0.08)` dark / `rgba(255,255,255,0.1)` light)
- **Button** (`components/ui/button.tsx`) — primary uses accent coral, other variants get glass treatment
- **Table** (`components/ui/table.tsx`) — glass container, translucent alternating rows
- **Tabs** (`components/ui/tabs.tsx`) — glass tab bar
- **Badge** (`components/ui/badge.tsx`) — translucent badge backgrounds
- **Calendar** (`components/ui/calendar.tsx`) — glass popup styling
- **Sonner** (`components/ui/sonner.tsx`) — glass-styled toasts with readable contrast (solid-ish glass bg `rgba(255,255,255,0.2)` light / `rgba(255,255,255,0.1)` dark to ensure readability)
- **Separator** (`components/ui/separator.tsx`) — use `--glass-border` color for visibility on glass surfaces
- **Form/Label** — inherit from CSS variable changes, no direct component edits needed

**Border radius:** Use existing `--radius` system. Update `--radius` from `0.625rem` to `1rem` (16px) to match glass aesthetic. Sub-components use computed `--radius-md`, `--radius-sm` automatically.

### 5. Page-Level Adjustments

- **Home (`app/page.tsx`)** — glass applies automatically via Card component
- **History (`app/history/page.tsx`)** — table container gets glass card wrapper
- **Settings (`app/settings/page.tsx`)** — tabs + settings panels get glass treatment
- Remove any hardcoded background colors that conflict with glass style

### 6. Accent Colors

- Primary accent: `#f5576c` (coral)
- Secondary accent: `#f093fb` (pink)
- Success: `rgba(52,199,89,0.8)` with translucent background
- Destructive: orange/red with translucent background

## Performance & Accessibility

- Use Tailwind's `backdrop-blur-*` (handles `-webkit-` prefix automatically)
- `isolation: isolate` on nested glass layers (Dialog) for Safari
- `@media (prefers-reduced-motion: reduce)`: set `--glass-blur: 0px`, add semi-opaque fallback bg (`rgba(40,20,30,0.85)` dark / `rgba(200,150,170,0.85)` light)
- Mobile (`max-width: 768px`): reduce `--glass-blur` to `12px` for performance
- Avoid nesting more than 2 levels of backdrop-filter

## Out of Scope

- Animated gradient backgrounds
- Custom scrollbar styling
- Page transition animations
