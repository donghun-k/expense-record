# 25일~24일 기간제 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 지출 기록 기간을 캘린더 월(1일~말일)에서 25일~다음달 24일 기간으로 전환한다.

**Architecture:** `lib/utils/period.ts`에 기간 계산 유틸리티를 추가하고, 기존 `yearMonth` 기반 날짜 범위 로직을 `Period` 객체 기반으로 교체한다. 예산 DB의 `연월` 필드는 기간 시작월 기준 `"YYYY-MM"`을 그대로 사용한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, date-fns, Notion API

**Spec:** `docs/superpowers/specs/2026-03-25-custom-period-design.md`

---

## Chunk 1: 기간 계산 유틸리티 (TDD)

### Task 1: Period 타입 정의

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Period 인터페이스 추가**

`lib/types.ts` 끝에 추가:

```typescript
export interface Period {
  start: string     // "YYYY-MM-DD" (기간 시작일, 25일)
  end: string       // "YYYY-MM-DD" (기간 종료일, 24일, inclusive)
  label: string     // "3/25 ~ 4/24" (UI 표시용)
  yearMonth: string // "YYYY-MM" (예산 매핑용, 시작일 기준 월)
}
```

- [ ] **Step 2: 커밋**

```bash
git add lib/types.ts
git commit -m "feat: Period 인터페이스 추가"
```

---

### Task 2: getCurrentPeriod 함수 (TDD)

**Files:**
- Create: `lib/utils/period.ts`
- Create: `__tests__/utils/period.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

```typescript
// __tests__/utils/period.test.ts
import { getCurrentPeriod } from '@/lib/utils/period'

