# Monochrome Glass — 디자인 시스템 리프레시 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 코랄/핑크 글래스 무드를 무채색 다크 핀테크 글래스 무드로 전환하고, 페이지·컴포넌트 전반의 일관성을 정리한다(컨테이너 폭 통일, PageHeader/EmptyState/Skeleton 도입, DatePicker 분리, `window.confirm()` 제거).

**Architecture:** `globals.css` CSS 토큰 → `components/ui/*` primitive → 신규 공용 컴포넌트(DatePicker, EmptyState, Skeleton, PageHeader, ConfirmDialog) → `app/layout.tsx` 컨테이너·폰트 → 각 페이지(`/`, `/history`, `/settings`) 순으로 위→아래로 마이그레이션한다. Tailwind v4 `@theme` 매핑으로 시그널 색을 노출하고, `next/font/local`로 Pretendard를 자체 호스팅한다.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Base UI · motion/react · `pretendard` npm package · react-day-picker · sonner

**Spec:** `docs/superpowers/specs/2026-05-12-monochrome-glass-redesign-design.md`

---

## File Structure

### Modify
- `app/globals.css` — 색 토큰, surface 토큰, 라디우스, 그라데이션 제거, `@theme` 매핑
- `app/layout.tsx` — Pretendard 폰트, 컨테이너 `max-w-3xl`
- `components/ui/button.tsx` — variant/size 재정의, scale hover 제거
- `components/ui/card.tsx` — `surface` prop 추가
- `components/ui/input.tsx` — 토큰/높이 정리
- `components/ui/select.tsx` — 토큰 정리
- `components/ui/badge.tsx` — `default/fixed/ok/warn` variant
- `components/ui/dialog.tsx` — surface-elevated 적용
- `components/ui/alert-dialog.tsx` — surface-elevated 적용
- `components/ui/popover.tsx` — surface-elevated 적용
- `components/ui/calendar.tsx` — 다크 토큰 적용
- `components/ui/tabs.tsx` — segmented 룩
- `components/ui/sonner.tsx` — surface-elevated 적용
- `components/nav.tsx` — `--primary` 의존 제거
- `components/navigation-progress.tsx` — bar 색
- `components/page-transition.tsx` — duration/easing 통일
- `components/expense-form.tsx` — `<DatePicker>` 사용
- `components/expense-list.tsx` — `<DatePicker>`, `<ConfirmDialog>`, `<EmptyState>` 사용
- `components/budget-status.tsx` — Badge variant 교체, `flex-wrap`
- `components/settings/settings-tabs.tsx` — segmented 탭 적용
- `components/settings/account-settings.tsx` — Badge variant 교체
- `components/settings/category-settings.tsx` — Badge variant 교체
- `components/settings/budget-settings.tsx` — Badge variant 교체
- `app/page.tsx` — `<PageHeader>` 적용, Suspense
- `app/history/page.tsx` — `<PageHeader>` 적용, Suspense
- `app/settings/page.tsx` — `<PageHeader>` 적용, Suspense

### Create
- `components/ui/date-picker.tsx` — Popover + Calendar 캡슐화
- `components/ui/empty-state.tsx` — 빈 상태 패널
- `components/ui/skeleton.tsx` — 로딩 스켈레톤 박스
- `components/ui/confirm-dialog.tsx` — `<AlertDialog>` + `isPending` ESC 가드 래퍼
- `components/page-header.tsx` — caption + h1 + actions

### Install
- `pretendard` (npm) — variable woff2 폰트

### Not modified (out of scope)
- `lib/actions/*` · `lib/utils/*` · `lib/types.ts` — 데이터 계층 무변경
- 차트 라이브러리 추가 X
- 새 의존성 (lucide 외) 추가 X

---

## Task 1: Pretendard 폰트 설치

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: 패키지 설치**

Run:
```bash
npm install pretendard
```

Expected: `package.json`의 dependencies에 `"pretendard": "^x.y.z"` 추가됨.

- [ ] **Step 2: 설치 검증**

Run:
```bash
ls node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2
```

Expected: 파일이 존재한다고 출력됨. (없으면 패키지 버전 확인 후 재설치)

- [ ] **Step 3: 커밋**

```bash
git add package.json package-lock.json pnpm-lock.yaml
git commit -m "chore(deps): pretendard 패키지 추가"
```

---

## Task 2: globals.css — neutral / signal 색 토큰 재정의

**Files:**
- Modify: `app/globals.css`

이 task는 기존의 `:root`(라이트, 코랄 베이스)와 `.dark`(와인 베이스) 변수 전체를 무채색 + 시그널 + surface 3단계로 교체한다.

- [ ] **Step 1: globals.css 전체 교체**

`app/globals.css`를 다음 내용으로 **완전히 교체**한다.

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* Semantic mapping → Tailwind utilities */
  --color-background: var(--background);
  --color-foreground: var(--foreground);

  --color-card: var(--surface);
  --color-card-foreground: var(--foreground);

  --color-popover: var(--surface-elevated);
  --color-popover-foreground: var(--foreground);

  --color-primary: var(--foreground);
  --color-primary-foreground: var(--background);

  --color-secondary: var(--surface-subtle);
  --color-secondary-foreground: var(--foreground);

  --color-muted: var(--surface-subtle);
  --color-muted-foreground: var(--muted-foreground);

  --color-accent: var(--surface-subtle);
  --color-accent-foreground: var(--foreground);

  --color-destructive: var(--signal-neg);
  --color-destructive-foreground: var(--foreground);

  --color-border: var(--border);
  --color-input: var(--surface-subtle);
  --color-ring: var(--ring);

  /* Signal palette — exposed as Tailwind utility classes */
  --color-signal-pos: var(--signal-pos);
  --color-signal-pos-strong: var(--signal-pos-strong);
  --color-signal-neg: var(--signal-neg);
  --color-signal-neg-strong: var(--signal-neg-strong);

  --color-sidebar: var(--surface-subtle);
  --color-sidebar-foreground: var(--foreground);
  --color-sidebar-primary: var(--foreground);
  --color-sidebar-primary-foreground: var(--background);
  --color-sidebar-accent: var(--surface);
  --color-sidebar-accent-foreground: var(--foreground);
  --color-sidebar-border: var(--border);
  --color-sidebar-ring: var(--ring);

  --color-chart-1: var(--neutral-600);
  --color-chart-2: var(--neutral-500);
  --color-chart-3: var(--neutral-400);
  --color-chart-4: var(--neutral-300);
  --color-chart-5: var(--neutral-200);

  --font-sans: var(--font-pretendard), -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Segoe UI", sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;

  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

