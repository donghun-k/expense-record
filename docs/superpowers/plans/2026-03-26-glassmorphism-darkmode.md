# Glassmorphism UI + Dark Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the expense-record app into an Apple-inspired glassmorphism UI with full dark mode support.

**Architecture:** Replace the current flat OKLch color system with a Warm Sunset gradient background + translucent glass panel system. Wire up next-themes ThemeProvider for light/dark toggling. All content sits on glass cards with backdrop-blur over the gradient.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, next-themes, Lucide React, shadcn/ui (base-nova)

**Spec:** `docs/superpowers/specs/2026-03-26-glassmorphism-darkmode-design.md`

---

### Task 1: Theme Infrastructure — globals.css

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace `:root` color variables**

Replace the entire `:root` block (lines 50-83) with Warm Sunset glassmorphism palette:

```css
:root {
  --background: #f5576c;
  --foreground: rgba(255, 255, 255, 0.95);
  --card: rgba(255, 255, 255, 0.15);
  --card-foreground: rgba(255, 255, 255, 0.95);
  --popover: rgba(255, 255, 255, 0.2);
  --popover-foreground: rgba(255, 255, 255, 0.95);
  --primary: #f5576c;
  --primary-foreground: #ffffff;
  --secondary: rgba(255, 255, 255, 0.12);
  --secondary-foreground: rgba(255, 255, 255, 0.9);
  --muted: rgba(255, 255, 255, 0.08);
  --muted-foreground: rgba(255, 255, 255, 0.6);
  --accent: rgba(255, 255, 255, 0.12);
  --accent-foreground: rgba(255, 255, 255, 0.95);
  --destructive: #ff6b6b;
  --border: rgba(255, 255, 255, 0.2);
  --input: rgba(255, 255, 255, 0.15);
  --ring: rgba(245, 87, 108, 0.5);
  --chart-1: oklch(0.809 0.105 251.813);
  --chart-2: oklch(0.623 0.214 259.815);
  --chart-3: oklch(0.546 0.245 262.881);
  --chart-4: oklch(0.488 0.243 264.376);
  --chart-5: oklch(0.424 0.199 265.638);
  --radius: 1rem;
  --sidebar: rgba(255, 255, 255, 0.1);
  --sidebar-foreground: rgba(255, 255, 255, 0.95);
  --sidebar-primary: #f5576c;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: rgba(255, 255, 255, 0.12);
  --sidebar-accent-foreground: rgba(255, 255, 255, 0.95);
  --sidebar-border: rgba(255, 255, 255, 0.15);
  --sidebar-ring: rgba(245, 87, 108, 0.5);
  --glass-bg: rgba(255, 255, 255, 0.15);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-blur: 20px;
}
```

- [ ] **Step 2: Replace `.dark` color variables**

Replace the entire `.dark` block (lines 85-117) with:

```css
.dark {
  --background: #3d1229;
  --foreground: rgba(255, 255, 255, 0.95);
  --card: rgba(255, 255, 255, 0.06);
  --card-foreground: rgba(255, 255, 255, 0.95);
  --popover: rgba(255, 255, 255, 0.1);
  --popover-foreground: rgba(255, 255, 255, 0.95);
  --primary: #f093fb;
  --primary-foreground: #1a0a12;
  --secondary: rgba(255, 255, 255, 0.08);
  --secondary-foreground: rgba(255, 255, 255, 0.85);
  --muted: rgba(255, 255, 255, 0.06);
  --muted-foreground: rgba(255, 255, 255, 0.4);
  --accent: rgba(255, 255, 255, 0.08);
  --accent-foreground: rgba(255, 255, 255, 0.95);
  --destructive: #ff8a80;
  --border: rgba(255, 255, 255, 0.08);
  --input: rgba(255, 255, 255, 0.1);
  --ring: rgba(240, 147, 251, 0.5);
  --chart-1: oklch(0.809 0.105 251.813);
  --chart-2: oklch(0.623 0.214 259.815);
  --chart-3: oklch(0.546 0.245 262.881);
  --chart-4: oklch(0.488 0.243 264.376);
  --chart-5: oklch(0.424 0.199 265.638);
  --sidebar: rgba(255, 255, 255, 0.05);
  --sidebar-foreground: rgba(255, 255, 255, 0.95);
  --sidebar-primary: #f093fb;
  --sidebar-primary-foreground: #1a0a12;
  --sidebar-accent: rgba(255, 255, 255, 0.08);
  --sidebar-accent-foreground: rgba(255, 255, 255, 0.95);
  --sidebar-border: rgba(255, 255, 255, 0.06);
  --sidebar-ring: rgba(240, 147, 251, 0.5);
  --glass-bg: rgba(255, 255, 255, 0.06);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur: 20px;
}
```

- [ ] **Step 3: Update body styles in `@layer base`**

