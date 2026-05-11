# 지난 기간 지출 일괄 삭제 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 설정 페이지에 "데이터" 탭을 추가하여, 현재 기간 시작일 이전의 모든 지출 기록을 사용자 확인 후 일괄 삭제할 수 있게 한다.

**Architecture:** Server Action(`countPastExpenses`, `deletePastExpenses`)으로 Notion API에 `date.before` 필터 + 페이지네이션을 적용해 카운트/삭제를 수행한다. 클라이언트 컴포넌트(`DataSettings`)는 카운트 → AlertDialog 확인 → 삭제 순서로 진행하며 기존 `useLoadingAction` 패턴과 Sonner 토스트를 재사용한다.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript · `@notionhq/client` · `@base-ui/react/alert-dialog` (shadcn base-nova) · Sonner

**Spec:** `docs/superpowers/specs/2026-05-12-bulk-delete-past-expenses-design.md`

---

## File Map

| 파일 | 역할 |
|---|---|
| `lib/actions/expense.ts` | (수정) `countPastExpenses`, `deletePastExpenses` Server Action 추가 |
| `components/ui/alert-dialog.tsx` | (생성) shadcn add로 자동 생성. 변경 없이 그대로 사용 |
| `components/settings/data-settings.tsx` | (생성) "데이터" 탭의 클라이언트 컴포넌트 |
| `components/settings/settings-tabs.tsx` | (수정) 4번째 탭 추가 |
| `__tests__/actions/expense-bulk-delete.test.ts` | (생성) 카운트/삭제 Server Action의 단위 테스트 (Notion SDK 모킹) |

---

## Task 1: AlertDialog UI 컴포넌트 추가

**Files:**
- Create: `components/ui/alert-dialog.tsx` (shadcn 자동 생성)
- Modify: `package.json`, lockfile

- [ ] **Step 1: shadcn add 실행**

Run: `npx shadcn@latest add alert-dialog`

Expected: `components/ui/alert-dialog.tsx` 생성. `@base-ui/react/alert-dialog` 또는 `@radix-ui/react-alert-dialog` 의존성이 `package.json`에 추가됨 (이미 `@base-ui/react/alert-dialog`가 설치되어 있어 추가 설치 없이 import만 와이어링될 수도 있음).

- [ ] **Step 2: 생성 확인 및 export 점검**

Run: `head -50 components/ui/alert-dialog.tsx`
Expected: `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel` 등이 export되어 있어야 함.

만약 export 이름이 다르면(예: 일부 누락) Task 4 코드에서 동일 이름을 사용하므로 이 시점에 매핑을 확정. 이름이 다른 경우 Task 4의 import를 그에 맞게 조정.

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 신규 파일은 아직 사용되지 않으므로 빌드 통과.

- [ ] **Step 4: Commit**

```bash
git add components/ui/alert-dialog.tsx package.json package-lock.json
git commit -m "feat(ui): add alert-dialog component via shadcn"
```

---

## Task 2: Server Action - 카운트 함수 (TDD)

**Files:**
- Test: `__tests__/actions/expense-bulk-delete.test.ts` (생성)
- Modify: `lib/actions/expense.ts`

- [ ] **Step 1: 테스트 인프라 확인**

Run: `cat jest.config.ts`
Expected: ts-jest 또는 next/jest preset 사용. 기존 `__tests__/utils/budget.test.ts`와 동일한 패턴으로 작성.

- [ ] **Step 2: 실패하는 테스트 작성**

Create: `__tests__/actions/expense-bulk-delete.test.ts`