:root {
  /* Neutral grayscale — base palette (shared across modes) */
  --neutral-50:   #09090b;
  --neutral-100:  #0c0c10;
  --neutral-200:  #18181b;
  --neutral-300:  #27272a;
  --neutral-400:  #3f3f46;
  --neutral-500:  #52525b;
  --neutral-600:  #71717a;
  --neutral-700:  #a1a1aa;
  --neutral-800:  #d4d4d8;
  --neutral-900:  #e4e4e7;
  --neutral-950:  #f4f4f5;
  --neutral-1000: #fafafa;

  /* Light mode semantic + glass + signal */
  --background:        var(--neutral-1000);
  --foreground:        var(--neutral-100);
  --muted-foreground:  var(--neutral-500);
  --border:            rgba(0, 0, 0, 0.06);
  --ring:              rgba(0, 0, 0, 0.20);

  --surface-subtle:        rgba(255, 255, 255, 0.40);
  --surface-subtle-border: rgba(0, 0, 0, 0.04);
  --surface:               rgba(255, 255, 255, 0.65);
  --surface-border:        rgba(0, 0, 0, 0.06);
  --surface-elevated:        rgba(255, 255, 255, 0.85);
  --surface-elevated-border: rgba(0, 0, 0, 0.08);

  --signal-pos:        #15803d;
  --signal-pos-strong: #166534;
  --signal-neg:        #b91c1c;
  --signal-neg-strong: #991b1b;

  --radius: 0.625rem;
}

.dark {
  --background:        var(--neutral-50);
  --foreground:        var(--neutral-1000);
  --muted-foreground:  var(--neutral-600);
  --border:            rgba(255, 255, 255, 0.08);
  --ring:              rgba(255, 255, 255, 0.30);

  --surface-subtle:        rgba(255, 255, 255, 0.03);
  --surface-subtle-border: rgba(255, 255, 255, 0.06);
  --surface:               rgba(255, 255, 255, 0.05);
  --surface-border:        rgba(255, 255, 255, 0.08);
  --surface-elevated:        rgba(255, 255, 255, 0.08);
  --surface-elevated-border: rgba(255, 255, 255, 0.12);

  --signal-pos:        #86efac;
  --signal-pos-strong: #4ade80;
  --signal-neg:        #fca5a5;
  --signal-neg-strong: #f87171;
}

/* Backward-compat aliases — to be removed after primitive components migrate */
:root, .dark {
  --glass-bg:     var(--surface);
  --glass-border: var(--surface-border);
  --glass-blur:   20px;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
    font-variant-numeric: tabular-nums;
  }
  body {
    @apply text-foreground bg-background min-h-dvh;
    background-attachment: fixed;
  }
  html {
    @apply font-sans;
  }
  @media (prefers-reduced-motion: reduce) {
    [data-slot="button"] { transform: none !important; }
  }
}
```

핵심 변경:
- `:root` 라이트 + `.dark` 다크 양쪽이 무채색 베이스로 변경
- surface 3단계(`subtle/default/elevated`) 토큰 신설
- signal 4종 토큰 신설, `@theme`로 `bg-signal-pos` 등 utility class로 노출
- 그라데이션 배경 제거, 단색 `--background`
- `--radius` 1rem → 0.625rem로 감소
- `tabular-nums` 전역 적용
- 기존 `--glass-*` 변수는 임시 alias로 남겨둠(Task 5+에서 primitive 마이그레이션 완료 후 Task 21에서 제거)

- [ ] **Step 2: 빌드 확인**

Run:
```bash
npm run build
```

Expected: 빌드 성공. (이 시점에선 컴포넌트들이 아직 옛 토큰을 참조하므로 시각적으로 깨져 보이지만 빌드는 통과해야 한다.)

- [ ] **Step 3: 커밋**

```bash
git add app/globals.css
git commit -m "feat(design): 무채색 + 글래스 토큰 시스템으로 globals.css 재정의

- neutral grayscale 11단계, surface 3단계(subtle/default/elevated), signal 4종 토큰 도입
- 라이트/다크 모두 무채색 기반으로 전환, 그라데이션 배경 제거
- @theme로 signal-pos/neg 등 Tailwind utility class 노출
- --radius 1rem → 0.625rem, tabular-nums 전역 적용
- 기존 --glass-* 변수는 primitive 마이그레이션 동안 alias로 유지"
```

---

## Task 3: Pretendard 폰트 적용 — app/layout.tsx

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: app/layout.tsx 교체**

```tsx
import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { ThemeProvider } from 'next-themes'
import './globals.css'
import { Nav } from '@/components/nav'
import { Toaster } from '@/components/ui/sonner'
import { MotionProvider } from '@/components/motion-provider'
import { LoadingProvider } from '@/components/loading-provider'
import { NavigationProgressProvider } from '@/components/navigation-progress'
import { PageTransition } from '@/components/page-transition'

const pretendard = localFont({
  src: '../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2',
  variable: '--font-pretendard',
  display: 'swap',
  weight: '45 920',
})