Replace the `@layer base` block (lines 119-129) with:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply text-foreground min-h-dvh;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #ffd194 100%);
    background-attachment: fixed;
  }
  html.dark body {
    background: linear-gradient(135deg, #4a1942 0%, #3d1229 50%, #5c3d1e 100%);
  }
  html {
    @apply font-sans;
  }
  @media (prefers-reduced-motion: reduce) {
    :root {
      --glass-blur: 0px;
      --glass-bg: rgba(200, 150, 170, 0.85);
    }
    .dark {
      --glass-bg: rgba(40, 20, 30, 0.9);
    }
  }
  @media (max-width: 768px) {
    :root, .dark {
      --glass-blur: 12px;
    }
  }
}
```

- [ ] **Step 4: Verify build compiles**

Run: `npm run build`
Expected: Successful build (may show page warnings, but no CSS errors)

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "style: replace OKLch colors with Warm Sunset glassmorphism palette"
```

---

### Task 2: ThemeProvider + Layout

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Add ThemeProvider wrapper**

Replace the full content of `app/layout.tsx` with:

```tsx
import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import './globals.css'
import { Nav } from '@/components/nav'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '지출 기록',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Nav />
          <main className="container mx-auto px-4 py-6">{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Verify dev server runs**

Run: `npm run dev`
Expected: Page loads with gradient background, Sonner no longer errors about missing provider

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add ThemeProvider from next-themes to root layout"
```

---

### Task 3: ThemeToggle Component

**Files:**
- Create: `components/theme-toggle.tsx`