describe('getCurrentPeriod', () => {
  it('25일 이후 → 이번달 25일 ~ 다음달 24일', () => {
    const result = getCurrentPeriod(new Date(2026, 2, 25)) // 3월 25일
    expect(result).toEqual({
      start: '2026-03-25',
      end: '2026-04-24',
      label: '3/25 ~ 4/24',
      yearMonth: '2026-03',
    })
  })

  it('25일 이전 → 전달 25일 ~ 이번달 24일', () => {
    const result = getCurrentPeriod(new Date(2026, 2, 15)) // 3월 15일
    expect(result).toEqual({
      start: '2026-02-25',
      end: '2026-03-24',
      label: '2/25 ~ 3/24',
      yearMonth: '2026-02',
    })
  })

  it('24일 (이전 기간의 마지막 날)', () => {
    const result = getCurrentPeriod(new Date(2026, 2, 24)) // 3월 24일
    expect(result).toEqual({
      start: '2026-02-25',
      end: '2026-03-24',
      label: '2/25 ~ 3/24',
      yearMonth: '2026-02',
    })
  })

  it('연말 경계: 12월 25일', () => {
    const result = getCurrentPeriod(new Date(2026, 11, 25)) // 12월 25일
    expect(result).toEqual({
      start: '2026-12-25',
      end: '2027-01-24',
      label: '12/25 ~ 1/24',
      yearMonth: '2026-12',
    })
  })

  it('연초 경계: 1월 1일', () => {
    const result = getCurrentPeriod(new Date(2026, 0, 1)) // 1월 1일
    expect(result).toEqual({
      start: '2025-12-25',
      end: '2026-01-24',
      label: '12/25 ~ 1/24',
      yearMonth: '2025-12',
    })
  })

  it('1월 25일', () => {
    const result = getCurrentPeriod(new Date(2026, 0, 25)) // 1월 25일
    expect(result).toEqual({
      start: '2026-01-25',
      end: '2026-02-24',
      label: '1/25 ~ 2/24',
      yearMonth: '2026-01',
    })
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest __tests__/utils/period.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/utils/period'`

- [ ] **Step 3: getCurrentPeriod 구현**

```typescript
// lib/utils/period.ts
import { format, addMonths, subMonths } from 'date-fns'
import type { Period } from '@/lib/types'

const PERIOD_START_DAY = 25

export function getCurrentPeriod(date: Date): Period {
  const day = date.getDate()
  const year = date.getFullYear()
  const month = date.getMonth() // 0-indexed

  let startDate: Date
  if (day >= PERIOD_START_DAY) {
    // 25일 이후: 이번달 25일 시작
    startDate = new Date(year, month, PERIOD_START_DAY)
  } else {
    // 25일 이전: 전달 25일 시작
    startDate = new Date(year, month - 1, PERIOD_START_DAY)
  }

  // 종료일: 시작월 다음달 24일
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, PERIOD_START_DAY - 1)

  const startMonth = startDate.getMonth() + 1
  const endMonth = endDate.getMonth() + 1

  return {
    start: format(startDate, 'yyyy-MM-dd'),
    end: format(endDate, 'yyyy-MM-dd'),
    label: `${startMonth}/${PERIOD_START_DAY} ~ ${endMonth}/${PERIOD_START_DAY - 1}`,
    yearMonth: format(startDate, 'yyyy-MM'),
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest __tests__/utils/period.test.ts
```

Expected: 6 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add lib/utils/period.ts __tests__/utils/period.test.ts
git commit -m "feat: getCurrentPeriod 함수 구현 및 테스트"
```

---

### Task 3: getAdjacentPeriod 함수 (TDD)

**Files:**
- Modify: `lib/utils/period.ts`
- Modify: `__tests__/utils/period.test.ts`

- [ ] **Step 1: 테스트 추가**

`__tests__/utils/period.test.ts`에 추가:

```typescript
import { getCurrentPeriod, getAdjacentPeriod } from '@/lib/utils/period'

describe('getAdjacentPeriod', () => {
  it('다음 기간', () => {
    const current = getCurrentPeriod(new Date(2026, 2, 25)) // 3/25~4/24
    const next = getAdjacentPeriod(current, 'next')
    expect(next).toEqual({
      start: '2026-04-25',
      end: '2026-05-24',
      label: '4/25 ~ 5/24',
      yearMonth: '2026-04',
    })
  })

  it('이전 기간', () => {
    const current = getCurrentPeriod(new Date(2026, 2, 25)) // 3/25~4/24
    const prev = getAdjacentPeriod(current, 'prev')
    expect(prev).toEqual({
      start: '2026-02-25',
      end: '2026-03-24',
      label: '2/25 ~ 3/24',
      yearMonth: '2026-02',
    })
  })

  it('연말→연초 순환 (next)', () => {
    const current = getCurrentPeriod(new Date(2026, 11, 25)) // 12/25~1/24
    const next = getAdjacentPeriod(current, 'next')
    expect(next).toEqual({
      start: '2027-01-25',
      end: '2027-02-24',
      label: '1/25 ~ 2/24',
      yearMonth: '2027-01',
    })
  })

  it('연초→전년 순환 (prev)', () => {
    const current = getCurrentPeriod(new Date(2026, 0, 25)) // 1/25~2/24
    const prev = getAdjacentPeriod(current, 'prev')
    expect(prev).toEqual({
      start: '2025-12-25',
      end: '2026-01-24',
      label: '12/25 ~ 1/24',
      yearMonth: '2025-12',
    })
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest __tests__/utils/period.test.ts
```

Expected: getAdjacentPeriod 테스트 FAIL

- [ ] **Step 3: getAdjacentPeriod 구현**

`lib/utils/period.ts`에 추가:

```typescript
export function getAdjacentPeriod(period: Period, direction: 'prev' | 'next'): Period {
  const [year, month] = period.yearMonth.split('-').map(Number)
  const offset = direction === 'next' ? 1 : -1
  const adjacentStart = new Date(year, month - 1 + offset, PERIOD_START_DAY)
  return getCurrentPeriod(adjacentStart)
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest __tests__/utils/period.test.ts
```

Expected: 10 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add lib/utils/period.ts __tests__/utils/period.test.ts
git commit -m "feat: getAdjacentPeriod 함수 구현 및 테스트"
```

---

### Task 4: yearMonthToPeriod 헬퍼 함수 (TDD)

**Files:**
- Modify: `lib/utils/period.ts`
- Modify: `__tests__/utils/period.test.ts`

- [ ] **Step 1: 테스트 추가**

```typescript
import { getCurrentPeriod, getAdjacentPeriod, yearMonthToPeriod } from '@/lib/utils/period'

describe('yearMonthToPeriod', () => {
  it('YYYY-MM 문자열로부터 Period 복원', () => {
    const result = yearMonthToPeriod('2026-03')
    expect(result).toEqual({
      start: '2026-03-25',
      end: '2026-04-24',
      label: '3/25 ~ 4/24',
      yearMonth: '2026-03',
    })
  })

  it('12월', () => {
    const result = yearMonthToPeriod('2026-12')
    expect(result).toEqual({
      start: '2026-12-25',
      end: '2027-01-24',
      label: '12/25 ~ 1/24',
      yearMonth: '2026-12',
    })
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest __tests__/utils/period.test.ts
```

- [ ] **Step 3: yearMonthToPeriod 구현**

`lib/utils/period.ts`에 추가:

```typescript
export function yearMonthToPeriod(yearMonth: string): Period {
  const [year, month] = yearMonth.split('-').map(Number)
  // 주의: new Date("YYYY-MM-25") 문자열 파싱 금지 (UTC 버그)
  return getCurrentPeriod(new Date(year, month - 1, PERIOD_START_DAY))
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest __tests__/utils/period.test.ts
```

Expected: 12 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add lib/utils/period.ts __tests__/utils/period.test.ts
git commit -m "feat: yearMonthToPeriod 헬퍼 함수 구현 및 테스트"
```

---

## Chunk 2: 데이터 조회 로직 전환

### Task 5: getExpensesByPeriod 구현

**Files:**
- Modify: `lib/actions/expense.ts:34-82`

- [ ] **Step 1: getExpensesByPeriod 함수 추가 (기존 함수 유지)**

`lib/actions/expense.ts`에서 import 변경 및 새 함수 추가. 기존 `getExpensesByMonth`는 모든 호출부 전환 후 Task 9에서 삭제한다.

import 변경 (4행):

```typescript
// 변경 전
import { format, addMonths } from 'date-fns'

// 변경 후
import { format, addMonths, addDays } from 'date-fns'
```

types import 변경 (6행):

```typescript
// 변경 전
import type { Expense } from '@/lib/types'

// 변경 후
import type { Expense, Period } from '@/lib/types'
```

`getExpensesByMonth` 함수 바로 아래(83행 뒤)에 새 함수 추가:

```typescript
export async function getExpensesByPeriod(period: Period): Promise<Expense[]> {
  // end는 inclusive이므로 Notion API의 before (exclusive) 사용 시 +1일
  const [ey, em, ed] = period.end.split('-').map(Number)
  const queryEndDate = format(addDays(new Date(ey, em - 1, ed), 1), 'yyyy-MM-dd')

  const response = await (notion.databases as any).query({
    database_id: DB.EXPENSE,
    filter: {
      and: [
        { property: '날짜', date: { on_or_after: period.start } },
        { property: '날짜', date: { before: queryEndDate } },
      ],
    },
    sorts: [{ property: '날짜', direction: 'descending' }],
  })

  const accountIds = [...new Set(response.results.map((p: any) => p.properties['계좌'].relation[0]?.id).filter(Boolean))]
  const categoryIds = [...new Set(response.results.map((p: any) => p.properties['카테고리'].relation[0]?.id).filter(Boolean))]

  const [accountPages, categoryPages] = await Promise.all([
    Promise.all(accountIds.map((id) => notion.pages.retrieve({ page_id: id as string }) as any)),
    Promise.all(categoryIds.map((id) => notion.pages.retrieve({ page_id: id as string }) as any)),
  ])

  const accountMap = Object.fromEntries(
    accountPages.map((p: any) => [p.id, p.properties['계좌명'].title[0]?.plain_text ?? ''])
  )
  const categoryMap = Object.fromEntries(
    categoryPages.map((p: any) => [p.id, p.properties['카테고리명'].title[0]?.plain_text ?? ''])
  )

  return response.results.map((page: any) => {
    const accountId = page.properties['계좌'].relation[0]?.id ?? ''
    const categoryId = page.properties['카테고리'].relation[0]?.id ?? ''
    return {
      id: page.id,
      title: page.properties['사용처'].title[0]?.plain_text ?? '',
      amount: page.properties['금액'].number ?? 0,
      date: page.properties['날짜'].date?.start ?? '',
      accountId,
      accountName: accountMap[accountId] ?? '',
      categoryId,
      categoryName: categoryMap[categoryId] ?? '',
    }
  })
}
```

참고: `Period`는 항상 유틸리티 함수에서 생성되므로 별도 형식 검증은 불필요하다 (내부 코드 신뢰).

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공 (기존 함수도 유지되어 있으므로 에러 없음)

- [ ] **Step 3: 커밋**

```bash
git add lib/actions/expense.ts
git commit -m "feat: getExpensesByPeriod 함수 추가"
```

---

### Task 6: 호출부 전환 — app/page.tsx

**Files:**
- Modify: `app/page.tsx:1-21`

- [ ] **Step 1: import 및 조회 로직 변경**

```typescript
// 변경 전
import { format } from 'date-fns'
import { getExpensesByMonth } from '@/lib/actions/expense'

// 변경 후
import { getExpensesByPeriod } from '@/lib/actions/expense'
import { getCurrentPeriod } from '@/lib/utils/period'
```

함수 내부:

```typescript
// 변경 전
const currentYearMonth = format(new Date(), 'yyyy-MM')
// ...
getBudgetsByMonth(currentYearMonth),
getExpensesByMonth(currentYearMonth),

// 변경 후
const currentPeriod = getCurrentPeriod(new Date())
// ...
getBudgetsByMonth(currentPeriod.yearMonth),
getExpensesByPeriod(currentPeriod),
```

`format` import 제거 (더 이상 사용 안 함).

- [ ] **Step 2: BudgetStatusCard에 기간 라벨 전달**

`app/page.tsx`에서 `BudgetStatusCard`에 `periodLabel` prop 추가:

```typescript
<BudgetStatusCard statuses={budgetStatuses} periodLabel={currentPeriod.label} />
```

`components/budget-status.tsx`에서 prop 수용:

```typescript
export function BudgetStatusCard({ statuses, periodLabel }: { statuses: BudgetStatus[]; periodLabel?: string }) {
```

CardTitle 변경:

```typescript
// 변경 전
<CardTitle>이번 달 예산 현황</CardTitle>

// 변경 후 (두 군데 모두)
<CardTitle>{periodLabel ? `${periodLabel} 예산 현황` : '예산 현황'}</CardTitle>
```

- [ ] **Step 3: 커밋**

```bash
git add app/page.tsx components/budget-status.tsx
git commit -m "feat: 메인 페이지 기간제 조회로 전환"
```

---

### Task 7: 호출부 전환 — app/history/page.tsx

**Files:**
- Modify: `app/history/page.tsx`
- Modify: `components/month-selector.tsx`

- [ ] **Step 1: history/page.tsx 변경**

```typescript
// 변경 전
import { format } from 'date-fns'
import { getExpensesByMonth } from '@/lib/actions/expense'

// 변경 후
import { getExpensesByPeriod } from '@/lib/actions/expense'
import { getCurrentPeriod, yearMonthToPeriod } from '@/lib/utils/period'
```

함수 내부:

```typescript
// 변경 전
const yearMonth = month ?? format(new Date(), 'yyyy-MM')
// ...
getExpensesByMonth(yearMonth),
// ...
<MonthSelector currentMonth={yearMonth} />

// 변경 후
const period = month ? yearMonthToPeriod(month) : getCurrentPeriod(new Date())
// ...
getExpensesByPeriod(period),
// ...
<MonthSelector currentYearMonth={period.yearMonth} periodLabel={period.label} />
```

- [ ] **Step 2: month-selector.tsx 변경**

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAdjacentPeriod, yearMonthToPeriod } from '@/lib/utils/period'

export function MonthSelector({ currentYearMonth, periodLabel }: { currentYearMonth: string; periodLabel: string }) {
  const router = useRouter()
  const currentPeriod = yearMonthToPeriod(currentYearMonth)

  const go = (direction: 'prev' | 'next') => {
    const target = getAdjacentPeriod(currentPeriod, direction)
    router.push(`/history?month=${target.yearMonth}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => go('prev')}>
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium min-w-[8rem] text-center">{periodLabel}</span>
      <Button variant="outline" size="icon" onClick={() => go('next')}>
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

`date-fns` import 완전 제거. `w-24` → `min-w-[8rem]`으로 너비 확장.

- [ ] **Step 3: 커밋**

```bash
git add app/history/page.tsx components/month-selector.tsx
git commit -m "feat: history 페이지 및 MonthSelector 기간제 전환"
```

---

### Task 8: 호출부 전환 — settings 페이지

**Files:**
- Modify: `app/settings/page.tsx`
- Modify: `components/settings/budget-settings.tsx`

- [ ] **Step 1: settings/page.tsx 변경**

```typescript
// 변경 전
import { format, subMonths } from 'date-fns'
// ...
const currentYearMonth = format(new Date(), 'yyyy-MM')
const prevYearMonth = format(subMonths(new Date(), 1), 'yyyy-MM')

// 변경 후
import { getCurrentPeriod, getAdjacentPeriod } from '@/lib/utils/period'
// ...
const currentPeriod = getCurrentPeriod(new Date())
const prevPeriod = getAdjacentPeriod(currentPeriod, 'prev')
```

예산 조회:

```typescript
// 변경 전
getBudgetsByMonth(currentYearMonth),
getBudgetsByMonth(prevYearMonth),

// 변경 후
getBudgetsByMonth(currentPeriod.yearMonth),
getBudgetsByMonth(prevPeriod.yearMonth),
```

BudgetSettings prop:

```typescript
// 변경 전
<BudgetSettings
  categories={categories}
  currentYearMonth={currentYearMonth}
  budgets={budgets}
  hasPreviousMonthBudget={prevBudgets.length > 0}
/>

// 변경 후
<BudgetSettings
  categories={categories}
  currentYearMonth={currentPeriod.yearMonth}
  periodLabel={currentPeriod.label}
  budgets={budgets}
  hasPreviousMonthBudget={prevBudgets.length > 0}
/>
```

`date-fns` import 제거.

- [ ] **Step 2: budget-settings.tsx 변경**

> 참고: 스펙에서는 `currentYearMonth` prop 대신 `Period` 객체를 받도록 변경하라고 했으나, 클라이언트 컴포넌트에는 직렬화 가능한 원시 타입(`string`) 전달이 더 안전하므로 `currentYearMonth`와 `periodLabel`을 개별 prop으로 전달한다.

Props 인터페이스:

```typescript
// 변경 전
interface Props {
  categories: Category[]
  currentYearMonth: string
  budgets: Budget[]
  hasPreviousMonthBudget: boolean
}

// 변경 후
interface Props {
  categories: Category[]
  currentYearMonth: string
  periodLabel: string
  budgets: Budget[]
  hasPreviousMonthBudget: boolean
}
```

함수 시그니처:

```typescript
export function BudgetSettings({ categories, currentYearMonth, periodLabel, budgets, hasPreviousMonthBudget }: Props) {
```

`handleCopyFromPrevious` 변경:

```typescript
// 변경 전
import { format, subMonths } from 'date-fns'
// ...
const handleCopyFromPrevious = () => {
  const [year, month] = currentYearMonth.split('-').map(Number)
  const prevYearMonth = format(subMonths(new Date(year, month - 1, 1), 1), 'yyyy-MM')

// 변경 후
import { getAdjacentPeriod, yearMonthToPeriod } from '@/lib/utils/period'
// ...
const handleCopyFromPrevious = () => {
  const prevYearMonth = getAdjacentPeriod(yearMonthToPeriod(currentYearMonth), 'prev').yearMonth
```

`date-fns` import 제거.

CardTitle 변경:

```typescript
// 변경 전
<CardTitle>{currentYearMonth} 예산 설정</CardTitle>

// 변경 후
<CardTitle>{periodLabel} 예산 설정</CardTitle>
```

- [ ] **Step 3: 커밋**

```bash
git add app/settings/page.tsx components/settings/budget-settings.tsx
git commit -m "feat: settings 페이지 기간제 전환"
```

---

## Chunk 3: 최종 검증

### Task 9: 정리 및 최종 검증

- [ ] **Step 1: 기존 getExpensesByMonth 삭제**

`lib/actions/expense.ts`에서 `getExpensesByMonth` 함수(34~82행)를 삭제한다. 모든 호출부가 `getExpensesByPeriod`로 전환되었으므로 dead code이다.

import에서 `addMonths` 제거 (더 이상 사용 안 함):

```typescript
// 변경 전
import { format, addMonths, addDays } from 'date-fns'

// 변경 후
import { format, addDays } from 'date-fns'
```

- [ ] **Step 2: 전체 테스트 실행**

```bash
npm test
```

Expected: 모든 테스트 PASS (기존 budget 테스트 + 새 period 테스트)

- [ ] **Step 3: lint 실행**

```bash
npm run lint
```

Expected: 에러 없음

- [ ] **Step 4: 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공

- [ ] **Step 5: 커밋**

```bash
git add lib/actions/expense.ts
git commit -m "chore: getExpensesByMonth 삭제 및 불필요한 import 정리"
```