export const metadata: Metadata = {
  title: '지출 기록',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning className={pretendard.variable}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <MotionProvider>
            <LoadingProvider>
              <NavigationProgressProvider>
                <Nav />
                <main className="container mx-auto max-w-3xl px-4 py-6">
                  <PageTransition>{children}</PageTransition>
                </main>
                <Toaster />
              </NavigationProgressProvider>
            </LoadingProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

변경점: Inter 폰트 제거, `next/font/local` + Pretendard Variable, `<main>` 컨테이너 `max-w-3xl` 통일.

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공.

- [ ] **Step 3: dev 서버에서 폰트 확인**

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 열고 한글 텍스트가 Pretendard로 렌더되는지 확인. 폰트가 Inter처럼 보이거나 시스템 sans면 import 경로 점검.

- [ ] **Step 4: 커밋**

```bash
git add app/layout.tsx
git commit -m "feat(layout): Pretendard Variable 폰트 도입 및 컨테이너 max-w-3xl 통일"
```

---

## Task 4: button.tsx — variant/size 재정의

**Files:**
- Modify: `components/ui/button.tsx`

- [ ] **Step 1: button.tsx 교체**

```tsx
"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent text-sm font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background hover:bg-foreground/90",
        outline:
          "bg-[var(--surface-subtle)] text-foreground border-[var(--surface-subtle-border)] backdrop-blur-[16px] hover:bg-[var(--surface)] hover:border-[var(--surface-border)] aria-expanded:bg-[var(--surface)]",
        secondary:
          "bg-[var(--surface-subtle)] text-foreground backdrop-blur-[16px] hover:bg-[var(--surface)]",
        ghost:
          "text-foreground hover:bg-[var(--surface-subtle)] aria-expanded:bg-[var(--surface-subtle)]",
        destructive:
          "bg-[var(--signal-neg)]/10 text-[var(--signal-neg)] border-[var(--signal-neg)]/20 hover:bg-[var(--signal-neg)]/16 focus-visible:ring-[var(--signal-neg)]/30",
        link:
          "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-sm px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-sm px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs": "size-6 rounded-sm [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-sm",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

주요 변경:
- default: `bg-foreground text-background` (다크에선 흰색, 라이트에선 검정)
- destructive: 시그널 빨강 텍스트·테두리만
- `hover:scale-*` 제거, `transition-colors`로 단순화
- `focus-visible:ring-3 ring-ring` 통일

- [ ] **Step 2: 빌드 + 린트**

```bash
npm run build && npm run lint
```

Expected: 둘 다 성공.

- [ ] **Step 3: dev 서버에서 버튼 시각 확인**

`http://localhost:3000`에서 "지출 기록" 버튼이 흰색 솔리드, 외곽선 버튼이 글래스 처리되는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add components/ui/button.tsx
git commit -m "feat(ui): button — 무채색 솔리드 default, 글래스 outline/secondary, 시그널 destructive"
```

---

## Task 5: card.tsx — surface prop 추가

**Files:**
- Modify: `components/ui/card.tsx`

- [ ] **Step 1: card.tsx 교체**

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

type Surface = "subtle" | "default" | "elevated"

const SURFACE_CLASS: Record<Surface, string> = {
  subtle:
    "bg-[var(--surface-subtle)] ring-[var(--surface-subtle-border)] backdrop-blur-[16px]",
  default:
    "bg-[var(--surface)] ring-[var(--surface-border)] backdrop-blur-[20px]",
  elevated:
    "bg-[var(--surface-elevated)] ring-[var(--surface-elevated-border)] backdrop-blur-[24px] shadow-[0_8px_32px_rgba(0,0,0,.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,.4)]",
}

function Card({
  className,
  size = "default",
  surface = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm"; surface?: Surface }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-surface={surface}
      className={cn(
        "group/card flex flex-col gap-4 overflow-hidden rounded-xl py-4 text-sm text-card-foreground ring-1 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        SURFACE_CLASS[surface],
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-base leading-snug font-semibold tracking-[-0.005em] group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-4 group-data-[size=sm]/card:px-3", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t border-[var(--surface-border)] bg-[var(--surface-subtle)] p-4 group-data-[size=sm]/card:p-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
```

- [ ] **Step 2: 빌드 + 린트**

```bash
npm run build && npm run lint
```

- [ ] **Step 3: 커밋**

```bash
git add components/ui/card.tsx
git commit -m "feat(ui): card — surface prop (subtle/default/elevated) 도입, 글래스 3단계"
```

---

## Task 6: input.tsx — 토큰 정리

**Files:**
- Modify: `components/ui/input.tsx`

- [ ] **Step 1: 현재 input.tsx 확인**

```bash
cat components/ui/input.tsx
```

- [ ] **Step 2: input.tsx 교체**

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-[var(--surface-subtle-border)] bg-[var(--surface-subtle)] px-3 py-1 text-sm text-foreground backdrop-blur-[16px] transition-colors outline-none",
        "placeholder:text-muted-foreground",
        "selection:bg-foreground selection:text-background",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "hover:bg-[var(--surface)]",
        "focus-visible:border-foreground/20 focus-visible:bg-[var(--surface)] focus-visible:ring-3 focus-visible:ring-ring",
        "aria-invalid:border-destructive/50 aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
```

높이 36px(h-9), surface-subtle 배경, focus 시 surface 배경 + ring.

- [ ] **Step 3: 빌드 + 린트**

```bash
npm run build && npm run lint
```

- [ ] **Step 4: 커밋**

```bash
git add components/ui/input.tsx
git commit -m "feat(ui): input — 36px 높이, surface-subtle 배경, focus 시 ring"
```

---

## Task 7: select.tsx — 토큰 정리

**Files:**
- Modify: `components/ui/select.tsx`

- [ ] **Step 1: 현재 select.tsx 읽기**

```bash
cat components/ui/select.tsx
```

`--glass-bg / --glass-border / --glass-blur` 또는 `bg-popover` 참조 부분을 surface 토큰으로 교체한다.

- [ ] **Step 2: select.tsx 패치**

`SelectTrigger`의 className에서 다음 패턴을 찾아 교체:
- `border-[var(--glass-border)]` → `border-[var(--surface-subtle-border)]`
- `bg-[var(--glass-bg)]` → `bg-[var(--surface-subtle)]`
- `backdrop-blur-(--glass-blur)` → `backdrop-blur-[16px]`
- 높이 `h-8`이면 `h-9`로 변경 (input과 일치)

`SelectContent`(popup) className:
- `bg-popover` 유지하되, popover 토큰이 이미 surface-elevated에 매핑됨
- `ring-1 ring-foreground/10` → `ring-1 ring-[var(--surface-elevated-border)]`
- `backdrop-blur-[24px]` 추가

`SelectItem`의 hover 배경을 `hover:bg-[var(--surface-subtle)]`로 통일.

- [ ] **Step 3: 빌드 + 린트**

```bash
npm run build && npm run lint
```

- [ ] **Step 4: 커밋**

```bash
git add components/ui/select.tsx
git commit -m "feat(ui): select — surface 토큰으로 트리거/팝업 정리, 높이 36px"
```

---

## Task 8: badge.tsx — 의미 기반 variant

**Files:**
- Modify: `components/ui/badge.tsx`

- [ ] **Step 1: badge.tsx 교체**

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 h-[22px] text-[11px] font-semibold tracking-tight whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--surface-subtle)] text-foreground border-[var(--surface-subtle-border)] backdrop-blur-[12px]",
        fixed:
          "bg-[var(--surface-subtle)] text-muted-foreground border-[var(--surface-subtle-border)] backdrop-blur-[12px]",
        ok:
          "bg-[var(--signal-pos)]/10 text-[var(--signal-pos)] border-[var(--signal-pos)]/20",
        warn:
          "bg-[var(--signal-neg)]/12 text-[var(--signal-neg)] border-[var(--signal-neg)]/22",
        outline:
          "bg-transparent text-foreground border-[var(--surface-border)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
```

기존 `secondary` / `destructive` variant 제거. 사용처는 후속 task에서 모두 교체.

- [ ] **Step 2: 빌드 — variant 오류 노출**

```bash
npm run build
```

Expected: `variant="secondary"` 또는 `variant="destructive"`를 쓰는 곳에서 타입 오류가 날 수 있음. **여기서 멈추고** 다음 step에서 사용처를 모두 교체한다.

- [ ] **Step 3: Badge 사용처 일괄 교체**

Run:
```bash
grep -rn 'variant="secondary"\|variant="destructive"\|variant="outline"' components/ app/ --include="*.tsx"
```

각 사용처에서 `<Badge variant="...">`만 다음 규칙으로 교체 (Button의 variant는 건드리지 말 것):
- `<Badge variant="secondary">` → `<Badge>` (default)
- `<Badge variant="destructive">` → `<Badge variant="warn">`
- `<Badge variant="outline">` → `<Badge variant="fixed">` 또는 의미상 맞는 것

예상 위치(spec 작성 시점 기준):
- `components/budget-status.tsx:76` — `variant={s.isOver ? 'destructive' : 'secondary'}` → `variant={s.isOver ? 'warn' : 'ok'}`
- `components/budget-status.tsx:95` — `variant={normalRemainingTotal < 0 ? 'destructive' : 'secondary'}` → `variant={normalRemainingTotal < 0 ? 'warn' : 'ok'}`
- `components/budget-status.tsx:112` — `variant="outline"` (고정 지출 표시) → `variant="fixed"`
- `components/budget-status.tsx:120` — `variant="outline"` (고정) → `variant="fixed"`

각 파일을 열고 Edit으로 패치. 모두 끝나면 다음 step.

- [ ] **Step 4: 빌드 + 린트**

```bash
npm run build && npm run lint
```

Expected: 둘 다 통과.

- [ ] **Step 5: 커밋**

```bash
git add components/ui/badge.tsx components/budget-status.tsx
git commit -m "feat(ui): badge variant 의미 기반(default/fixed/ok/warn) 재명명 + 사용처 교체"
```

---

## Task 9: dialog.tsx · alert-dialog.tsx — surface-elevated

**Files:**
- Modify: `components/ui/dialog.tsx`, `components/ui/alert-dialog.tsx`

- [ ] **Step 1: dialog.tsx 패치**

`cat components/ui/dialog.tsx`로 현재 코드 확인 후, `DialogContent`의 className에서:
- `bg-popover` 유지(popover 토큰 = surface-elevated에 매핑됨)
- `backdrop-blur-*` 가 없으면 `backdrop-blur-[24px]` 추가
- `ring-1 ring-foreground/10` 또는 비슷한 부분을 `ring-1 ring-[var(--surface-elevated-border)]`로

`DialogOverlay`의 배경을 `bg-black/40` (다크에서) 또는 `bg-black/30`로, `backdrop-blur-sm` 추가.

- [ ] **Step 2: alert-dialog.tsx 패치**

`AlertDialogContent` line 55의 className에서:
- `bg-popover text-popover-foreground` 유지
- `ring-1 ring-foreground/10` → `ring-1 ring-[var(--surface-elevated-border)]`
- `backdrop-blur-[24px]` 추가
- `shadow-[0_20px_60px_rgba(0,0,0,.5)]` 추가

`AlertDialogOverlay` line 33:
- `bg-black/10` → `bg-black/40`
- `supports-backdrop-filter:backdrop-blur-xs` 유지

- [ ] **Step 3: 빌드 + 린트**

```bash
npm run build && npm run lint
```

- [ ] **Step 4: 커밋**

```bash
git add components/ui/dialog.tsx components/ui/alert-dialog.tsx
git commit -m "feat(ui): dialog/alert-dialog — surface-elevated 글래스 + 강한 블러"
```

---

## Task 10: popover.tsx · calendar.tsx — 토큰 정리

**Files:**
- Modify: `components/ui/popover.tsx`, `components/ui/calendar.tsx`

- [ ] **Step 1: popover.tsx 패치**

`cat components/ui/popover.tsx`로 확인. PopoverContent의 className에서:
- `bg-popover` 유지
- `backdrop-blur-*` → `backdrop-blur-[24px]`
- ring 색상을 `ring-[var(--surface-elevated-border)]`로

- [ ] **Step 2: calendar.tsx 패치**

`cat components/ui/calendar.tsx`로 확인. `react-day-picker`의 v9 prop 구조를 따라:
- `today` 셀: `text-foreground font-semibold`
- `selected` 셀: `bg-foreground text-background hover:bg-foreground/90`
- `outside` 셀: `text-muted-foreground/40`
- hover: `hover:bg-[var(--surface-subtle)]`
- 네비게이션 버튼: outline variant 룩

기존 `--primary` 의존하는 부분을 모두 `--foreground`로 변경(다크에선 흰색 셀, 라이트에선 검정 셀).

- [ ] **Step 3: 빌드 + 린트**

```bash
npm run build && npm run lint
```

- [ ] **Step 4: dev 서버에서 캘린더 시각 확인**

`http://localhost:3000`에서 지출 입력 폼의 날짜 선택을 클릭, 캘린더가 다크 글래스로 렌더되고 오늘/선택 셀이 흰색 솔리드로 보이는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add components/ui/popover.tsx components/ui/calendar.tsx
git commit -m "feat(ui): popover/calendar — 무채색 토큰 적용, 선택 셀 foreground 솔리드"
```

---

## Task 11: tabs.tsx — segmented 룩

**Files:**
- Modify: `components/ui/tabs.tsx`

- [ ] **Step 1: tabs.tsx 패치**

`cat components/ui/tabs.tsx`로 현재 구조 확인. `TabsList`와 `TabsTrigger`의 className을 다음으로 교체:

```tsx
// TabsList
"inline-flex h-9 items-center rounded-md bg-[var(--surface-subtle)] p-[3px] text-muted-foreground border border-[var(--surface-subtle-border)] backdrop-blur-[16px] gap-[2px]"

// TabsTrigger
"inline-flex h-7 items-center justify-center whitespace-nowrap rounded-sm px-3 text-[13px] font-medium text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[var(--surface)] data-[state=active]:text-foreground data-[state=active]:ring-1 data-[state=active]:ring-[var(--surface-border)]"
```

(현재 base-ui 또는 radix tabs API에 맞춰 prop 이름 조정 필요. 활성 상태 셀렉터는 `data-[state=active]:` 또는 `data-selected:` 중 사용 중인 것 확인.)

- [ ] **Step 2: 빌드 + 린트**

```bash
npm run build && npm run lint
```

- [ ] **Step 3: dev 서버에서 설정 페이지 탭 확인**

`http://localhost:3000/settings`로 가서 탭이 segmented 룩(전체 배경 + 활성 탭만 surface)인지 확인.

- [ ] **Step 4: 커밋**

```bash
git add components/ui/tabs.tsx
git commit -m "feat(ui): tabs — segmented control 룩 적용"
```

---

## Task 12: DatePicker 신규 컴포넌트

**Files:**
- Create: `components/ui/date-picker.tsx`

- [ ] **Step 1: components/ui/date-picker.tsx 생성**

```tsx
'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface DatePickerProps {
  value: Date
  onChange: (date: Date) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = '날짜 선택',
  disabled,
  className,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          'flex h-9 w-full items-center justify-start rounded-md border border-[var(--surface-subtle-border)] bg-[var(--surface-subtle)] px-3 py-1 text-sm text-foreground backdrop-blur-[16px] transition-colors',
          'hover:bg-[var(--surface)]',
          'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:border-foreground/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !value && 'text-muted-foreground',
          className
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
        {value ? format(value, 'yyyy년 MM월 dd일', { locale: ko }) : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => d && onChange(d)}
          initialFocus
          locale={ko}
        />
      </PopoverContent>
    </Popover>
  )
}
```

- [ ] **Step 2: 빌드 + 린트**

```bash
npm run build && npm run lint
```

Expected: 사용처 없어도 컴포넌트 자체는 컴파일 통과.

- [ ] **Step 3: 커밋**

```bash
git add components/ui/date-picker.tsx
git commit -m "feat(ui): DatePicker 컴포넌트 추가 (Popover + Calendar 캡슐화)"
```

---

## Task 13: EmptyState 신규 컴포넌트

**Files:**
- Create: `components/ui/empty-state.tsx`

- [ ] **Step 1: components/ui/empty-state.tsx 생성**

```tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--surface-subtle-border)] bg-[var(--surface-subtle)] px-6 py-9 text-center backdrop-blur-[16px]',
        className
      )}
    >
      {icon && (
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface)] text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
```

- [ ] **Step 2: 빌드 + 린트**

```bash
npm run build && npm run lint
```

- [ ] **Step 3: 커밋**

```bash
git add components/ui/empty-state.tsx
git commit -m "feat(ui): EmptyState 공용 컴포넌트 추가"
```

---

## Task 14: Skeleton 신규 컴포넌트

**Files:**
- Create: `components/ui/skeleton.tsx`

- [ ] **Step 1: components/ui/skeleton.tsx 생성**

```tsx
import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'animate-pulse rounded-md bg-foreground/5',
        className
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 2: 빌드 + 린트**

```bash
npm run build && npm run lint
```

- [ ] **Step 3: 커밋**

```bash
git add components/ui/skeleton.tsx
git commit -m "feat(ui): Skeleton 공용 컴포넌트 추가"
```

---

## Task 15: PageHeader 신규 컴포넌트

**Files:**
- Create: `components/page-header.tsx`

- [ ] **Step 1: components/page-header.tsx 생성**

```tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  caption?: string
  title: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ caption, title, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'mb-5 flex items-end justify-between gap-4 border-b border-[var(--surface-subtle-border)] pb-4',
        className
      )}
    >
      <div className="flex flex-col gap-1">
        {caption && (
          <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{caption}</p>
        )}
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-foreground">
          {title}
        </h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