- [ ] **Step 1: Create ThemeToggle component**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <Button variant="ghost" size="icon-sm" className="text-foreground/60" />
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="text-foreground/60 hover:text-foreground"
    >
      {resolvedTheme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span className="sr-only">테마 변경</span>
    </Button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/theme-toggle.tsx
git commit -m "feat: add ThemeToggle component with light/dark switching"
```

---

### Task 4: Navigation — Glassmorphism + ThemeToggle

**Files:**
- Modify: `components/nav.tsx`

- [ ] **Step 1: Update Nav component**

Replace the full content of `components/nav.tsx` with:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'

const links = [
  { href: '/', label: '지출 입력' },
  { href: '/history', label: '지출 내역' },
  { href: '/settings', label: '설정' },
]

export function Nav() {
  const pathname = usePathname()
  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg">지출 기록</span>
          <div className="flex gap-4">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === href ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <ThemeToggle />
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Verify navigation renders with glass effect and toggle**

Run: `npm run dev`
Expected: Frosted glass nav bar with theme toggle button on the right. Clicking toggles light/dark mode.

- [ ] **Step 3: Commit**

```bash
git add components/nav.tsx
git commit -m "style: glassmorphism nav bar with theme toggle"
```

---

### Task 5: Card Component — Glass Styling

**Files:**
- Modify: `components/ui/card.tsx`

- [ ] **Step 1: Update Card classes**

In `components/ui/card.tsx`, replace the Card className string (line 15):

Old:
```
"group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl"
```

New:
```
"group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-[var(--glass-bg)] py-4 text-sm text-card-foreground ring-1 ring-[var(--glass-border)] backdrop-blur-xl has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl"
```

- [ ] **Step 2: Update CardFooter classes**

In `components/ui/card.tsx`, replace the CardFooter className (line 88):

Old:
```
"flex items-center rounded-b-xl border-t bg-muted/50 p-4 group-data-[size=sm]/card:p-3"
```

New:
```
"flex items-center rounded-b-xl border-t border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 group-data-[size=sm]/card:p-3"
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/card.tsx
git commit -m "style: glass effect on Card component"
```

---

### Task 6: Dialog — Glass Styling with Safari Fix

**Files:**
- Modify: `components/ui/dialog.tsx`

- [ ] **Step 1: Update DialogOverlay classes**

In `components/ui/dialog.tsx`, replace the DialogOverlay className (line 34):

Old:
```
"fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
```

New:
```
"fixed inset-0 isolate z-50 bg-black/20 duration-100 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
```

- [ ] **Step 2: Update DialogContent classes**

In `components/ui/dialog.tsx`, replace the DialogContent className (line 56):

Old:
```
"fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-background p-4 text-sm ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
```

New:
```
"fixed top-1/2 left-1/2 z-50 isolate grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-[var(--glass-bg)] p-4 text-sm ring-1 ring-[var(--glass-border)] backdrop-blur-xl duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
```

- [ ] **Step 3: Update DialogFooter classes**

In `components/ui/dialog.tsx`, replace the DialogFooter className (line 105):

Old:
```
"-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end"
```

New:
```
"-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 sm:flex-row sm:justify-end"
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/dialog.tsx
git commit -m "style: glass effect on Dialog with Safari isolation fix"
```

---

### Task 7: Select, Popover, Calendar — Glass Dropdowns

**Files:**
- Modify: `components/ui/select.tsx`
- Modify: `components/ui/popover.tsx`
- Modify: `components/ui/calendar.tsx`

- [ ] **Step 1: Update SelectContent popup classes**

In `components/ui/select.tsx`, in the `SelectContent` function (line 97), replace:

Old:
```
"relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
```

New:
```
"relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-[var(--glass-bg)] text-popover-foreground shadow-md ring-1 ring-[var(--glass-border)] backdrop-blur-xl duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
```

- [ ] **Step 2: Update SelectTrigger classes**

In `components/ui/select.tsx`, in the `SelectTrigger` function (line 54-55), replace:

Old:
```
"flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
```

New:
```
"flex w-fit items-center justify-between gap-1.5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none backdrop-blur-xl focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
```

- [ ] **Step 3: Update SelectScrollUpButton and SelectScrollDownButton**

In `SelectScrollUpButton` (line 170-171), replace `bg-popover` with `bg-transparent`:
```
"top-0 z-10 flex w-full cursor-default items-center justify-center bg-transparent py-1 [&_svg:not([class*='size-'])]:size-4"
```

In `SelectScrollDownButton` (line 189-190), replace `bg-popover` with `bg-transparent`:
```
"bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-transparent py-1 [&_svg:not([class*='size-'])]:size-4"
```

- [ ] **Step 4: Update PopoverContent classes**

In `components/ui/popover.tsx`, in the `PopoverContent` function (line 39-40), replace:

Old:
```
"z-50 flex w-72 origin-(--transform-origin) flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
```

New:
```
"z-50 flex w-72 origin-(--transform-origin) flex-col gap-2.5 rounded-lg bg-[var(--glass-bg)] p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-[var(--glass-border)] backdrop-blur-xl outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
```

- [ ] **Step 5: Update Calendar glass background**

In `components/ui/calendar.tsx`, in the Calendar function (line 34), replace:

Old:
```
"group/calendar bg-background p-2 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent"
```

New:
```
"group/calendar bg-transparent p-2 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent"
```

Also in the dropdown class (line 80), replace:

Old:
```
"absolute inset-0 bg-popover opacity-0"
```

New:
```
"absolute inset-0 bg-transparent opacity-0"
```

- [ ] **Step 6: Commit**

```bash
git add components/ui/select.tsx components/ui/popover.tsx components/ui/calendar.tsx
git commit -m "style: glass effect on Select, Popover, Calendar dropdowns"
```

---

### Task 8: Input + Button — Glass Form Elements

**Files:**
- Modify: `components/ui/input.tsx`
- Modify: `components/ui/button.tsx`

- [ ] **Step 1: Update Input classes**

In `components/ui/input.tsx`, replace the className string (line 12):

Old:
```
"h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
```

New:
```
"h-8 w-full min-w-0 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2.5 py-1 text-base transition-colors outline-none backdrop-blur-xl file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
```

- [ ] **Step 2: Update Button default variant**

In `components/ui/button.tsx`, replace the `default` variant (line 13):

Old:
```
default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
```

New:
```
default: "bg-primary/90 text-primary-foreground backdrop-blur-xl [a]:hover:bg-primary/70",
```

- [ ] **Step 3: Update Button outline variant**

Replace the `outline` variant (line 14-15):

Old:
```
outline:
  "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
```

New:
```
outline:
  "border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl hover:bg-accent hover:text-foreground aria-expanded:bg-accent aria-expanded:text-foreground",
```

- [ ] **Step 4: Update Button secondary variant**

Replace the `secondary` variant (line 16-17):

Old:
```
secondary:
  "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
```

New:
```
secondary:
  "bg-[var(--glass-bg)] text-secondary-foreground backdrop-blur-xl hover:bg-accent aria-expanded:bg-accent aria-expanded:text-secondary-foreground",
```

- [ ] **Step 5: Update Button ghost variant**

Replace the `ghost` variant (line 18-19):

Old:
```
ghost:
  "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
```

New:
```
ghost:
  "hover:bg-[var(--glass-bg)] hover:text-foreground aria-expanded:bg-[var(--glass-bg)] aria-expanded:text-foreground",
```

- [ ] **Step 6: Commit**

```bash
git add components/ui/input.tsx components/ui/button.tsx
git commit -m "style: glass effect on Input and Button components"
```

---

### Task 9: Table — Glass Container

**Files:**
- Modify: `components/ui/table.tsx`

- [ ] **Step 1: Update Table container**

In `components/ui/table.tsx`, replace the Table container div className (line 12):

Old:
```
"relative w-full overflow-x-auto"
```

New:
```
"relative w-full overflow-x-auto rounded-xl bg-[var(--glass-bg)] ring-1 ring-[var(--glass-border)] backdrop-blur-xl"
```

- [ ] **Step 2: Update TableRow hover**

Replace the TableRow className (line 60):

Old:
```
"border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
```

New:
```
"border-b border-[var(--glass-border)] transition-colors hover:bg-[var(--glass-bg)] data-[state=selected]:bg-[var(--glass-bg)]"
```

- [ ] **Step 3: Update TableHeader border**

Replace the TableHeader className (line 26):

Old:
```
"[&_tr]:border-b"
```

New:
```
"[&_tr]:border-b [&_tr]:border-[var(--glass-border)]"
```

- [ ] **Step 4: Update TableFooter**

Replace the TableFooter className (line 47):

Old:
```
"border-t bg-muted/50 font-medium [&>tr]:last:border-b-0"
```

New:
```
"border-t border-[var(--glass-border)] bg-[var(--glass-bg)] font-medium [&>tr]:last:border-b-0"
```

- [ ] **Step 5: Commit**

```bash
git add components/ui/table.tsx
git commit -m "style: glass container for Table component"
```

---

### Task 10: Tabs, Badge, Separator, Sonner — Remaining UI

**Files:**
- Modify: `components/ui/tabs.tsx`
- Modify: `components/ui/badge.tsx`
- Modify: `components/ui/separator.tsx`
- Modify: `components/ui/sonner.tsx`

- [ ] **Step 1: Update TabsList default variant**

In `components/ui/tabs.tsx`, replace the `default` variant in `tabsListVariants` (line 31):

Old:
```
default: "bg-muted",
```

New:
```
default: "bg-[var(--glass-bg)] backdrop-blur-xl ring-1 ring-[var(--glass-border)]",
```

- [ ] **Step 2: Update TabsTrigger active state**

In `components/ui/tabs.tsx`, replace the active state line (line 63):

Old:
```
"data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
```

New:
```
"data-active:bg-[var(--glass-bg)] data-active:text-foreground data-active:backdrop-blur-xl",
```

- [ ] **Step 3: Update Badge default and secondary variants**

In `components/ui/badge.tsx`, replace the `default` variant (line 12):

Old:
```
default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
```

New:
```
default: "bg-primary/80 text-primary-foreground backdrop-blur-xl [a]:hover:bg-primary/60",
```

Replace the `secondary` variant (line 13-14):

Old:
```
secondary:
  "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
```

New:
```
secondary:
  "bg-[var(--glass-bg)] text-secondary-foreground backdrop-blur-xl [a]:hover:bg-accent",
```

Replace the `outline` variant (line 17-18):

Old:
```
outline:
  "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
```

New:
```
outline:
  "border-[var(--glass-border)] text-foreground [a]:hover:bg-[var(--glass-bg)] [a]:hover:text-muted-foreground",
```

- [ ] **Step 4: Update Separator**

In `components/ui/separator.tsx`, replace the className (line 17):

Old:
```
"shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch"
```

New:
```
"shrink-0 bg-[var(--glass-border)] data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch"
```

- [ ] **Step 5: Update Sonner toast styling**

In `components/ui/sonner.tsx`, update the style object (lines 33-37):

Old:
```tsx
style={
  {
    "--normal-bg": "var(--popover)",
    "--normal-text": "var(--popover-foreground)",
    "--normal-border": "var(--border)",
    "--border-radius": "var(--radius)",
  } as React.CSSProperties
}
```

New:
```tsx
style={
  {
    "--normal-bg": "var(--glass-bg)",
    "--normal-text": "var(--popover-foreground)",
    "--normal-border": "var(--glass-border)",
    "--border-radius": "var(--radius)",
  } as React.CSSProperties
}
```

- [ ] **Step 6: Commit**

```bash
git add components/ui/tabs.tsx components/ui/badge.tsx components/ui/separator.tsx components/ui/sonner.tsx
git commit -m "style: glass effect on Tabs, Badge, Separator, Sonner"
```

---

### Task 11: Final Build Verification

**Files:** None (verification only)

**Note:** Page files (`app/page.tsx`, `app/history/page.tsx`, `app/settings/page.tsx`) have no hardcoded background colors — they use Card/Table/Tabs components which inherit glass styling automatically. No page-level modifications needed.

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Successful build with no errors

- [ ] **Step 3: Visual verification**

Run: `npm run dev`
Verify in browser:
1. Gradient background visible on all pages
2. Glass cards with blur effect on home, history, settings
3. Nav bar has frosted glass effect with sticky positioning
4. Theme toggle works — light/dark switch
5. Dark mode gradient is darker warm sunset tones
6. All dropdowns (select, popover, calendar) have glass effect
7. Dialogs show glass effect with readable content
8. Toasts appear with glass styling
9. Text is readable in both modes

- [ ] **Step 4: Commit any remaining fixes**

If any visual issues found, fix and commit with appropriate message.
