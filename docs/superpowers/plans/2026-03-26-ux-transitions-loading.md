# UX 트랜지션 & 로딩 오버레이 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앱 전반에 Framer Motion 트랜지션 + 전역 로딩 오버레이를 적용하여 부드럽고 일관된 UX를 제공한다.

**Architecture:** 하이브리드 접근 — 전역 관심사(로딩 오버레이, 프로그레스 바, 페이지 전환)는 Provider로, 지역 관심사(리스트 stagger, 카드 등장, 숫자 카운트업 등)는 개별 컴포넌트에서 처리한다.

**Tech Stack:** motion (v11+, `motion/react` 임포트), LazyMotion + domAnimation, Next.js 16 App Router, React 19

**Spec:** `docs/superpowers/specs/2026-03-26-ux-transitions-loading-design.md`

---

## Chunk 1: 전역 인프라

### Task 1: motion 패키지 설치 및 전역 설정

**Files:**
- Modify: `package.json`
- Modify: `app/layout.tsx`
- Create: `components/motion-provider.tsx`

- [ ] **Step 1: motion 패키지 설치**

Run: `npm install motion`

- [ ] **Step 2: MotionProvider 컴포넌트 생성**

Create `components/motion-provider.tsx`:

```tsx
'use client'

import { LazyMotion, domAnimation, MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  )
}
```

- [ ] **Step 3: layout.tsx에 MotionProvider 래핑**

`app/layout.tsx`를 수정하여 ThemeProvider 안에 MotionProvider를 추가:

```tsx
import { MotionProvider } from '@/components/motion-provider'

// JSX 변경:
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  <MotionProvider>
    <Nav />
    <main className="container mx-auto px-4 py-6">{children}</main>
    <Toaster />
  </MotionProvider>
</ThemeProvider>
```

- [ ] **Step 4: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공, 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add package.json package-lock.json components/motion-provider.tsx app/layout.tsx
git commit -m "feat: motion 패키지 설치 및 MotionProvider 전역 설정"
```

---

### Task 2: LoadingProvider + LoadingOverlay + useLoadingAction

**Files:**
- Create: `components/loading-provider.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: LoadingProvider 생성**

Create `components/loading-provider.tsx`:

```tsx
'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'

interface LoadingContextType {
  showLoading: () => void
  hideLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | null>(null)

export function useLoading() {
  const ctx = useContext(LoadingContext)
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider')
  return ctx
}

export function useLoadingAction() {
  const { showLoading, hideLoading } = useLoading()
  const [isPending, setIsPending] = useState(false)

  const execute = useCallback(async (action: () => Promise<void>) => {
    setIsPending(true)
    showLoading()
    try {
      await action()
    } finally {
      hideLoading()
      setIsPending(false)
    }
  }, [showLoading, hideLoading])

  return { execute, isPending }
}

function DotSpinner() {
  return (
    <div className="flex gap-2">
      {[0, 1, 2].map((i) => (
        <m.div
          key={i}
          className="h-3 w-3 rounded-full bg-white"
          animate={{ scale: [0.6, 1, 0.6], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.16 }}
        />
      ))}
    </div>
  )
}

function LoadingOverlay({ isVisible }: { isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          key="loading-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <DotSpinner />
        </m.div>
      )}
    </AnimatePresence>
  )
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0)

  const showLoading = useCallback(() => setCount((c) => c + 1), [])
  const hideLoading = useCallback(() => setCount((c) => Math.max(0, c - 1)), [])

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      <LoadingOverlay isVisible={count > 0} />
    </LoadingContext.Provider>
  )
}
```

- [ ] **Step 2: layout.tsx에 LoadingProvider 추가**

`app/layout.tsx` 수정 — MotionProvider 안에 LoadingProvider를 추가:

```tsx
import { LoadingProvider } from '@/components/loading-provider'

// JSX 변경:
<MotionProvider>
  <LoadingProvider>
    <Nav />
    <main className="container mx-auto px-4 py-6">{children}</main>
    <Toaster />
  </LoadingProvider>
</MotionProvider>
```

- [ ] **Step 3: 개발 서버에서 동작 확인**