```ts
/**
 * @jest-environment node
 */
import { countPastExpenses, deletePastExpenses } from '@/lib/actions/expense'
import { notion } from '@/lib/notion'
import { getCurrentYearMonth } from '@/lib/utils/date-range'

jest.mock('@/lib/notion', () => ({
  notion: {
    databases: { query: jest.fn() },
    pages: { update: jest.fn() },
  },
  DB: { EXPENSE: 'EXPENSE_DB', ACCOUNT: 'A', CATEGORY: 'C', BUDGET: 'B' },
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('@/lib/utils/date-range', () => {
  const actual = jest.requireActual('@/lib/utils/date-range')
  return {
    ...actual,
    getCurrentYearMonth: jest.fn(() => '2026-05'),
  }
})

const mockedQuery = notion.databases.query as jest.Mock
const mockedUpdate = notion.pages.update as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

describe('countPastExpenses', () => {
  it('현재 기간 시작일 이전 지출 수를 반환한다', async () => {
    mockedQuery.mockResolvedValueOnce({
      results: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
      has_more: false,
      next_cursor: null,
    })

    const count = await countPastExpenses()

    expect(count).toBe(3)
    expect(mockedQuery).toHaveBeenCalledWith({
      database_id: 'EXPENSE_DB',
      filter: { property: '날짜', date: { before: '2026-05-25' } },
      start_cursor: undefined,
      page_size: 100,
    })
  })

  it('페이지네이션을 처리한다 (has_more=true)', async () => {
    mockedQuery
      .mockResolvedValueOnce({
        results: new Array(100).fill(0).map((_, i) => ({ id: `p${i}` })),
        has_more: true,
        next_cursor: 'cursor-1',
      })
      .mockResolvedValueOnce({
        results: [{ id: 'p100' }, { id: 'p101' }],
        has_more: false,
        next_cursor: null,
      })

    const count = await countPastExpenses()

    expect(count).toBe(102)
    expect(mockedQuery).toHaveBeenCalledTimes(2)
    expect(mockedQuery).toHaveBeenNthCalledWith(2, expect.objectContaining({
      start_cursor: 'cursor-1',
    }))
  })

  it('데이터가 없으면 0을 반환한다', async () => {
    mockedQuery.mockResolvedValueOnce({
      results: [],
      has_more: false,
      next_cursor: null,
    })

    const count = await countPastExpenses()

    expect(count).toBe(0)
  })
})
```

- [ ] **Step 3: 테스트 실행하여 실패 확인**

Run: `npx jest __tests__/actions/expense-bulk-delete.test.ts`
Expected: FAIL — `countPastExpenses is not a function` (또는 import 에러)

- [ ] **Step 4: 최소 구현 추가**

Modify: `lib/actions/expense.ts` — 파일 끝에 추가

```ts
import { getCurrentYearMonth } from '@/lib/utils/date-range'

export async function countPastExpenses(): Promise<number> {
  const yearMonth = getCurrentYearMonth()
  const { start } = getMonthDateRange(yearMonth)

  let count = 0
  let cursor: string | undefined = undefined
  do {
    const res: any = await notion.databases.query({
      database_id: DB.EXPENSE,
      filter: { property: '날짜', date: { before: start } },
      start_cursor: cursor,
      page_size: 100,
    })
    count += res.results.length
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined
  } while (cursor)

  return count
}
```

또한 파일 상단의 import 라인에 `getCurrentYearMonth` 추가:

```ts
import { getMonthDateRange, getCurrentYearMonth } from '@/lib/utils/date-range'
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx jest __tests__/actions/expense-bulk-delete.test.ts -t countPastExpenses`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/actions/expense.ts __tests__/actions/expense-bulk-delete.test.ts
git commit -m "feat(expense): countPastExpenses 서버 액션 추가"
```

---

## Task 3: Server Action - 삭제 함수 (TDD)

**Files:**
- Modify: `__tests__/actions/expense-bulk-delete.test.ts`
- Modify: `lib/actions/expense.ts`

- [ ] **Step 1: 실패하는 테스트 추가**

Append to `__tests__/actions/expense-bulk-delete.test.ts`:

```ts
import { revalidatePath } from 'next/cache'

