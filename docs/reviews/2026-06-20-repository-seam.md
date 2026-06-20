# 리뷰 — Repository seam (아키텍처 후보 2)

작성일: 2026-06-20
계획: `docs/plans/2026-06-20-repository-seam.md`
선행: 후보 1(codec) — `docs/reviews/2026-06-20-notion-codec-deepening.md`

## 요약

action이 `notion.*`(SDK 전체)에 직접 의존해 테스트가 불가능하던 문제를, entity별 **repository**(도메인 형태 port) 뒤로 SDK를 숨겨 해결했다. 두 adapter(NotionRepo=prod, InMemoryRepo=test)가 seam을 실재화하고, 오케스트레이션은 repository를 주입받는 순수 **core**로 옮겨 mock 없이 테스트한다. 동작 보존.

**핵심 성과**: migrate한 모든 연산에서 action이 `notion.*`을 직접 부르지 않는다. 남은 `notion.*`은 의도적으로 미룬 두 경계뿐 — 삭제 가드(후보 3)·이름 hydration(후보 5).

## 변경 사항

| 단계 | 커밋 | 내용 |
|------|------|------|
| 1 account | `a1bedfc` | AccountRepository + adapter + fake, get/create/update 재배선. jest testMatch 한정 |
| 2 budget | `eb8d0ec` | BudgetRepository + **core 계층 도입**(upsert), budgetCodec.writeAmount 추가 |
| 3 expense | `0adae21` | ExpenseRepository(softDeleteBefore가 pagination+rate-limit 흡수), brittle 테스트 3분할 |
| 4 category | `149b321` | CategoryRepository + **copyBudget core 이전**(N+1 제거), budget.ts notion.* 0 |

신규 디렉터리: `lib/repositories/`(4) · `lib/core/`(budget, expense) · `__tests__/fakes/`(4) · `__tests__/core/`(2) · `__tests__/repositories/`(4).

## 설계 결정 (grilling, 10개)

도메인 형태 메서드(generic CRUD ✗) · 4 entity 전부 · functional core + imperative shell · core는 오케스트레이션 있는 곳에만 · `lib/repositories/`(port+Notion adapter)·`lib/core/`·`__tests__/fakes/`(InMemory) · 메커니즘은 adapter 테스트로 국소화 · 삭제-with-integrity는 후보 3 · account→budget→expense→category · getExpensesByMonth는 후보 5 · 용어 CONTEXT.md 등록.

## 검증

- 테스트 74개 통과 (후보 1: 49 → 74, +25).
  - **core 테스트는 mock 0개**: budget upsert(create/update 분기·중복 방지·음수), copy(복사·갱신·빈 소스), expense 과거 경계(25일 cutoff).
  - **adapter 테스트(SDK mock)**: expense pagination·rate-limit·부분실패, account/category/budget 배선. SDK 결합이 이 소수 테스트로 국소화.
  - **action 테스트**: deletePastExpenses 캐시 무효화 + PartialDeletionError 메시지 변환.
- `tsc --noEmit`: 신규 타입 에러 0. (`motion/react` 에러는 본 작업 무관 기존 이슈.)
- migrate된 action의 `notion.*` 직접 호출 0. budget.ts는 완전 이전(0).

## 특이사항 / 후속

- **잔여 `notion.*`은 전부 의도된 경계**: account.ts/category.ts의 deleteX(가드+cascade)=후보 3, expense.ts의 getExpensesByMonth(hydration)=후보 5.
- **`budgetCodec.writeAmount` 추가** — 후보 1 Q4에서 미뤘으나, repository updateAmount에 실제 호출자가 생겨 property 이름이 codec 바깥으로 새지 않게 정당화됨.
- **copyBudget N+1 제거** — per-category `pages.retrieve`를 `categoryRepo.list()` 1회로 대체(부수 효과로 후보 5와 무관한 N+1 해소).
- **PartialDeletionError** — softDeleteBefore의 부분실패 계약을 타입 에러로 표현, action이 사용자 메시지로 변환.
- **revalidate 보존** — copyBudget은 기존엔 transitive upsert로 갱신됐는데, core upsert가 revalidate를 떼면서 action에 명시 revalidate를 추가해 동작 보존.

## 후속 (이 계획 밖)

- **후보 3**: deleteAccount/deleteCategory 삭제 흐름 + 참조 무결성 모듈. account/category repo에 `softDelete`/`existsReferencing*` 추가.
- **후보 5**: getExpensesByMonth hydration N+1 제거 → `listByDateRange` + 이름 join 조립 모듈.
