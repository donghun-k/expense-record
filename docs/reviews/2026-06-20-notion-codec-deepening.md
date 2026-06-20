# 리뷰 — Notion codec deepening (아키텍처 후보 1)

작성일: 2026-06-20
계획: `docs/plans/2026-06-20-notion-codec-deepening.md`

## 요약

`lib/notion.ts`가 raw Notion Client를 재노출하는 shallow 모듈이라, Notion 페이지 형태와 한글 property 이름이 4개 action 파일·10곳 이상으로 누수되던 문제를 해결했다. entity별 **codec**(`read`/`write`)을 도입해 Notion 형태를 한 곳에 가뒀다. 동작 보존 리팩터.

**핵심 성과**: `.properties['...']` 접근이 이제 `lib/notion/*.codec.ts` 4파일에만 존재한다. `lib/actions`·`app`·`components` 전 계층에서 누수 0.

## 변경 사항

| 단계 | 커밋 | 내용 |
|------|------|------|
| 1 scaffold | `8e7a13a` | `lib/notion.ts` → `lib/notion/client.ts`, `index.ts` 재export로 import 호환 |
| 2 account | `a131792` | `accountCodec` + 테스트, `account.ts` 교체 |
| 3 category | `904c0e0` | `categoryCodec` + 테스트, `category.ts` 교체 |
| 4 budget | `2123c13` | `budgetCodec` + 테스트, `budget.ts` 교체 (copyBudget는 categoryCodec 재사용) |
| 5 expense | `89aa45f` | `expenseCodec` + `ExpenseRow` + 테스트, `expense.ts` 교체 (hydration은 account/category codec 재사용) |

신규 파일: `lib/notion/{account,category,budget,expense}.codec.ts`, `__tests__/notion/*-codec.test.ts` 4개, `CONTEXT.md`.
타입 추가: `lib/types.ts`의 `ExpenseRow = Omit<Expense, 'accountName'|'categoryName'>`.

## 설계 결정 (grilling)

순수 매핑만(query/filter는 action 잔류) · 네임스페이스 객체 · `lib/notion/` 디렉터리 · write는 create-shaped full(budget 부분 update만 인라인) · `read`는 page-visible만(이름 hydration 분리) · property 이름 인라인 · 입력 `any`/출력 엄격 · 용어 `codec`/`ExpenseRow`를 CONTEXT.md 등록 · 전 entity read/write 테스트.

## 검증

- 테스트 49개 통과 (codec 테스트 17개 신규: account 4 · category 5 · budget 4 · expense 4).
- `tsc --noEmit`: codec 관련 신규 타입 에러 0. (`motion/react` 모듈 에러는 본 작업과 무관한 기존 이슈.)
- 누수 grep: `lib/actions`·`app`·`components`에서 `.properties[` 0건.

## 특이사항 / 후속

- **budget update 단일필드**(`예산금액`만)는 upsert 고유 로직이라 `budget.ts`에 인라인 유지 — codec interface를 좁게 보존(depth).
- **이름 hydration N+1**(`getExpensesByMonth`, `copyBudget`)은 의도적으로 잔존 → 후보 5에서 `ExpenseRow` + 조립 모듈로 제거 예정.
- **후보 2(repository)**: NotionRepo adapter가 이 codec을 내부 호출하는 형태로 자연히 얹힌다.
- 기존 `motion/react` 타입 에러는 별도 정리 필요(본 작업 범위 밖).
