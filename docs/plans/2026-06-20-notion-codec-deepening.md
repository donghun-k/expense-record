# Notion codec deepening (아키텍처 후보 1)

작성일: 2026-06-20
출처: `/improve-codebase-architecture` → 후보 1 → `/grilling`

## 문제

`lib/notion.ts`가 raw Notion `Client`와 DB id를 그대로 재노출하는 **shallow** 모듈이다. 그 결과 Notion 페이지 형태(`.title[0]?.plain_text`, `.relation[0]?.id`, `.date?.start`, `.number`, `.checkbox`)와 한글 property 이름(`'계좌명'`, `'카테고리'`, `'연월'` …)이 4개 action 파일·10곳 이상으로 누수된다. action 계층은 사실상 테스트 불가다(테스트는 utils 3개뿐).

**deletion test**: codec 개념을 지우면 `.title[0]?.plain_text` 복잡도가 즉시 4파일로 재출현 → 누수가 실재함.

## 목표

Notion 형태를 entity별 **codec**(`read`/`write`) 한 곳에 가둔다. 동작 보존 리팩터.

## 확정된 설계 결정 (grilling)

1. **범위** — codec은 **순수 매핑만**. `read(page) → domain`, `write(input) → properties`. query/create/update 호출과 filter·sort는 action에 남긴다. (NotionRepo 흡수는 후보 2.)
2. **interface 형태** — 네임스페이스 객체. `expenseCodec.read(page)`, `expenseCodec.write(input)`.
3. **배치** — `lib/notion/` 디렉터리. 기존 `lib/notion.ts` → `lib/notion/client.ts`(Client+DB), entity별 `*.codec.ts`. `lib/notion/index.ts`가 `client`를 재export해 `@/lib/notion` import 호환 유지.
4. **write 비대칭** — `write`는 create-shaped **full properties**만 책임. budget update의 단일필드(`예산금액`만) 갱신은 action에 인라인으로 남긴다(동작 보존). account/category/expense는 create=update라 `write` 하나로 양쪽 덮음.
5. **이름 join 경계** — `expenseCodec.read`는 **페이지에 보이는 것만** 반환(`ExpenseRow`). 계좌명/카테고리명 hydration join은 action에 그대로(후보 5가 흡수).
6. **property 이름** — codec 내부 string literal 인라인. 별도 상수 레이어 없음(그 자체가 shallow).
7. **타이핑** — `read(page: any): Domain`. 입력 `any`는 codec에 집중되는 유일한 더러움, 출력은 엄격한 도메인 타입.
8. **네이밍** — `codec` + `ExpenseRow` (CONTEXT.md 등록 완료).
9. **테스트** — entity별 read/write 라운드트립 테스트. 전 entity fixture. `?? ''` / `?? 0` fallback 경계 포함.

## codec interface (entity별)

```
accountCodec.read(page)  → Account            // 계좌명
accountCodec.write({name}) → properties

categoryCodec.read(page) → Category           // 카테고리명, 계좌(relation), 고정여부(checkbox)
categoryCodec.write({name, accountId, isFixed}) → properties

budgetCodec.read(page)   → Budget             // 연월(rich_text), 예산금액(number), 카테고리(relation)
budgetCodec.write({yearMonth, categoryId, amount, categoryName}) → properties  // 이름+연월+예산금액+카테고리

expenseCodec.read(page)  → ExpenseRow          // 사용처, 금액, 날짜, 계좌id, 카테고리id (이름 제외)
expenseCodec.write({title, amount, date, accountId, categoryId}) → properties
```

`ExpenseRow = Omit<Expense, 'accountName' | 'categoryName'>` (`lib/types.ts`에 추가).

## 단위 작업 / 커밋 분할 (One task per commit)

각 단계 후 `npm run build` + `npm test` 통과 확인, 사용자 컨펌 후 커밋.

1. **scaffold** — `lib/notion.ts` → `lib/notion/client.ts` 이동, `lib/notion/index.ts` 재export. import 경로 호환 확인. (동작 변화 없음)
2. **account codec** — `lib/notion/account.codec.ts` + 테스트. `account.ts`의 read/write를 codec 호출로 교체.
3. **category codec** — `category.codec.ts` + 테스트. `category.ts` 교체.
4. **budget codec** — `budget.codec.ts` + 테스트. `budget.ts`의 create(write) 교체. update 단일필드는 인라인 유지.
5. **expense codec + ExpenseRow** — `types.ts`에 `ExpenseRow`, `expense.codec.ts` + 테스트. `expense.ts` create/update/read 교체. 이름 hydration join은 유지.
6. **정리/리뷰** — 남은 `page.properties...` 누수 0 확인(grep), `docs/reviews/`에 작업 요약 기록.

## 검증

- `__tests__/notion/*-codec.test.ts` 전 entity read/write + fallback 경계.
- 기존 `__tests__/utils/*`, `__tests__/actions/expense-bulk-delete.test.ts` 회귀 없음.
- `grep -rn "properties\['" lib/actions/` 결과 0 (codec 바깥 누수 없음).

## 후속 (이 계획 밖)

- 후보 2: NotionRepo adapter가 codec을 내부 호출.
- 후보 5: 이름 hydration N+1 제거 → `ExpenseRow` + join을 조립 모듈로.
