# 계획 — 후보 3: 참조 무결성 모듈 (account/category 삭제 가드 + 예산 cascade)

작성: 2026-06-20 · 선행: 후보 1(codec)·후보 2(repository seam) 완료(HEAD `df583fb`)

## 목표

`lib/actions/account.ts`·`category.ts`의 `deleteAccount`/`deleteCategory`에 남아 있는 raw
`notion.databases.query` / `notion.pages.update` 호출을 **repository seam + 순수 core**로 옮긴다.
참조 무결성 가드와 예산 cascade는 마지막으로 남은 의도적 경계(후보 1·2가 손대지 않음)였다.

동작은 100% 보존한다: 거부 메시지(한글), `{success, message}` 반환 계약, 검사 순서, 병렬 cascade.

## 설계 결정 (`/grilling`으로 확정)

1. **참조 조회 = `exists*` boolean.** 가드는 "참조가 하나라도 있나?"만 묻는다. Notion adapter는
   relation filter + `page_size: 1`로 첫 페이지만 보고 `results.length > 0` 반환(pagination 불필요, 가장 깊고 쌈).
   `count`(전체 pagination 강제)·`list`(정렬·전체 도메인 객체) 재사용보다 의도가 또렷하다.
2. **cascade = `budgetRepo.softDeleteByCategory(categoryId)` adapter 메서드.** pagination + 다건 삭제를
   메서드 뒤로 흡수(선례: `expenseRepo.softDeleteBefore`). 현재의 `Promise.all` 병렬 삭제를 보존.
3. **가드 오케스트레이션 = 엔티티별 core 파일.** `lib/core/account.ts`(`deleteAccount`),
   `lib/core/category.ts`(`deleteCategory`). 두 함수는 공유 코드가 없어 개념(`referential-integrity.ts`)으로
   묶으면 shallow grouping. 기존 `lib/core/expense.ts`·`budget.ts` 엔티티명 관습과 일치.
4. **core가 `{success, message}` + 한글 메시지 반환.** action은 싱글턴 주입 + `revalidatePath`만.
   선례: `upsertBudget`이 이미 한글 도메인 문자열을 throw → core가 한글 메시지를 들고 있는 게 확립된 관습.
5. **`PartialDeletionError` 재사용 안 함.** cascade 실패 시 adapter throw → core catch →
   `{success:false, message:'연결된 예산 삭제 중...'}`. 현 동작은 카운트를 쓰지 않으므로 카운트 기계장치 불필요.

## 새 repository 메서드 (전부 실제 호출자와 함께 도착 — speculative 금지)

| repo | 메서드 | 호출자 |
|------|--------|--------|
| `accountRepo` | `softDelete(id)` | `core/account.deleteAccount` |
| `categoryRepo` | `existsByAccount(accountId)` | `core/account.deleteAccount` |
| `categoryRepo` | `softDelete(id)` | `core/category.deleteCategory` |
| `expenseRepo` | `existsByAccount(accountId)` | `core/account.deleteAccount` |
| `expenseRepo` | `existsByCategory(categoryId)` | `core/category.deleteCategory` |
| `budgetRepo` | `softDeleteByCategory(categoryId)` | `core/category.deleteCategory` |

InMemory fake(`__tests__/fakes/`)도 동일 계약 구현.

## core 시그니처 (기존 positional-repo 관습)

```ts
// lib/core/account.ts
export async function deleteAccount(
  accountRepo: AccountRepository, categoryRepo: CategoryRepository, expenseRepo: ExpenseRepository, id: string
): Promise<{ success: boolean; message?: string }>
//  ① categoryRepo.existsByAccount → 거부  ② expenseRepo.existsByAccount → 거부  ③ accountRepo.softDelete

// lib/core/category.ts
export async function deleteCategory(
  categoryRepo: CategoryRepository, expenseRepo: ExpenseRepository, budgetRepo: BudgetRepository, id: string
): Promise<{ success: boolean; message?: string }>
//  ① expenseRepo.existsByCategory → 거부  ② budgetRepo.softDeleteByCategory(try/catch) → 실패 시 거부  ③ categoryRepo.softDelete
```

## 작업 슬라이스 (한 커밋 한 작업)

- **커밋 0**: 이 계획 문서.
- **커밋 1 (account)**: `accountRepo.softDelete` + `categoryRepo.existsByAccount` + `expenseRepo.existsByAccount`
  + fakes + `lib/core/account.ts` + `__tests__/core/account.test.ts`(TDD) + action wiring.
- **커밋 2 (category)**: `categoryRepo.softDelete` + `expenseRepo.existsByCategory` + `budgetRepo.softDeleteByCategory`
  + fakes + `lib/core/category.ts` + `__tests__/core/category.test.ts`(TDD) + action wiring.

각 슬라이스: `/tdd`로 core를 red→green, `npx tsc --noEmit`, 단일 테스트 → 전체 `npm test`,
`grep -rn "notion\." lib/actions/account.ts`(또는 category)로 누수 0 확인, 사용자 컨펌 후 커밋.

## 검증

- `npm test` (jest), `npx tsc --noEmit` (단 `motion/react` 모듈 에러는 기존 이슈 — 무시).
- 누수 grep: 슬라이스 후 해당 action 파일에 `notion.`이 남지 않아야 한다.
- 동작 보존: 거부 메시지 문자열·검사 순서·`revalidatePath` 경로 동일.