Run: `npm run dev`
브라우저에서 확인: 정상 렌더링, 콘솔 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add components/loading-provider.tsx app/layout.tsx
git commit -m "feat: LoadingProvider + LoadingOverlay + useLoadingAction 훅 추가"
```

---

### Task 3: NavigationProgress (글로우 프로그레스 바)

**Files:**
- Create: `components/navigation-progress.tsx`
- Modify: `components/nav.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: NavigationProgress 컴포넌트 생성**

Create `components/navigation-progress.tsx`:

```tsx
'use client'

import { useEffect, useState, createContext, useContext, useCallback, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { m, AnimatePresence } from 'motion/react'

interface NavigationProgressContextType {
  start: () => void
}

const NavigationProgressContext = createContext<NavigationProgressContextType | null>(null)

export function useNavigationProgress() {
  return useContext(NavigationProgressContext)
}

export function NavigationProgressProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)
  const [progress, setProgress] = useState(0)

  const start = useCallback(() => {
    setIsNavigating(true)
    setProgress(0)
  }, [])

  // pathname 변경 감지 → 완료 처리
  useEffect(() => {
    if (isNavigating) {
      setProgress(100)
      const timer = setTimeout(() => {
        setIsNavigating(false)
        setProgress(0)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <NavigationProgressContext.Provider value={{ start }}>
      {children}
      <AnimatePresence>
        {isNavigating && (
          <m.div
            className="fixed top-0 left-0 right-0 z-[60] h-[3px]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <m.div
              className="h-full bg-white rounded-r-full"
              style={{
                boxShadow: '0 0 10px rgba(240, 147, 251, 0.8), 0 0 20px rgba(245, 87, 108, 0.4)',
              }}
              initial={{ width: '0%' }}
              animate={{ width: progress < 100 ? '80%' : '100%' }}
              transition={{ duration: progress < 100 ? 0.5 : 0.2, ease: 'easeOut' }}
            />
          </m.div>
        )}
      </AnimatePresence>
    </NavigationProgressContext.Provider>
  )
}
```

- [ ] **Step 2: Nav 컴포넌트에서 Link 클릭 시 프로그레스 시작**

`components/nav.tsx` 수정:

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
    <nav className="sticky top-0 z-40 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-(--glass-blur)">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg">지출 기록</span>
          <div className="flex gap-4">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => pathname !== href && navigationProgress?.start()}
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

- [ ] **Step 3: layout.tsx에 NavigationProgressProvider 추가**

`app/layout.tsx` 수정:

```tsx
import { NavigationProgressProvider } from '@/components/navigation-progress'

// JSX 변경 (LoadingProvider 안에):
<LoadingProvider>
  <NavigationProgressProvider>
    <Nav />
    <main className="container mx-auto px-4 py-6">{children}</main>
    <Toaster />
  </NavigationProgressProvider>
</LoadingProvider>
```

- [ ] **Step 4: MonthSelector에서도 프로그레스 시작**

`components/month-selector.tsx` 수정 — `router.push` 호출 전에 `start()`:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { format, addMonths, subMonths } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigationProgress } from '@/components/navigation-progress'

