# 계획 — 후보 5: 지출 이름 hydration N+1 제거

작성: 2026-06-20 · 선행: 후보 3(참조 무결성) 완료(HEAD `0859b6d`)

## 문제

`lib/actions/expense.ts` `getExpensesByMonth`는 지출을 조회한 뒤, 계좌명/카테고리명을 채우려고
참조된 id마다 `notion.pages.retrieve`를 **N번** 호출한다(고유 id 수만큼). 마지막으로 남은
의도적 notion 경계이자, action 안에 hydration 조립 로직이 새어 있는 자리다.

## 설계 결정 (확립된 패턴 적용 — 후보 1·2와 동일 결)

1. **`expenseRepo.listByDateRange(start, end): Promise<ExpenseRow[]>` 추가.** 날짜 filter와
   내림차순 정렬(현 동작)을 메서드 뒤로 흡수. codec.read가 주는 `ExpenseRow`(이름 제외)를 반환 —
   이름은 페이지에 없으므로 repo 책임이 아니다. (실제 호출자 = core, speculative 아님.)
2. **이름 join을 순수 core로.** `lib/core/expense.ts`에 `listExpensesByMonth(expenseRepo,
   accountRepo, categoryRepo, yearMonth)` 추가. `getMonthDateRange(yearMonth)`로 기간 계산(도메인
   경계 — 기존 `pastBoundary`와 같은 자리), `expenseRepo.listByDateRange` + `accountRepo.list()` +
   `categoryRepo.list()`를 **각 1회** 조회 후 메모리 join → `Expense[]`. per-page retrieve N+1 제거.
3. **join 기법 = id→name Map.** `copyBudgetFromPreviousMonth`의 `nameById` Map 선례 그대로.
   매칭 없으면 `''`(현 `?? ''` 동작 보존).
4. **account/category repo는 새 메서드 없음.** `list()`가 이미 존재 → 그대로 leverage.
   추가되는 메서드는 `expenseRepo.listByDateRange` 하나.
5. **action은 얇은 shell.** `getExpensesByMonth(yearMonth)`는 싱글턴 3개를 core에 주입만.
   `getMonthDateRange` import·codec import·`notion` import 전부 제거.

## core 시그니처

```ts
// lib/core/expense.ts (기존 파일에 추가)
export async function listExpensesByMonth(
  expenseRepo: ExpenseRepository, accountRepo: AccountRepository,
  categoryRepo: CategoryRepository, yearMonth: string
): Promise<Expense[]>
//  range = getMonthDateRange(yearMonth)
//  rows = expenseRepo.listByDateRange(range.start, range.end)  (정렬은 repo)
//  accountName/categoryName = Map(accountRepo.list()) / Map(categoryRepo.list()) join
```

## 작업 슬라이스 (한 커밋 한 작업)

- **커밋 0**: 이 계획 문서.
- **커밋 1 (expense hydration)**: `expenseRepo.listByDateRange` + InMemory fake + `lib/core/expense.ts`
  `listExpensesByMonth` + `__tests__/core/expense.test.ts` 보강(TDD) + action wiring.

검증: core 테스트 red→green, `npx tsc --noEmit`(motion 무관 에러 무시), 단일 → 전체 `npm test`,
`grep -n "notion\." lib/actions/expense.ts`로 누수 0 확인, 사용자 컨펌 후 커밋.

## 후보 4 (별건, 선택)

`app/page.tsx:33-64`의 BudgetStatus 조립(고정카테고리 규칙 + budget×category×account 3-way join)도
같은 결의 순수 함수 추출 대상이다. 후보 5와 독립이므로 사용자 판단에 따라 별도 슬라이스로 진행.
