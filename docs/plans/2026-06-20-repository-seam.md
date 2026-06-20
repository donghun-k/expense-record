# Repository seam (아키텍처 후보 2)

작성일: 2026-06-20
출처: `/improve-codebase-architecture` → 후보 2 → `/grilling`
선행: 후보 1(codec) 완료 — `docs/plans/2026-06-20-notion-codec-deepening.md`

## 문제

action이 `notion.*`(`databases.query` / `pages.create` / `pages.update` / `pages.retrieve`)에 직접 의존한다. interface가 사실상 Notion SDK 전체라, action 로직(upsert 분기, copy, past 삭제, 참조 가드)을 테스트하려면 SDK를 통째로 mock해야 한다. 기존 `__tests__/actions/expense-bulk-delete.test.ts`가 그 증상이다 — Notion filter 모양·`{page_id, in_trash}`·`setTimeout`까지 단언하며 interface를 *지나서* 테스트한다.

## 목표

entity별 **repository**(도메인 형태 port) 뒤로 SDK를 숨긴다. 두 adapter(NotionRepo=prod, InMemoryRepo=test)가 seam을 실재화한다. 오케스트레이션은 repository를 주입받는 순수 **core**로 옮겨 mock 없이 테스트한다. NotionRepo는 후보 1의 codec을 내부 호출한다. 동작 보존.

## 확정된 설계 결정 (grilling)

1. **interface 고도** — **도메인 형태 메서드**(generic CRUD 아님). filter·sort·pagination·rate-limit·codec을 메서드 뒤로 흡수. 예: `expenseRepo.softDeleteBefore(date)`가 pagination+350ms rate-limit+배치를 숨김.
2. **범위** — **4 entity 전부**. account/category repo는 지금은 얇지만 후보 3(참조 무결성 가드)이 깊이를 채운다.
3. **주입 방식** — **functional core + imperative shell**. 순수 core 함수가 repo를 명시적으로 받고, 얇은 `'use server'` action이 `xRepo` 싱글턴 주입 + `revalidatePath`만 담당.
4. **core 입도** — 오케스트레이션이 있는 곳에만 core. 단일 repo 호출 pass-through는 action이 repo 직접 호출. validation은 로직의 home을 따라감.
5. **배치** — `lib/repositories/<entity>.ts`(interface + `createNotionXRepository()` + `export const xRepo` 싱글턴) · `lib/core/<entity>.ts`(순수 오케스트레이션) · `__tests__/fakes/<entity>-repo.ts`(`createInMemoryXRepository(seed?)`). Notion adapter는 codec import.
6. **메커니즘 테스트** — 책임 분리. InMemory fake = 도메인 계약만. core 테스트는 InMemory로 mock 0개. **NotionRepo adapter 테스트 1개**가 SDK mock으로 pagination·rate-limit·부분실패 카운트만 검증(유일한 SDK 결합 지점).
7. **삭제-with-integrity** — `deleteAccount`/`deleteCategory`(가드+cascade)는 **후보 2에서 건드리지 않음**. `softDelete`도 호출자 없으면 추가 안 함. 삭제 흐름 전체는 후보 3.
8. **순서** — vertical slice/엔티티별 1커밋. **account → budget → expense → category** (복잡도 오르막).
9. **`getExpensesByMonth`** — 이름 hydration이 핵심 관심사라 **후보 2에서 건드리지 않음**(후보 5). expense 슬라이스는 `create/update/softDelete/softDeleteBefore/countBefore`만 migrate.
10. **용어** — `repository` · `functional core / imperative shell` · `adapter`를 CONTEXT.md 등록(완료).

## entity별 repository interface (호출자 있는 메서드만)

```
AccountRepository
  list(): Promise<Account[]>
  create(input: { name }): Promise<void>
  update(id, input: { name }): Promise<void>

CategoryRepository
  list(accountId?): Promise<Category[]>
  create(input: { name, accountId, isFixed }): Promise<void>
  update(id, input): Promise<void>

BudgetRepository
  listByMonth(yearMonth): Promise<Budget[]>
  findByMonthAndCategory(yearMonth, categoryId): Promise<Budget | null>
  create(input: { yearMonth, categoryId, amount, categoryName }): Promise<void>
  updateAmount(id, amount): Promise<void>

ExpenseRepository
  create(input): Promise<void>
  update(id, input): Promise<void>
  softDelete(id): Promise<void>
  countBefore(date): Promise<number>            // pagination 흡수
  softDeleteBefore(date): Promise<{ deletedCount }> // pagination + rate-limit + 부분실패 흡수
  // listByDateRange / hydration 은 후보 5
```

## core 함수 (오케스트레이션이 있는 곳)

```
lib/core/budget.ts
  upsertBudget(repo, { yearMonth, categoryId, amount, categoryName })  // 존재검사 → create/update
  copyBudgetFromPreviousMonth(repo, categoryRepo, target, source)      // categoryRepo로 이름 조회
lib/core/expense.ts
  deletePastExpenses(repo, now)   // 기준월 경계 계산 → repo.softDeleteBefore
  countPastExpenses(repo, now)
```
account/category create/update/list, expense create/update/delete = pass-through, core 없음.

## 단위 작업 / 커밋 분할

각 단계 후 `npm run build`·`npm test`·누수 grep, 컨펌 후 커밋.

1. **account slice** — `lib/repositories/account.ts`(interface+NotionAdapter+싱글턴), `__tests__/fakes/account-repo.ts`, `account.ts` 재배선(list/create/update). repo-contract 테스트. (deleteAccount 미변경)
2. **budget slice** — `lib/repositories/budget.ts`, fake, `lib/core/budget.ts`(upsert/copy) + core 테스트(InMemory), `budget.ts` 재배선.
3. **expense slice** — `lib/repositories/expense.ts`(`softDeleteBefore`/`countBefore` 등), fake, `lib/core/expense.ts` + core 테스트, **NotionExpenseRepository adapter 테스트**(SDK mock, pagination/rate-limit) — 기존 `expense-bulk-delete.test.ts` 분할 이전, `expense.ts` 재배선(getExpensesByMonth 제외).
4. **category slice** — `lib/repositories/category.ts`, fake, `category.ts` 재배선(list/create/update). (deleteCategory 미변경)
5. **정리/리뷰** — 누수 검사(`notion.*`가 migrate된 action에서 사라졌는지), `docs/reviews/` 작업 요약.

## 검증

- core 테스트는 mock 0개(InMemory fake 주입). budget upsert create/update 분기, copy, past 삭제 경계(25일) 검증.
- NotionRepo adapter 테스트가 유일한 SDK-mock 테스트로 pagination·rate-limit·부분실패 카운트 검증.
- migrate된 action에서 `notion.*` 직접 호출 0(단, deleteAccount/deleteCategory=후보 3, getExpensesByMonth hydration=후보 5는 잔존 허용).
- 기존 테스트 회귀 없음.

## 후속 (이 계획 밖)

- **후보 3**: `deleteAccount`/`deleteCategory` 삭제 흐름 + 참조 무결성 모듈. account/category repo에 `softDelete`/`existsReferencing*` 추가, core 가드 테스트.
- **후보 5**: `getExpensesByMonth` hydration N+1 제거 → `listByDateRange` + 이름 join 조립 모듈.