export function MonthSelector({ currentMonth }: { currentMonth: string }) {
  const router = useRouter()
  const navigationProgress = useNavigationProgress()
  const [y, m] = currentMonth.split('-').map(Number)
  const current = new Date(y, m - 1, 1)

  const go = (date: Date) => {
    navigationProgress?.start()
    router.push(`/history?month=${format(date, 'yyyy-MM')}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => go(subMonths(current, 1))}>
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium w-24 text-center">{currentMonth}</span>
      <Button variant="outline" size="icon" onClick={() => go(addMonths(current, 1))}>
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

- [ ] **Step 5: 빌드 확인**

Run: `npm run build`
Expected: 성공

- [ ] **Step 6: 커밋**

```bash
git add components/navigation-progress.tsx components/nav.tsx components/month-selector.tsx app/layout.tsx
git commit -m "feat: NavigationProgress 글로우 프로그레스 바 추가"
```

---

### Task 4: PageTransition (페이지 전환 애니메이션)

**Files:**
- Create: `components/page-transition.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: PageTransition 컴포넌트 생성**

Create `components/page-transition.tsx`:

```tsx
'use client'

import { usePathname } from 'next/navigation'
import { m } from 'motion/react'
import type { ReactNode } from 'react'

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <m.div
      key={pathname}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </m.div>
  )
}
```

- [ ] **Step 2: layout.tsx에서 main 내부에 PageTransition 적용**

`app/layout.tsx` 수정:

```tsx
import { PageTransition } from '@/components/page-transition'

// JSX 변경 (main 안에 PageTransition 래핑):
<main className="container mx-auto px-4 py-6">
  <PageTransition>{children}</PageTransition>
</main>
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 성공

- [ ] **Step 4: 커밋**

```bash
git add components/page-transition.tsx app/layout.tsx
git commit -m "feat: PageTransition 페이지 전환 fade + slide-up 애니메이션"
```

---

## Chunk 2: 개별 컴포넌트 애니메이션 (Part 1)

### Task 5: Button 인터랙션 강화 (CSS)

**Files:**
- Modify: `components/ui/button.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: button.tsx에서 active:translate-y-px을 scale로 교체**

`components/ui/button.tsx`의 buttonVariants 기본 클래스에서 `active:translate-y-px`를 제거하고 `hover:scale-[1.02] active:scale-[0.98]`로 교체:

변경 전:
```
"... transition-all outline-none select-none focus-visible:border-ring ... active:translate-y-px disabled:pointer-events-none ..."
```

변경 후:
```
"... transition-all outline-none select-none focus-visible:border-ring ... hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none ..."
```

- [ ] **Step 2: globals.css에 reduced-motion 시 버튼 scale 비활성화**

`app/globals.css`의 `@media (prefers-reduced-motion: reduce)` 블록 안에 추가:

```css
[data-slot="button"] {
  transition: none !important;
  transform: none !important;
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 성공

- [ ] **Step 4: 커밋**

```bash
git add components/ui/button.tsx app/globals.css
git commit -m "feat: 버튼 hover/active scale 인터랙션 강화"
```

---

### Task 6: AnimatedNumber 컴포넌트

**Files:**
- Create: `components/animated-number.tsx`

- [ ] **Step 1: AnimatedNumber 컴포넌트 생성**

Create `components/animated-number.tsx`:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { useMotionValue, useTransform, animate, m, useReducedMotion } from 'motion/react'

interface Props {
  value: number
  className?: string
  suffix?: string
}

export function AnimatedNumber({ value, className, suffix = '' }: Props) {
  const prefersReducedMotion = useReducedMotion()
  const motionValue = useMotionValue(0)
  const display = useTransform(motionValue, (v) =>
    Math.round(v).toLocaleString()
  )
  const prevValue = useRef(0)

  useEffect(() => {
    if (prefersReducedMotion) {
      motionValue.set(value)
      return
    }
    const controls = animate(motionValue, value, {
      duration: 0.8,
      ease: 'easeOut',
    })
    prevValue.current = value
    return () => controls.stop()
  }, [value, motionValue, prefersReducedMotion])

  return (
    <span className={className}>
      <m.span>{display}</m.span>
      {suffix}
    </span>
  )
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 성공

- [ ] **Step 3: 커밋**

```bash
git add components/animated-number.tsx
git commit -m "feat: AnimatedNumber 숫자 카운트업 컴포넌트 추가"
```

---

### Task 7: ExpenseForm — useLoadingAction + 카드 등장

**Files:**
- Modify: `components/expense-form.tsx`

- [ ] **Step 1: useTransition을 useLoadingAction으로 교체하고 카드 등장 추가**

`components/expense-form.tsx` 수정:

1. import 변경:
   - 제거: `useTransition` from 'react'
   - 추가: `{ m } from 'motion/react'`
   - 추가: `{ useLoadingAction } from '@/components/loading-provider'`

2. 상태 변경:
   - 제거: `const [isPending, startTransition] = useTransition()`
   - 추가: `const { execute, isPending } = useLoadingAction()`

3. handleSubmit 변경:
   - `startTransition(async () => { ... })` → `execute(async () => { ... })`

4. JSX 변경:
   - `<Card>` → `<m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}><Card>` ... `</Card></m.div>`

5. 버튼 텍스트 변경:
   - `{isPending ? '기록 중...' : '지출 기록'}` → `'지출 기록'` (오버레이가 피드백 대신)

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 성공

- [ ] **Step 3: 커밋**

```bash
git add components/expense-form.tsx
git commit -m "feat: ExpenseForm에 useLoadingAction + 카드 등장 애니메이션 적용"
```

---

### Task 8: BudgetStatusCard — 클라이언트 전환 + AnimatedNumber + 카드 등장

**Files:**
- Modify: `components/budget-status.tsx`

- [ ] **Step 1: 'use client' 추가 및 AnimatedNumber + motion 적용**

`components/budget-status.tsx` 수정:

1. 파일 최상단에 `'use client'` 추가

2. import 추가:
   - `{ m } from 'motion/react'`
   - `{ AnimatedNumber } from '@/components/animated-number'`

3. Card를 m.div로 래핑 (등장 애니메이션):
   - `<Card>` → `<m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}><Card>` ... `</Card></m.div>`

4. 금액 표시를 AnimatedNumber로 교체:
   - `{s.budget.toLocaleString()}원` → `<AnimatedNumber value={s.budget} suffix="원" />`
   - `{s.spent.toLocaleString()}원` → `<AnimatedNumber value={s.spent} suffix="원" />`
   - `{s.remaining > 0 ? '+' : ''}{s.remaining.toLocaleString()}원` → 잔액은 부호 처리가 필요하므로 그대로 유지 (AnimatedNumber가 음수 포맷을 자동 처리하지 않음)
   - `{fixedTotal.toLocaleString()}원` → `<AnimatedNumber value={fixedTotal} suffix="원" />`

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 성공

- [ ] **Step 3: 커밋**

```bash
git add components/budget-status.tsx
git commit -m "feat: BudgetStatusCard 클라이언트 전환 + AnimatedNumber + 카드 등장"
```

---

## Chunk 3: 개별 컴포넌트 애니메이션 (Part 2)

### Task 9: ExpenseList — useLoadingAction + 리스트 stagger + 삭제 퇴장

**Files:**
- Modify: `components/expense-list.tsx`

- [ ] **Step 1: import 변경**

```tsx
// 변경: useState만 있던 것에 useEffect 추가
import { useState, useEffect } from 'react'
// 제거: useTransition import 제거
// 추가:
import { m, AnimatePresence } from 'motion/react'
import { useLoadingAction } from '@/components/loading-provider'
```

- [ ] **Step 2: 상태 변경**

```tsx
// 제거:
// const [isUpdating, startUpdateTransition] = useTransition()
// const [isDeleting, startDeleteTransition] = useTransition()

// 추가:
const { execute, isPending } = useLoadingAction()

// 로컬 상태 추가 (삭제 퇴장 애니메이션용):
const [localExpenses, setLocalExpenses] = useState(expenses)
useEffect(() => { setLocalExpenses(expenses) }, [expenses])
```

- [ ] **Step 3: 핸들러 변경**

handleUpdate:
```tsx
const handleUpdate = () => {
  if (!editingExpense) return
  const parsedAmount = parseInt(editAmount, 10)
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    toast.error('올바른 금액을 입력해주세요')
    return
  }
  execute(async () => {
    try {
      await updateExpense(editingExpense.id, {
        title: editTitle,
        amount: parsedAmount,
        date: format(editDate, 'yyyy-MM-dd'),
        accountId: editAccountId,
        categoryId: editCategoryId,
      })
      setEditingExpense(null)
      toast.success('지출이 수정됐습니다')
    } catch {
      toast.error('지출 수정에 실패했습니다')
    }
  })
}
```

handleDelete:
```tsx
const handleDelete = (id: string) => {
  if (!confirm('이 지출 기록을 삭제하시겠습니까?')) return
  setLocalExpenses((prev) => prev.filter((e) => e.id !== id))
  execute(async () => {
    try {
      await deleteExpense(id)
      toast.success('지출이 삭제됐습니다')
    } catch {
      toast.error('지출 삭제에 실패했습니다')
    }
  })
}
```

- [ ] **Step 4: filteredExpenses가 localExpenses 기반으로 동작하도록 변경**

```tsx
const filteredExpenses = localExpenses.filter((e) => {
  if (filterAccountId && e.accountId !== filterAccountId) return false
  if (filterCategoryId && e.categoryId !== filterCategoryId) return false
  return true
})
```

- [ ] **Step 5: JSX에 stagger + AnimatePresence 적용**

TableBody 내부 변경 (`layout` prop 미사용 — `domAnimation`에서 미지원):

```tsx
<TableBody>
  {filteredExpenses.length === 0 ? (
    <TableRow>
      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
        {(filterAccountId || filterCategoryId) ? '필터 조건에 맞는 기록이 없습니다' : '지출 기록이 없습니다'}
      </TableCell>
    </TableRow>
  ) : (
    <AnimatePresence mode="popLayout">
      {filteredExpenses.map((expense, index) => {
        const [ey, em, ed] = expense.date.split('-').map(Number)
        const displayDate = format(new Date(ey, em - 1, ed), 'MM/dd', { locale: ko })
        return (
          <m.tr
            key={expense.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="border-b transition-colors hover:bg-[var(--glass-bg)] data-[state=selected]:bg-muted"
          >
            <TableCell>{displayDate}</TableCell>
            <TableCell>{expense.title}</TableCell>
            <TableCell className="text-right">{expense.amount.toLocaleString()}원</TableCell>
            <TableCell>{expense.accountName}</TableCell>
            <TableCell>{expense.categoryName}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => openEdit(expense)}>수정</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(expense.id)} disabled={isPending}>삭제</Button>
              </div>
            </TableCell>
          </m.tr>
        )
      })}
    </AnimatePresence>
  )}
