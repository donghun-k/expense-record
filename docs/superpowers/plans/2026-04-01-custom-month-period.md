# 커스텀 월 기간(25일~익월24일) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 지출/예산 조회 기간을 달력 월(1일~말일)에서 커스텀 기간(25일~익월 24일)으로 변경한다.

**Architecture:** 중앙 유틸리티 함수 `getMonthDateRange`를 도입하여 "YYYY-MM" → `{ start, end }` 변환을 한 곳에서 관리. 서버 액션과 UI에서 이 함수를 호출하도록 교체.

**Tech Stack:** Next.js 16, TypeScript, date-fns, Jest

---

## 파일 구조

| 액션 | 파일 경로 | 역할 |
|------|-----------|------|
| Create | `lib/utils/date-range.ts` | `getMonthDateRange` 유틸리티 함수 |
| Create | `__tests__/utils/date-range.test.ts` | 유틸리티 테스트 |
| Modify | `lib/actions/expense.ts:34-49` | 인라인 범위 계산을 `getMonthDateRange` 호출로 교체 |
| Modify | `components/month-selector.tsx:20-29` | 기간 서브텍스트 표시 추가 |
| Modify | `app/page.tsx:14` | 현재 월 판별 로직을 기간 기준으로 변경 |
| Modify | `app/history/page.tsx:14` | 기본값 월 판별 로직을 기간 기준으로 변경 |

---

### Task 1: `getMonthDateRange` 유틸리티 — 테스트 작성

**Files:**
- Create: `__tests__/utils/date-range.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

```typescript
import { getMonthDateRange } from '@/lib/utils/date-range'