describe('deletePastExpenses', () => {
  it('대상 페이지를 모두 in_trash 처리하고 삭제 건수를 반환한다', async () => {
    mockedQuery.mockResolvedValueOnce({
      results: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
      has_more: false,
      next_cursor: null,
    })
    mockedUpdate.mockResolvedValue({})

    const result = await deletePastExpenses()

    expect(result).toEqual({ deletedCount: 3 })
    expect(mockedUpdate).toHaveBeenCalledTimes(3)
    expect(mockedUpdate).toHaveBeenNthCalledWith(1, { page_id: 'p1', in_trash: true })
    expect(mockedUpdate).toHaveBeenNthCalledWith(2, { page_id: 'p2', in_trash: true })
    expect(mockedUpdate).toHaveBeenNthCalledWith(3, { page_id: 'p3', in_trash: true })
  })

  it('성공 시 / 와 /history 캐시를 무효화한다', async () => {
    mockedQuery.mockResolvedValueOnce({
      results: [{ id: 'p1' }],
      has_more: false,
      next_cursor: null,
    })
    mockedUpdate.mockResolvedValue({})

    await deletePastExpenses()

    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(revalidatePath).toHaveBeenCalledWith('/history')
  })

  it('빈 결과면 0을 반환하고 update를 호출하지 않는다', async () => {
    mockedQuery.mockResolvedValueOnce({
      results: [],
      has_more: false,
      next_cursor: null,
    })

    const result = await deletePastExpenses()

    expect(result).toEqual({ deletedCount: 0 })
    expect(mockedUpdate).not.toHaveBeenCalled()
  })

  it('삭제 중 실패해도 진행 카운트를 포함한 에러를 throw하고 캐시를 무효화한다', async () => {
    mockedQuery.mockResolvedValueOnce({
      results: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
      has_more: false,
      next_cursor: null,
    })
    mockedUpdate
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('rate limit'))

    await expect(deletePastExpenses()).rejects.toThrow(/1건 삭제 후 오류 발생/)
    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(revalidatePath).toHaveBeenCalledWith('/history')
  })

  it('페이지네이션을 처리하여 모든 ID를 수집 후 삭제한다', async () => {
    mockedQuery
      .mockResolvedValueOnce({
        results: new Array(100).fill(0).map((_, i) => ({ id: `p${i}` })),
        has_more: true,
        next_cursor: 'cursor-1',
      })
      .mockResolvedValueOnce({
        results: [{ id: 'p100' }],
        has_more: false,
        next_cursor: null,
      })
    mockedUpdate.mockResolvedValue({})

    const result = await deletePastExpenses()

    expect(result).toEqual({ deletedCount: 101 })
    expect(mockedUpdate).toHaveBeenCalledTimes(101)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx jest __tests__/actions/expense-bulk-delete.test.ts -t deletePastExpenses`
Expected: FAIL — `deletePastExpenses is not a function`

- [ ] **Step 3: 구현 추가**

Append to `lib/actions/expense.ts`:

```ts
export async function deletePastExpenses(): Promise<{ deletedCount: number }> {
  const yearMonth = getCurrentYearMonth()
  const { start } = getMonthDateRange(yearMonth)

  const ids: string[] = []
  let cursor: string | undefined = undefined
  do {
    const res: any = await notion.databases.query({
      database_id: DB.EXPENSE,
      filter: { property: '날짜', date: { before: start } },
      start_cursor: cursor,
      page_size: 100,
    })
    ids.push(...res.results.map((p: any) => p.id))
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined
  } while (cursor)

  let deletedCount = 0
  try {
    for (const id of ids) {
      await notion.pages.update({ page_id: id, in_trash: true })
      deletedCount++
    }
  } catch (e) {
    revalidatePath('/')
    revalidatePath('/history')
    throw new Error(`${deletedCount}건 삭제 후 오류 발생: ${(e as Error).message}`)
  }

  revalidatePath('/')
  revalidatePath('/history')
  return { deletedCount }
}
```

- [ ] **Step 4: 모든 테스트 통과 확인**

Run: `npx jest __tests__/actions/expense-bulk-delete.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/actions/expense.ts __tests__/actions/expense-bulk-delete.test.ts
git commit -m "feat(expense): deletePastExpenses 서버 액션 추가"
```

---

## Task 4: DataSettings 클라이언트 컴포넌트

**Files:**
- Create: `components/settings/data-settings.tsx`

- [ ] **Step 1: 컴포넌트 작성**

Create `components/settings/data-settings.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { countPastExpenses, deletePastExpenses } from '@/lib/actions/expense'
import { useLoadingAction } from '@/components/loading-provider'

export function DataSettings() {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState<number | null>(null)
  const { execute, isPending } = useLoadingAction()

  const handleOpenDialog = () => {
    execute(async () => {
      try {
        const c = await countPastExpenses()
        setCount(c)
        setOpen(true)
      } catch {
        toast.error('삭제 대상 조회 중 오류가 발생했습니다')
      }
    })
  }

  const handleConfirmDelete = () => {
    execute(async () => {
      try {
        const { deletedCount } = await deletePastExpenses()
        toast.success(`${deletedCount.toLocaleString()}건의 지난 지출 기록이 삭제됐습니다`)
        setOpen(false)
      } catch (e) {
        toast.error((e as Error).message || '삭제 중 오류가 발생했습니다')
        setOpen(false)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>지난 기간 데이터</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          현재 기간 시작일 이전의 모든 지출 기록을 삭제합니다. 예산, 계좌, 카테고리는 유지됩니다.
        </p>
        <Button variant="destructive" onClick={handleOpenDialog} disabled={isPending}>
          지난 기간 지출 삭제
        </Button>

        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>지난 지출 기록을 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                {count === 0
                  ? '삭제할 지출 기록이 없습니다.'
                  : `총 ${count?.toLocaleString()}건의 지출 기록이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>
                {count === 0 ? '닫기' : '취소'}
              </AlertDialogCancel>
              {count !== 0 && (
                <AlertDialogAction
                  onClick={handleConfirmDelete}
                  disabled={isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  삭제
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 새로 추가된 파일에 대해 타입 에러 없음. 만약 alert-dialog의 export 이름이 다르면(Task 1 Step 2에서 확인한 결과 사용) 위 import를 그에 맞게 수정.

- [ ] **Step 3: Commit**

```bash
git add components/settings/data-settings.tsx
git commit -m "feat(settings): DataSettings 컴포넌트 추가"
```

---

## Task 5: SettingsTabs에 "데이터" 탭 추가

**Files:**
- Modify: `components/settings/settings-tabs.tsx`

- [ ] **Step 1: 현재 상태 확인**

Read: `components/settings/settings-tabs.tsx`

확인할 부분:
- `TAB_ORDER`: `['accounts', 'categories', 'budgets']`
- `TabsList` 안의 `TabsTrigger` 3개
- 렌더 분기 3개 (`activeTab === 'accounts' | 'categories' | 'budgets'`)

- [ ] **Step 2: 수정**

Modify `components/settings/settings-tabs.tsx`:

a) 파일 상단 import에 추가:

```ts
import { DataSettings } from '@/components/settings/data-settings'
```

b) `TAB_ORDER` 변경:

```ts
const TAB_ORDER = ['accounts', 'categories', 'budgets', 'data']
```

c) `TabsList` 안에 추가 (budgets 뒤):

```tsx
<TabsTrigger value="budgets">예산</TabsTrigger>
<TabsTrigger value="data">데이터</TabsTrigger>
```

d) 렌더 분기 추가 (BudgetSettings 분기 뒤):

```tsx
{activeTab === 'budgets' && (
  <BudgetSettings
    categories={categories}
    currentYearMonth={currentYearMonth}
    budgets={budgets}
    hasPreviousMonthBudget={hasPreviousMonthBudget}
  />
)}
{activeTab === 'data' && <DataSettings />}
```

- [ ] **Step 3: 빌드 / 타입 체크**

Run: `npm run build`
Expected: 성공 (Notion 환경변수가 빌드 시점에 필요할 수 있음. 실패 시 `npm run lint && npx tsc --noEmit`로 대체).

- [ ] **Step 4: 개발 서버에서 시각 확인**

Run (백그라운드): `npm run dev`

브라우저에서 `/settings`로 이동:
- 4번째 탭 "데이터"가 표시됨
- 클릭하면 "지난 기간 데이터" Card와 destructive 버튼 표시
- 탭 전환 애니메이션이 기존 탭들과 동일하게 동작

- [ ] **Step 5: Commit**

```bash
git add components/settings/settings-tabs.tsx
git commit -m "feat(settings): 데이터 탭 추가"
```

---

## Task 6: 수동 QA 및 최종 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 전체 테스트 통과 확인**

Run: `npm test`
Expected: 모든 테스트 PASS (기존 + 신규 8건)

- [ ] **Step 2: 린트 통과 확인**

Run: `npm run lint`
Expected: 에러 없음

- [ ] **Step 3: 빈 상태 QA**

조건: 과거 기간 데이터가 없는 상태 (또는 모두 한번 삭제 후)
- 설정 → 데이터 탭 → "지난 기간 지출 삭제" 클릭
- 다이얼로그에 "삭제할 지출 기록이 없습니다" 표시 확인
- 삭제 버튼이 보이지 않고 "닫기" 버튼만 있음

- [ ] **Step 4: 정상 케이스 QA**

조건: 과거 1~3건 + 현재 기간 1~2건 입력
- 다이얼로그에 정확한 과거 건수 표시
- 삭제 후 토스트 "N건의 지난 지출 기록이 삭제됐습니다"
- `/history`로 이동하여 과거 데이터가 사라졌는지, 현재 기간 데이터는 유지되는지 확인

- [ ] **Step 5: 경계 검증 QA**

조건: 현재 기간 시작일 당일(예: `getMonthDateRange(getCurrentYearMonth()).start` 값) 날짜의 지출을 1건 추가
- 일괄 삭제 실행
- 해당 시작일 당일 지출이 **삭제되지 않음**을 확인

- [ ] **Step 6: 예산 보존 확인**

- 일괄 삭제 후 설정 → 예산 탭에서 과거 기간 예산 데이터가 그대로 유지되는지 확인 (예산은 별도 DB라 영향 없음)

- [ ] **Step 7: revalidate 확인**

- 일괄 삭제 직후 `/`(홈)과 `/history` 페이지를 (브라우저 새로고침 없이) 클릭으로 이동하여 데이터가 갱신되었는지 확인

- [ ] **Step 8: 페이지네이션 (선택)**

가능하면 100건 초과 데이터를 만들어 페이지네이션이 정상 동작하는지 확인. 어려우면 단위 테스트로 갈음했음을 인정.

---

## Self-Review Checklist (계획 작성자가 작성 후 점검)

- ✅ 스펙의 모든 요구사항이 태스크에 매핑됨 (Task 1: alert-dialog, Task 2-3: 서버 액션, Task 4: 컴포넌트, Task 5: 탭 통합, Task 6: 수동 QA)
- ✅ Placeholder 없음 ("TBD", "TODO" 사용 안함)
- ✅ 타입/함수 시그니처 일관성: `countPastExpenses(): Promise<number>`, `deletePastExpenses(): Promise<{ deletedCount: number }>`가 모든 태스크에서 동일
- ✅ AlertDialog export 이름은 Task 1 Step 2에서 실제 확인 후 Task 4 import 조정 — 시각적 의존성 명시함
- ✅ TDD 순서: 테스트 작성 → 실패 확인 → 구현 → 통과 확인 → 커밋