</TableBody>
```

- [ ] **Step 6: Dialog의 저장 버튼 disabled 수정**

```tsx
// isUpdating → isPending
<Button onClick={handleUpdate} disabled={isPending}>저장</Button>
```

- [ ] **Step 7: 빌드 확인**

Run: `npm run build`
Expected: 성공

- [ ] **Step 8: 커밋**

```bash
git add components/expense-list.tsx
git commit -m "feat: ExpenseList에 useLoadingAction + stagger + 삭제 퇴장 애니메이션"
```

---

### Task 10: AccountSettings — useLoadingAction + stagger + 삭제 퇴장

**Files:**
- Modify: `components/settings/account-settings.tsx`

- [ ] **Step 1: import 변경**

```tsx
// 제거: useTransition from 'react'
// 추가:
import { useEffect } from 'react'
import { m, AnimatePresence } from 'motion/react'
import { useLoadingAction } from '@/components/loading-provider'
```

- [ ] **Step 2: 상태 변경**

```tsx
// 제거: const [isPending, startTransition] = useTransition()
// 추가:
const { execute, isPending } = useLoadingAction()
const [localAccounts, setLocalAccounts] = useState(accounts)
useEffect(() => { setLocalAccounts(accounts) }, [accounts])
```

- [ ] **Step 3: 핸들러의 startTransition을 execute로 교체**

handleCreate:
```tsx
const handleCreate = () => {
  if (!newName.trim()) return
  execute(async () => {
    try {
      await createAccount(newName)
      setNewName('')
      toast.success('계좌가 추가됐습니다')
    } catch {
      toast.error('계좌 추가에 실패했습니다')
    }
  })
}
```

handleUpdate:
```tsx
const handleUpdate = (id: string) => {
  execute(async () => {
    try {
      await updateAccount(id, editingName)
      setEditingId(null)
      toast.success('계좌가 수정됐습니다')
    } catch {
      toast.error('계좌 수정에 실패했습니다')
    }
  })
}
```

handleDelete (낙관적 삭제 + 실패 시 롤백 — expense-list와 통일):
```tsx
const handleDelete = (id: string) => {
  const backup = localAccounts
  setLocalAccounts((prev) => prev.filter((a) => a.id !== id))
  execute(async () => {
    try {
      const result = await deleteAccount(id)
      if (result.success) {
        toast.success('계좌가 삭제됐습니다')
      } else {
        setLocalAccounts(backup)
        toast.error(result.message)
      }
    } catch {
      setLocalAccounts(backup)
      toast.error('삭제 중 오류가 발생했습니다')
    }
  })
}
```

- [ ] **Step 4: JSX에 stagger + AnimatePresence 적용**

계좌 목록 부분 (`layout` prop 미사용 — `domAnimation`에서 미지원):
```tsx
<div className="space-y-2">
  <AnimatePresence mode="popLayout">
    {localAccounts.map((account, index) => (
      <m.div
        key={account.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="flex items-center gap-2"
      >
        {editingId === account.id ? (
          // ... 편집 UI (기존 그대로)
        ) : (
          // ... 표시 UI (기존 그대로)
        )}
      </m.div>
    ))}
  </AnimatePresence>
</div>
```

- [ ] **Step 5: 빌드 확인**

Run: `npm run build`
Expected: 성공

- [ ] **Step 6: 커밋**

```bash
git add components/settings/account-settings.tsx
git commit -m "feat: AccountSettings에 useLoadingAction + stagger + 삭제 퇴장"
```

---

### Task 11: CategorySettings — useLoadingAction + stagger + 삭제 퇴장

**Files:**
- Modify: `components/settings/category-settings.tsx`

- [ ] **Step 1: import 변경**

```tsx
// 제거: useTransition from 'react'
// 추가:
import { useEffect } from 'react'
import { m, AnimatePresence } from 'motion/react'
import { useLoadingAction } from '@/components/loading-provider'
```

- [ ] **Step 2: 상태 변경**

```tsx
// 제거: const [isPending, startTransition] = useTransition()
// 추가:
const { execute, isPending } = useLoadingAction()
const [localCategories, setLocalCategories] = useState(categories)
useEffect(() => { setLocalCategories(categories) }, [categories])
```

- [ ] **Step 3: 핸들러의 startTransition을 execute로 교체**

handleCreate, handleUpdate: `startTransition(async () => { ... })` → `execute(async () => { ... })`로 변경.

handleDelete (낙관적 삭제 + 실패 시 롤백):
```tsx
const handleDelete = (id: string) => {
  const backup = localCategories
  setLocalCategories((prev) => prev.filter((c) => c.id !== id))
  execute(async () => {
    try {
      const result = await deleteCategory(id)
      if (result.success) {
        toast.success('카테고리가 삭제됐습니다')
      } else {
        setLocalCategories(backup)
        toast.error(result.message)
      }
    } catch {
      setLocalCategories(backup)
      toast.error('삭제 중 오류가 발생했습니다')
    }
  })
}
```

- [ ] **Step 4: JSX에 stagger + AnimatePresence 적용**

카테고리 목록 부분 (`layout` prop 미사용):
```tsx
<div className="space-y-2">
  <AnimatePresence mode="popLayout">
    {localCategories.map((category, index) => {
      const accountName = accounts.find((a) => a.id === category.accountId)?.name ?? ''
      return (
        <m.div
          key={category.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="flex items-center gap-2"
        >
          {/* 기존 편집/표시 UI */}
        </m.div>
      )
    })}
  </AnimatePresence>
</div>
```

- [ ] **Step 5: 빌드 확인**

Run: `npm run build`
Expected: 성공

- [ ] **Step 6: 커밋**

```bash
git add components/settings/category-settings.tsx
git commit -m "feat: CategorySettings에 useLoadingAction + stagger + 삭제 퇴장"
```

---

### Task 12: BudgetSettings — useLoadingAction

**Files:**
- Modify: `components/settings/budget-settings.tsx`

- [ ] **Step 1: import 변경**

```tsx
// 제거: useTransition from 'react'
// 추가:
import { useLoadingAction } from '@/components/loading-provider'
```

- [ ] **Step 2: 상태 변경**

```tsx
// 제거: const [isPending, startTransition] = useTransition()
// 추가:
const { execute, isPending } = useLoadingAction()
```

- [ ] **Step 3: 핸들러의 startTransition을 execute로 교체**

handleSave, handleCopyFromPrevious 모두 `startTransition(async () => { ... })` → `execute(async () => { ... })`.

- [ ] **Step 4: 빌드 확인**

Run: `npm run build`
Expected: 성공

- [ ] **Step 5: 커밋**

```bash
git add components/settings/budget-settings.tsx
git commit -m "feat: BudgetSettings에 useLoadingAction 적용"
```

---

## Chunk 4: 탭 슬라이드 + Dialog CSS 개선

### Task 13: 설정 페이지 탭 슬라이드 애니메이션

**Files:**
- Modify: `app/settings/page.tsx`
- Create: `components/settings/animated-tabs.tsx`

- [ ] **Step 1: AnimatedTabs 클라이언트 컴포넌트 생성**

설정 페이지는 서버 컴포넌트이므로, 탭 애니메이션 부분만 클라이언트 컴포넌트로 분리한다.

Create `components/settings/animated-tabs.tsx`:

base-ui Tabs는 `value` + `onValueChange`를 지원한다. `variants` 패턴으로 방향 전달하여 exit 방향 오류 방지. 접근성(role, aria) 속성 추가.

```tsx
'use client'

import { useState, useRef, type ReactNode } from 'react'
import { AnimatePresence, m, type Variants } from 'motion/react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Tab {
  value: string
  label: string
  content: ReactNode
}

const tabOrder = ['accounts', 'categories', 'budgets']

const variants: Variants = {
  enter: (dir: number) => ({ x: dir * 100, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -100, opacity: 0 }),
}

export function AnimatedTabs({ tabs }: { tabs: Tab[] }) {
  const [activeTab, setActiveTab] = useState(tabs[0].value)
  const directionRef = useRef(0)

  const handleTabChange = (value: any) => {
    const oldIndex = tabOrder.indexOf(activeTab)
    const newIndex = tabOrder.indexOf(String(value))
    directionRef.current = newIndex > oldIndex ? 1 : -1
    setActiveTab(String(value))
  }

  const activeContent = tabs.find((t) => t.value === activeTab)?.content

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="mt-4 overflow-hidden">
        <AnimatePresence mode="wait" custom={directionRef.current}>
          <m.div
            key={activeTab}
            custom={directionRef.current}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
            role="tabpanel"
            aria-label={tabs.find((t) => t.value === activeTab)?.label}
          >
            {activeContent}
          </m.div>
        </AnimatePresence>
      </div>
    </Tabs>
  )
}
```

- [ ] **Step 2: settings/page.tsx에서 AnimatedTabs 사용**

`app/settings/page.tsx` 수정:

```tsx
// Tabs, TabsContent, TabsList, TabsTrigger import 제거
// 대신:
import { AnimatedTabs } from '@/components/settings/animated-tabs'