```

- [ ] **Step 2: 빌드 + 린트**

```bash
npm run build && npm run lint
```

- [ ] **Step 3: 커밋**

```bash
git add components/page-header.tsx
git commit -m "feat(ui): PageHeader 공용 컴포넌트 추가 (caption + title + actions)"
```

---

## Task 16: ConfirmDialog 신규 컴포넌트

**Files:**
- Create: `components/ui/confirm-dialog.tsx`

`window.confirm()`을 대체하는 AlertDialog 래퍼. 진행 중인 비동기 작업이 있을 때 ESC/외부 클릭으로 닫히지 않도록 가드한다.

- [ ] **Step 1: components/ui/confirm-dialog.tsx 생성**

```tsx
'use client'

import * as React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  isPending?: boolean
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  destructive = false,
  isPending = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        // 진행 중에는 외부 dismiss 차단
        if (isPending && !v) return
        onOpenChange(v)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            variant={destructive ? 'destructive' : 'default'}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

주의: 현재 `AlertDialogAction`은 `Button` props를 받으므로 `variant` 전달 가능 (alert-dialog.tsx line 144~154 참고).

- [ ] **Step 2: 빌드 + 린트**

```bash
npm run build && npm run lint
```

- [ ] **Step 3: 커밋**

```bash
git add components/ui/confirm-dialog.tsx
git commit -m "feat(ui): ConfirmDialog 래퍼 추가 (window.confirm 대체용, isPending ESC 가드 내장)"
```