describe('getMonthDateRange', () => {
  it('기본 케이스: 4월 → 04-25 ~ 05-24', () => {
    const result = getMonthDateRange('2026-04')
    expect(result).toEqual({ start: '2026-04-25', end: '2026-05-24' })
  })

  it('12월 → 연도 넘김: 12-25 ~ 01-24', () => {
    const result = getMonthDateRange('2026-12')
    expect(result).toEqual({ start: '2026-12-25', end: '2027-01-24' })
  })

  it('1월 → 01-25 ~ 02-24', () => {
    const result = getMonthDateRange('2026-01')
    expect(result).toEqual({ start: '2026-01-25', end: '2026-02-24' })
  })

  it('잘못된 형식이면 에러', () => {
    expect(() => getMonthDateRange('2026-4')).toThrow('잘못된 연월 형식입니다')
    expect(() => getMonthDateRange('202604')).toThrow('잘못된 연월 형식입니다')
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `npx jest __tests__/utils/date-range.test.ts`
Expected: FAIL — `Cannot find module '@/lib/utils/date-range'`

- [ ] **Step 3: 커밋**

```bash
git add __tests__/utils/date-range.test.ts
git commit -m "test: getMonthDateRange 유틸리티 테스트 작성"
```

---

### Task 2: `getMonthDateRange` 유틸리티 — 구현

**Files:**
- Create: `lib/utils/date-range.ts`

- [ ] **Step 1: 유틸리티 함수 구현**

```typescript
/**
 * 기준월(YYYY-MM)을 받아 해당 기간의 시작일/종료일을 반환한다.
 * "2026-04" → { start: "2026-04-25", end: "2026-05-24" }
 *
 * 기간 정의: 해당 월 25일 ~ 익월 24일
 */
export function getMonthDateRange(yearMonth: string): { start: string; end: string } {
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) throw new Error('잘못된 연월 형식입니다')

  const [year, month] = yearMonth.split('-').map(Number)

  // 시작일: 해당 월 25일
  const startDay = 25
  const startStr = `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`

  // 종료일: 익월 24일
  const endMonth = month === 12 ? 1 : month + 1
  const endYear = month === 12 ? year + 1 : year
  const endDay = 24
  const endStr = `${endYear}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`

  return { start: startStr, end: endStr }
}
```

- [ ] **Step 2: 테스트 실행 — 통과 확인**

Run: `npx jest __tests__/utils/date-range.test.ts`
Expected: 4 tests PASS

- [ ] **Step 3: 커밋**

```bash
git add lib/utils/date-range.ts
git commit -m "feat: getMonthDateRange 유틸리티 함수 구현"
```

---

### Task 3: `getExpensesByMonth` 서버 액션 수정

**Files:**
- Modify: `lib/actions/expense.ts:1-50`

- [ ] **Step 1: import 변경 및 범위 계산 교체**

`lib/actions/expense.ts`에서 다음을 변경한다:

1. import에서 `format, addMonths`를 제거하고 `getMonthDateRange`를 추가:

```typescript
// 변경 전
import { format, addMonths } from 'date-fns'

// 변경 후
import { getMonthDateRange } from '@/lib/utils/date-range'
```

2. `getExpensesByMonth` 함수 내부의 범위 계산을 교체:

```typescript
// 변경 전 (line 35-39)
if (!/^\d{4}-\d{2}$/.test(yearMonth)) throw new Error('잘못된 연월 형식입니다')
const [year, month] = yearMonth.split('-').map(Number)
const startDate = `${yearMonth}-01`
// toISOString() 타임존 버그 방지: date-fns로 직접 포맷
const endDate = format(addMonths(new Date(year, month - 1, 1), 1), 'yyyy-MM-dd')

// 변경 후
const { start: startDate, end: endDate } = getMonthDateRange(yearMonth)
```

3. Notion 필터에서 `before`를 `on_or_before`로 변경 (종료일 24일 포함):

```typescript
// 변경 전
{ property: '날짜', date: { before: endDate } },

// 변경 후
{ property: '날짜', date: { on_or_before: endDate } },
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공 (lint 에러 없음)

- [ ] **Step 3: 커밋**

```bash
git add lib/actions/expense.ts
git commit -m "feat: getExpensesByMonth 날짜 범위를 25일~익월24일로 변경"
```

---

### Task 4: 현재 기준월 판별 로직 — `getCurrentYearMonth` 유틸리티 추가

현재 날짜가 어떤 기준월에 속하는지 판별하는 함수가 필요하다. 예: 4월 20일 → "2026-03" (3/25~4/24 기간), 4월 26일 → "2026-04" (4/25~5/24 기간).

**Files:**
- Modify: `lib/utils/date-range.ts`
- Modify: `__tests__/utils/date-range.test.ts`

- [ ] **Step 1: 테스트 추가**

`__tests__/utils/date-range.test.ts`에 추가:

```typescript
import { getMonthDateRange, getCurrentYearMonth } from '@/lib/utils/date-range'

describe('getCurrentYearMonth', () => {
  it('25일 이후면 해당 월 반환', () => {
    // 4월 25일 → "2026-04" (4/25~5/24 기간)
    expect(getCurrentYearMonth(new Date(2026, 3, 25))).toBe('2026-04')
    expect(getCurrentYearMonth(new Date(2026, 3, 30))).toBe('2026-04')
  })

  it('24일 이전이면 이전 월 반환', () => {
    // 4월 24일 → "2026-03" (3/25~4/24 기간)
    expect(getCurrentYearMonth(new Date(2026, 3, 24))).toBe('2026-03')
    expect(getCurrentYearMonth(new Date(2026, 3, 1))).toBe('2026-03')
  })

  it('1월 24일 이전이면 전년 12월 반환', () => {
    // 1월 10일 → "2025-12" (12/25~1/24 기간)
    expect(getCurrentYearMonth(new Date(2026, 0, 10))).toBe('2025-12')
  })

  it('12월 25일 이후면 12월 반환', () => {
    expect(getCurrentYearMonth(new Date(2026, 11, 25))).toBe('2026-12')
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `npx jest __tests__/utils/date-range.test.ts`
Expected: `getCurrentYearMonth` 관련 테스트 FAIL

- [ ] **Step 3: 구현**

`lib/utils/date-range.ts`에 추가:

```typescript
/**
 * 주어진 날짜가 속하는 기준월(YYYY-MM)을 반환한다.
 * 25일 이후 → 해당 월, 24일 이전 → 이전 월
 */
export function getCurrentYearMonth(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // 1-based
  const day = date.getDate()

  if (day >= 25) {
    return `${year}-${String(month).padStart(2, '0')}`
  }

  // 24일 이전이면 이전 월
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  return `${prevYear}-${String(prevMonth).padStart(2, '0')}`
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

Run: `npx jest __tests__/utils/date-range.test.ts`
Expected: 모든 테스트 PASS

- [ ] **Step 5: 커밋**

```bash
git add lib/utils/date-range.ts __tests__/utils/date-range.test.ts
git commit -m "feat: getCurrentYearMonth 현재 기준월 판별 함수 추가"
```

---

### Task 5: 메인 페이지 — 기준월 판별 교체

**Files:**
- Modify: `app/page.tsx:1-14`

- [ ] **Step 1: import 및 기준월 계산 교체**

```typescript
// 변경 전
import { format } from 'date-fns'
// ...
const currentYearMonth = format(new Date(), 'yyyy-MM')

// 변경 후
import { getCurrentYearMonth } from '@/lib/utils/date-range'
// ...
const currentYearMonth = getCurrentYearMonth()
```

`date-fns`의 `format` import를 제거한다 (이 파일에서 더 이상 사용하지 않음).

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add app/page.tsx
git commit -m "feat: 메인 페이지 기준월을 커스텀 기간으로 변경"
```

---

### Task 6: 히스토리 페이지 — 기준월 판별 교체

**Files:**
- Modify: `app/history/page.tsx:1-14`

- [ ] **Step 1: import 및 기본값 교체**

```typescript
// 변경 전
import { format } from 'date-fns'
// ...
const yearMonth = month ?? format(new Date(), 'yyyy-MM')

// 변경 후
import { getCurrentYearMonth } from '@/lib/utils/date-range'
// ...
const yearMonth = month ?? getCurrentYearMonth()
```

`date-fns`의 `format` import를 제거한다.

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add app/history/page.tsx
git commit -m "feat: 히스토리 페이지 기준월을 커스텀 기간으로 변경"
```

---

### Task 7: MonthSelector — 기간 서브텍스트 표시

**Files:**
- Modify: `components/month-selector.tsx`

- [ ] **Step 1: 기간 표시 추가**

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { addMonths, subMonths, format } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigationProgress } from '@/components/navigation-progress'
import { getMonthDateRange } from '@/lib/utils/date-range'

export function MonthSelector({ currentMonth }: { currentMonth: string }) {
  const router = useRouter()
  const navigationProgress = useNavigationProgress()
  const [y, m] = currentMonth.split('-').map(Number)
  const current = new Date(y, m - 1, 1)
  const { start, end } = getMonthDateRange(currentMonth)

  const go = (date: Date) => {
    navigationProgress?.start()
    router.push(`/history?month=${format(date, 'yyyy-MM')}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => go(subMonths(current, 1))}>
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <div className="text-center">
        <span className="text-sm font-medium">{currentMonth}</span>
        <p className="text-xs text-muted-foreground">
          {start.slice(5)} ~ {end.slice(5)}
        </p>
      </div>
      <Button variant="outline" size="icon" onClick={() => go(addMonths(current, 1))}>
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

핵심 변경:
- `getMonthDateRange` import 추가
- `{ start, end }` 계산
- 기존 `<span>` 아래에 `<p>` 서브텍스트로 `MM-DD ~ MM-DD` 표시
- 기존 `w-24` 고정 너비 제거 (기간 텍스트가 더 넓으므로)

- [ ] **Step 2: 개발 서버에서 시각적 확인**

Run: `npm run dev`
히스토리 페이지에서 MonthSelector에 기간 서브텍스트가 표시되는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add components/month-selector.tsx
git commit -m "feat: MonthSelector에 기간 서브텍스트 표시"
```

---

### Task 8: 설정 페이지 — 기준월 판별 교체

설정 페이지에서도 현재 월과 이전 월 예산을 조회할 때 `format(new Date(), 'yyyy-MM')`을 사용한다.

**Files:**
- Modify: `app/settings/page.tsx`

- [ ] **Step 1: 현재 코드 확인 후 import 및 기준월 계산 교체**

`format(new Date(), 'yyyy-MM')` → `getCurrentYearMonth()`로 교체.
이전 월 계산도 `getCurrentYearMonth` 기반으로 변경.

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add app/settings/page.tsx
git commit -m "feat: 설정 페이지 기준월을 커스텀 기간으로 변경"
```

---

### Task 9: 전체 테스트 및 lint 확인

- [ ] **Step 1: 전체 테스트 실행**

Run: `npm test`
Expected: 모든 테스트 PASS

- [ ] **Step 2: lint 실행**

Run: `npm run lint`
Expected: 에러 없음

- [ ] **Step 3: 빌드 실행**

Run: `npm run build`
Expected: 빌드 성공