// JSX 변경 (Tabs 부분 전체 교체):
<AnimatedTabs
  tabs={[
    { value: 'accounts', label: '계좌', content: <AccountSettings accounts={accounts} /> },
    { value: 'categories', label: '카테고리', content: <CategorySettings accounts={accounts} categories={categories} /> },
    {
      value: 'budgets',
      label: '예산',
      content: (
        <BudgetSettings
          categories={categories}
          currentYearMonth={currentYearMonth}
          budgets={budgets}
          hasPreviousMonthBudget={prevBudgets.length > 0}
        />
      ),
    },
  ]}
/>
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 성공

- [ ] **Step 4: 커밋**

```bash
git add components/settings/animated-tabs.tsx app/settings/page.tsx
git commit -m "feat: 설정 페이지 탭 슬라이드 애니메이션"
```

---

### Task 14: Dialog/Popover CSS transition 통일

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: globals.css에 Dialog/Popover transition 개선 추가**

`app/globals.css`의 `@layer base` 블록 끝에 추가:

```css
/* Dialog/Popover transition 통일 */
[data-slot="dialog-overlay"] {
  transition: opacity 200ms ease-out;
}
[data-slot="dialog-content"],
[data-slot="popover-content"] {
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 성공

- [ ] **Step 3: 커밋**

```bash
git add app/globals.css
git commit -m "feat: Dialog/Popover transition 200ms ease-out 통일"
```

---

### Task 15: 최종 빌드 및 lint 검증

**Files:** (없음 — 검증만)

- [ ] **Step 1: 전체 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

- [ ] **Step 2: lint 실행**

Run: `npm run lint`
Expected: 에러 없음

- [ ] **Step 3: 테스트 실행**

Run: `npm test`
Expected: 기존 테스트 통과

- [ ] **Step 4: 문제 있으면 수정 후 커밋**

문제 발생 시 해당 파일 수정 후:
```bash
git add -A
git commit -m "fix: 빌드/lint/테스트 이슈 수정"
```