---

## Task 17: nav.tsx — `--primary` 의존 제거

**Files:**
- Modify: `components/nav.tsx`

- [ ] **Step 1: nav.tsx 교체**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { useNavigationProgress } from '@/components/navigation-progress'

const links = [
  { href: '/', label: '지출 입력' },
  { href: '/history', label: '지출 내역' },
  { href: '/settings', label: '설정' },
]

export function Nav() {
  const pathname = usePathname()
  const navigationProgress = useNavigationProgress()
  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--surface-elevated-border)] bg-[var(--surface-elevated)] backdrop-blur-[24px]">
      <div className="container mx-auto max-w-3xl flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <span className="text-base font-bold tracking-tight">지출 기록</span>
          <div className="flex gap-4">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => pathname !== href && navigationProgress?.start()}
                className={cn(
                  'text-sm font-medium transition-colors',
                  pathname === href
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
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

- [ ] **Step 2: 빌드 + 린트**

```bash
npm run build && npm run lint
```

- [ ] **Step 3: 커밋**

```bash
git add components/nav.tsx
git commit -m "feat(nav): surface-elevated 적용, --primary 의존 제거(foreground 기반 활성 표시)"
```

---

## Task 18: navigation-progress.tsx — bar 색

**Files:**
- Modify: `components/navigation-progress.tsx`

- [ ] **Step 1: 현재 파일 읽기**

```bash
cat components/navigation-progress.tsx
```

- [ ] **Step 2: bar 클래스 변경**

progress bar의 배경 색을 `bg-primary` 또는 `bg-[var(--primary)]`에서 `bg-foreground`로 변경. (진행률에 따라 width를 채우는 div를 찾아 클래스 교체)

- [ ] **Step 3: 빌드 + 린트**

```bash
npm run build && npm run lint
```

- [ ] **Step 4: 커밋**

```bash
git add components/navigation-progress.tsx
git commit -m "feat(nav): navigation progress bar 색을 foreground 기반으로"
```

---

## Task 19: sonner.tsx — surface-elevated

**Files:**
- Modify: `components/ui/sonner.tsx`

- [ ] **Step 1: sonner.tsx 교체**

```tsx
"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      duration={3500}
      icons={{
        success: <CircleCheckIcon className="size-4 text-[var(--signal-pos)]" />,
        info: <InfoIcon className="size-4 text-muted-foreground" />,
        warning: <TriangleAlertIcon className="size-4 text-[var(--signal-neg)]" />,
        error: <OctagonXIcon className="size-4 text-[var(--signal-neg)]" />,
        loading: <Loader2Icon className="size-4 animate-spin text-muted-foreground" />,
      }}
      style={
        {
          "--normal-bg": "var(--surface-elevated)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--surface-elevated-border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast backdrop-blur-[24px]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
```

- [ ] **Step 2: 빌드 + 린트**

```bash
npm run build && npm run lint
```

- [ ] **Step 3: dev 서버에서 토스트 확인**

지출 입력 후 success 토스트가 무채색 글래스 + 작은 초록 점 아이콘으로 렌더되는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add components/ui/sonner.tsx
git commit -m "feat(toast): surface-elevated 글래스 적용, signal 색은 아이콘에만"
```

---

## Task 20: page-transition.tsx · 모션 정책 정제

**Files:**
- Modify: `components/page-transition.tsx`
- (선택) Modify: `components/expense-form.tsx`, `components/budget-status.tsx`, `components/expense-list.tsx`, `components/settings/settings-tabs.tsx`의 motion duration/easing

- [ ] **Step 1: page-transition.tsx 읽고 duration·easing 통일**

```bash
cat components/page-transition.tsx
```

`transition`의 `duration` 값을 0.25, `ease`를 `[0.16, 1, 0.3, 1]`로 변경.

- [ ] **Step 2: 다른 motion 사용처 일괄 점검**

```bash
grep -rn "duration: 0\." components/ --include="*.tsx"
```

각 사용처에서 `duration: 0.4` → `0.25`, `ease: 'easeOut'` → `ease: [0.16, 1, 0.3, 1]`로 변경. 다음 파일들이 후보:
- `components/expense-form.tsx`
- `components/budget-status.tsx`
- `components/expense-list.tsx` (rowVariants 등)
- `components/settings/settings-tabs.tsx`

`stagger` 값은 0.05 유지.

- [ ] **Step 3: 빌드 + 린트**

```bash
npm run build && npm run lint
```

- [ ] **Step 4: 커밋**

```bash
git add components/page-transition.tsx components/expense-form.tsx components/budget-status.tsx components/expense-list.tsx components/settings/settings-tabs.tsx
git commit -m "refactor(motion): duration 0.4→0.25s, easing easeOutExpo로 통일"
```

---

## Task 21: app/page.tsx — PageHeader + Suspense

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: app/page.tsx 교체**

```tsx
import { Suspense } from 'react'
import { getCurrentYearMonth } from '@/lib/utils/date-range'
import { getAccounts } from '@/lib/actions/account'
import { getCategories } from '@/lib/actions/category'
import { getBudgetsByMonth } from '@/lib/actions/budget'
import { getExpensesByMonth } from '@/lib/actions/expense'
import { ExpenseForm } from '@/components/expense-form'
import { BudgetStatusCard } from '@/components/budget-status'
import { PageHeader } from '@/components/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { calculateBudgetStatus, groupExpensesByCategory } from '@/lib/utils/budget'
import type { BudgetStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

function formatCaption(yearMonth: string) {
  const [y, m] = yearMonth.split('-')
  return `${y}년 ${Number(m)}월`
}

async function HomeContent() {
  const currentYearMonth = getCurrentYearMonth()

  const [accounts, categories, budgets, expenses] = await Promise.all([
    getAccounts(),
    getCategories(),
    getBudgetsByMonth(currentYearMonth),
    getExpensesByMonth(currentYearMonth),
  ])

  const spentByCategory = groupExpensesByCategory(expenses)

  const budgetStatuses: BudgetStatus[] = budgets
    .map((b) => {
      const category = categories.find((c) => c.id === b.categoryId)
      if (!category) return null
      const account = accounts.find((a) => a.id === category.accountId)
      if (!account) return null

      if (category.isFixed) {
        return {
          categoryId: b.categoryId,
          categoryName: category.name,
          accountId: account.id,
          accountName: account.name,
          budget: b.amount,
          spent: b.amount,
          remaining: 0,
          isOver: false,
          isFixed: true,
        }
      }

      const spent = spentByCategory[b.categoryId] ?? 0
      return {
        categoryId: b.categoryId,
        categoryName: category.name,
        accountId: account.id,
        accountName: account.name,
        ...calculateBudgetStatus(b.amount, spent),
        isFixed: false,
      }
    })
    .filter((s): s is BudgetStatus => s !== null)

  return (
    <div className="space-y-5">
      <PageHeader caption={formatCaption(currentYearMonth)} title="지출 입력" />
      <ExpenseForm accounts={accounts} categories={categories.filter((c) => !c.isFixed)} />
      <BudgetStatusCard statuses={budgetStatuses} />
    </div>
  )
}

function HomeSkeleton() {
  return (
    <div className="space-y-5">
      <div className="mb-5 flex flex-col gap-1 border-b border-[var(--surface-subtle-border)] pb-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-32" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  )
}
```

기존 `<div className="max-w-2xl mx-auto">` 제거 → layout의 컨테이너 사용.

- [ ] **Step 2: 빌드 + 린트**

```bash
npm run build && npm run lint
```

- [ ] **Step 3: dev 서버에서 홈 페이지 확인**

`http://localhost:3000`에서 PageHeader가 표시되고 컨테이너 폭이 일관되는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add app/page.tsx
git commit -m "refactor(home): PageHeader + Suspense/Skeleton 적용, 자체 max-w 제거"
```

---

## Task 22: expense-form.tsx — DatePicker 사용

**Files:**
- Modify: `components/expense-form.tsx`

- [ ] **Step 1: expense-form.tsx 패치**

다음 부분을 교체:

기존(line 86~106):
```tsx
<div className="space-y-1">
  <Label>날짜</Label>
  <Popover>
    <PopoverTrigger
      className={cn(
        'flex h-9 w-full items-center justify-start rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        !date && 'text-muted-foreground'
      )}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {date ? format(date, 'yyyy년 MM월 dd일', { locale: ko }) : '날짜 선택'}
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0">
      <Calendar
        mode="single"
        selected={date}
        onSelect={(d) => d && setDate(d)}
        initialFocus
        locale={ko}
      />
    </PopoverContent>
  </Popover>
</div>
```

새 코드:
```tsx
<div className="space-y-1">
  <Label>날짜</Label>
  <DatePicker value={date} onChange={setDate} />
</div>
```

import 정리 (제거: `Popover`, `PopoverContent`, `PopoverTrigger`, `Calendar`, `CalendarIcon`, `cn`, `format`, `ko`이 다른 곳에 안 쓰이면 제거. 추가: `DatePicker`).

- [ ] **Step 2: 빌드 + 린트**

```bash
npm run build && npm run lint
```

- [ ] **Step 3: dev 서버에서 날짜 선택 확인**

지출 입력 폼에서 날짜 선택이 정상 동작하는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add components/expense-form.tsx
git commit -m "refactor(expense): expense-form에서 DatePicker 컴포넌트 사용"
```

---

## Task 23: budget-status.tsx — flex-wrap

**Files:**
- Modify: `components/budget-status.tsx`

Task 8에서 Badge variant는 이미 교체했다. 여기서는 inline 정보가 모바일에서 줄바꿈되도록 처리.

- [ ] **Step 1: budget-status.tsx 패치**

line 71~80(`<div className="flex items-center justify-between">`) 등 예산 항목 row의 우측 `<div className="flex items-center gap-3 text-sm">`을 `<div className="flex flex-wrap justify-end items-center gap-2 gap-y-1 text-sm">`로 변경.

같은 패턴이 line 90~99 (합계), line 116~122 (고정 지출 항목), line 124~129 (소계), line 134~138 (고정 합계)에도 적용. 우측 정보 컨테이너에 `flex-wrap` + `justify-end`를 추가.

- [ ] **Step 2: 빌드 + 린트**

```bash
npm run build && npm run lint
```

- [ ] **Step 3: dev 서버 모바일 폭에서 확인**

브라우저 dev tools에서 폭 375px로 축소 후 예산 카드 행이 자연스럽게 줄바꿈되는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add components/budget-status.tsx
git commit -m "refactor(budget): 예산 행 우측 정보 flex-wrap으로 모바일 줄바꿈"
```

---

## Task 24: app/history/page.tsx — PageHeader + Suspense

**Files:**
- Modify: `app/history/page.tsx`

- [ ] **Step 1: app/history/page.tsx 교체**

```tsx
import { Suspense } from 'react'
import { getCurrentYearMonth } from '@/lib/utils/date-range'
import { getAccounts } from '@/lib/actions/account'
import { getCategories } from '@/lib/actions/category'
import { getExpensesByMonth } from '@/lib/actions/expense'
import { ExpenseList } from '@/components/expense-list'
import { MonthSelector } from '@/components/month-selector'
import { PageHeader } from '@/components/page-header'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  searchParams: Promise<{ month?: string }>
}

function formatCaption(yearMonth: string) {
  const [y, m] = yearMonth.split('-')
  return `${y}년 ${Number(m)}월`
}

async function HistoryContent({ yearMonth }: { yearMonth: string }) {
  const [accounts, categories, expenses] = await Promise.all([
    getAccounts(),
    getCategories(),
    getExpensesByMonth(yearMonth),
  ])

  return (
    <>
      <PageHeader
        caption={formatCaption(yearMonth)}
        title="지출 내역"
        actions={<MonthSelector currentMonth={yearMonth} />}
      />
      <ExpenseList expenses={expenses} accounts={accounts} categories={categories} />
    </>
  )
}

function HistorySkeleton() {
  return (
    <div className="space-y-4">
      <div className="mb-5 flex items-end justify-between border-b border-[var(--surface-subtle-border)] pb-4">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-32" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

export default async function HistoryPage({ searchParams }: Props) {
  const { month } = await searchParams
  const yearMonth = month ?? getCurrentYearMonth()

  return (
    <Suspense key={yearMonth} fallback={<HistorySkeleton />}>
      <HistoryContent yearMonth={yearMonth} />
    </Suspense>
  )
}
```

기존 `<div className="max-w-4xl mx-auto">` 제거 → layout 컨테이너 사용. (히스토리만 4xl 였던 것 통일)

- [ ] **Step 2: 빌드 + 린트**

```bash
npm run build && npm run lint
```

- [ ] **Step 3: 커밋**

```bash
git add app/history/page.tsx
git commit -m "refactor(history): PageHeader + Suspense/Skeleton, 자체 max-w 제거"
```

---

## Task 25: expense-list.tsx — DatePicker · ConfirmDialog · EmptyState

**Files:**
- Modify: `components/expense-list.tsx`

- [ ] **Step 1: import 정리**

상단 import에서 `Calendar`, `Popover`, `PopoverContent`, `PopoverTrigger`, `CalendarIcon`, `cn`(다른 데서 안 쓰면) 제거. 다음을 추가:

```tsx
import { DatePicker } from '@/components/ui/date-picker'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ReceiptIcon } from 'lucide-react'
```

- [ ] **Step 2: handleDelete를 ConfirmDialog 기반으로 교체**

기존(line 94~108):
```tsx
const handleDelete = (id: string) => {
  if (!confirm('이 지출 기록을 삭제하시겠습니까?')) return
  const backup = localExpenses
  setLocalExpenses((prev) => prev.filter((e) => e.id !== id))
  executeDelete(async () => {
    try {
      await deleteExpense(id)
      toast.success('지출이 삭제됐습니다')
    } catch {
      setLocalExpenses(backup)
      toast.error('지출 삭제에 실패했습니다')
    }
  })
}
```

새 코드 — 상태에 삭제 대상 보관 + ConfirmDialog 렌더:

```tsx
const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)

const requestDelete = (expense: Expense) => setDeleteTarget(expense)

const handleConfirmDelete = () => {
  if (!deleteTarget) return
  const target = deleteTarget
  const backup = localExpenses
  setLocalExpenses((prev) => prev.filter((e) => e.id !== target.id))
  executeDelete(async () => {
    try {
      await deleteExpense(target.id)
      toast.success('지출이 삭제됐습니다')
      setDeleteTarget(null)
    } catch {
      setLocalExpenses(backup)
      toast.error('지출 삭제에 실패했습니다')
      setDeleteTarget(null)
    }
  })
}
```

JSX에서 `<Button ... onClick={() => handleDelete(expense.id)}>`를 `onClick={() => requestDelete(expense)}`로 변경.

- [ ] **Step 3: ConfirmDialog 렌더 추가**

return JSX 가장 아래(닫는 Fragment `</>` 직전)에 추가:

```tsx
<ConfirmDialog
  open={!!deleteTarget}
  onOpenChange={(v) => !v && setDeleteTarget(null)}
  title="지출 기록을 삭제할까요?"
  description={deleteTarget ? `${deleteTarget.title} · ${deleteTarget.amount.toLocaleString()}원` : undefined}
  confirmLabel="삭제"
  destructive
  onConfirm={handleConfirmDelete}
/>
```

- [ ] **Step 4: 빈 상태를 EmptyState로 교체**

Table 본문에서 `filteredExpenses.length === 0` 분기(line 177~183)를 다음으로:

조건부 렌더를 Table 밖으로 옮긴다 — 길이 0이면 Table 대신 EmptyState:

```tsx
{filteredExpenses.length === 0 ? (
  <EmptyState
    icon={<ReceiptIcon className="size-5" />}
    title={(filterAccountId || filterCategoryId) ? '필터 조건에 맞는 기록이 없습니다' : '지출 기록이 없습니다'}
    description={(filterAccountId || filterCategoryId) ? '필터를 조정해 보세요.' : '이번 달엔 아직 기록된 지출이 없어요.'}
  />
) : (
  <Table>
    {/* ...existing table... */}
  </Table>
)}
```

- [ ] **Step 5: 수정 다이얼로그의 DatePicker 적용**

기존 Dialog 안의 Popover/Calendar 블록(line 228~241)을 다음으로 교체:

```tsx
<div className="space-y-1">
  <Label>날짜</Label>
  <DatePicker value={editDate} onChange={setEditDate} />
</div>
```

- [ ] **Step 6: 빌드 + 린트**

```bash
npm run build && npm run lint
```

- [ ] **Step 7: dev 서버에서 동작 확인**

`/history`에서:
- 삭제 버튼 클릭 시 ConfirmDialog가 뜨고, 확인하면 항목이 사라지는지
- 빈 달로 이동했을 때 EmptyState가 보이는지
- 수정 다이얼로그에서 날짜 변경이 되는지

- [ ] **Step 8: 커밋**

```bash
git add components/expense-list.tsx
git commit -m "refactor(history): DatePicker/ConfirmDialog/EmptyState 적용, window.confirm 제거"
```

---

## Task 26: app/settings/page.tsx — PageHeader + Suspense

**Files:**
- Modify: `app/settings/page.tsx`

- [ ] **Step 1: 현재 파일 읽기**

```bash
cat app/settings/page.tsx
```

- [ ] **Step 2: 다음 패턴으로 교체**

```tsx
import { Suspense } from 'react'
import { /* 기존 fetch 함수들 그대로 유지 */ } from '@/lib/actions/...'
import { SettingsTabs } from '@/components/settings/settings-tabs'
import { PageHeader } from '@/components/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { getCurrentYearMonth } from '@/lib/utils/date-range'

export const dynamic = 'force-dynamic'

async function SettingsContent() {
  /* 기존 fetch 로직 그대로 (Promise.all 등) */
  return (
    <>
      <PageHeader caption="설정" title="계좌 · 카테고리 · 예산 관리" />
      <SettingsTabs {/* 기존 props 그대로 */} />
    </>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="mb-5 flex flex-col gap-1 border-b border-[var(--surface-subtle-border)] pb-4">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-7 w-64" />
      </div>
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  )
}
```

기존 page.tsx의 fetch 로직(getAccounts, getCategories 등 호출과 props 가공)을 그대로 `SettingsContent` 내부로 옮긴다. 기존 max-w-* 제거.

- [ ] **Step 3: 빌드 + 린트**

```bash
npm run build && npm run lint
```

- [ ] **Step 4: 커밋**

```bash
git add app/settings/page.tsx
git commit -m "refactor(settings): PageHeader + Suspense/Skeleton, 자체 max-w 제거"
```

---

## Task 27: settings 컴포넌트 — Badge variant 마무리 점검

**Files:**
- Modify: `components/settings/account-settings.tsx`, `components/settings/category-settings.tsx`, `components/settings/budget-settings.tsx`

Task 8에서 budget-status는 이미 처리. settings 안의 잔여 사용처만 정리.

- [ ] **Step 1: 잔여 Badge 사용처 grep**

```bash
grep -n "Badge" components/settings/*.tsx
```

각 파일에서 `variant="outline"` 또는 `variant="secondary"`를 `<Badge>` 또는 의미상 맞는 (`fixed`/`ok`/`warn`)로 변경.

- [ ] **Step 2: 빌드 + 린트**

```bash
npm run build && npm run lint
```

- [ ] **Step 3: 커밋**

```bash
git add components/settings/
git commit -m "refactor(settings): Badge variant 의미 기반으로 통일"
```

---

## Task 28: glassmorphism alias 정리 + 시각 검증

**Files:**
- Modify: `app/globals.css`
- (필요 시) 잔여 `--glass-*` 참조 정리

- [ ] **Step 1: 잔여 `--glass-` 사용처 점검**

```bash
grep -rn "var(--glass-" components/ app/ --include="*.tsx" --include="*.ts" --include="*.css"
```

남아있는 곳이 있으면 다음으로 교체:
- `var(--glass-bg)` → `var(--surface)`
- `var(--glass-border)` → `var(--surface-border)`
- `backdrop-blur-(--glass-blur)` → `backdrop-blur-[20px]`

- [ ] **Step 2: globals.css에서 alias 블록 제거**

다음 블록 삭제:

```css
/* Backward-compat aliases — to be removed after primitive components migrate */
:root, .dark {
  --glass-bg:     var(--surface);
  --glass-border: var(--surface-border);
  --glass-blur:   20px;
}
```

- [ ] **Step 3: 빌드 + 린트 + 테스트**

```bash
npm run build && npm run lint && npm test
```

Expected: 모두 통과.

- [ ] **Step 4: dev 서버 전체 페이지 시각 회귀**

`http://localhost:3000`에서 다음을 차례로 확인:
- [ ] 홈: PageHeader, 입력 폼(글래스 카드), 예산 카드(Badge ok/warn 색), 토스트
- [ ] 내역: PageHeader + MonthSelector actions, 필터, 테이블, 삭제 ConfirmDialog, 수정 Dialog의 DatePicker
- [ ] 설정: PageHeader, segmented 탭, 각 탭 내용
- [ ] 다크/라이트 토글 모두 무채색 글래스로 유지
- [ ] 모바일 폭(375px)에서 예산 카드 행이 줄바꿈됨

- [ ] **Step 5: 커밋**

```bash
git add app/globals.css
git commit -m "chore(design): --glass-* 호환 alias 제거 (surface 토큰으로 마이그레이션 완료)"
```

---

## Task 29: 최종 검증

- [ ] **Step 1: 전체 빌드/린트/테스트**

```bash
npm run build && npm run lint && npm test
```

Expected: 모두 통과. 실패하면 해당 task로 돌아가 수정.

- [ ] **Step 2: spec 대조 자가 점검**

`docs/superpowers/specs/2026-05-12-monochrome-glass-redesign-design.md`를 다시 읽고 다음 체크리스트:
- [ ] 코랄 그라데이션 → 단색 무채색 배경 ✓
- [ ] surface 3단계 토큰 ✓
- [ ] Pretendard Variable ✓
- [ ] tabular-nums 전역 ✓
- [ ] Button variant 5종 (primary 컨셉 제거) ✓
- [ ] Badge variant: default/fixed/ok/warn ✓
- [ ] DatePicker 컴포넌트화 ✓
- [ ] `window.confirm()` 0회 (grep 확인) ✓
- [ ] PageHeader 모든 페이지 적용 ✓
- [ ] EmptyState · Skeleton 적용 ✓
- [ ] segmented tabs ✓
- [ ] motion duration 0.25, easeOutExpo ✓
- [ ] 버튼 hover scale 제거 ✓
- [ ] 컨테이너 max-w-3xl 통일 ✓

```bash
grep -rn "confirm(" components/ app/ --include="*.tsx" --include="*.ts"
```
Expected: 결과 없음(또는 `useConfirmDialog` 같은 컴포넌트 이름만).

```bash
grep -rn "max-w-2xl\|max-w-4xl" app/ --include="*.tsx"
```
Expected: 결과 없음 (모두 layout의 컨테이너 사용).

- [ ] **Step 3: 최종 커밋 (필요 시)**

남은 변경이 있으면:
```bash
git status
git add -A
git commit -m "chore: 최종 정리"
```

없으면 skip.

---

## Self-Review Checklist (작성자 자가 검토 결과)

다음 항목들을 작성 후 검토하여 inline으로 수정함:

- **Spec 커버리지**: 모든 스코프(globals.css 토큰, primitive 8종, 신규 5종, layout, page 3개, motion/toast/nav)에 task 매핑 ✓
- **Placeholder 없음**: 모든 step에 구체 코드/명령 명시. "TBD/TODO" 없음 ✓
- **Type consistency**: `surface` prop 값(`subtle/default/elevated`), Badge variant(`default/fixed/ok/warn`), Button variant 등 전 task에서 동일 명명 사용 ✓
- **CSS 토큰 일관성**: `--surface*` 변수가 Task 2에서 정의된 그대로 Task 4~17에서 참조됨 ✓
- **Glass alias 제거 순서**: Task 28에서 `--glass-*` 정리 시점이 모든 primitive 마이그레이션 완료 이후로 배치됨 ✓
- **import 정리 안내**: Task 22·25 등 큰 refactor에 명시적 import 변경 안내 포함 ✓

알려진 한계:
- 일부 primitive(select, dialog, popover, calendar, tabs)는 현재 파일 내용을 task 실행 시점에 `cat`으로 확인 후 패치하도록 안내. 이는 base-ui/radix variant마다 클래스 셀렉터가 다를 수 있어, 사전에 그대로 옮길 경우 오류 가능성이 있기 때문.
