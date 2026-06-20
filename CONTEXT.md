# CONTEXT — 도메인 / 아키텍처 용어집

expense-record의 ubiquitous language. 코드·문서·커밋·아키텍처 리뷰에서 같은 단어를 같은 뜻으로 쓰기 위한 기준 문서다.

## 도메인 개념

- **계좌(Account)** — 지출의 출처. Notion `계좌명`(title) 하나로 식별.
- **카테고리(Category)** — 한 계좌에 속하는 분류. `고정여부`가 true면 **고정 카테고리**로, 예산금액이 곧 지출로 간주된다(실제 지출 집계 대신 budget=spent).
- **지출(Expense)** — 사용처·금액·날짜·계좌·카테고리. 화면에는 계좌명/카테고리명까지 필요하지만 지출 페이지 자체에는 relation **id**만 있다.
- **예산(Budget)** — `연월`(YYYY-MM)·카테고리 단위의 예산금액. 같은 연월+카테고리는 하나만 존재(upsert).
- **참조 무결성** — 계좌/카테고리 삭제 시 이를 참조하는 카테고리/지출/예산이 있는지 먼저 검증한다. 카테고리 삭제는 연결된 예산을 cascade 삭제한다.
- **기준월 / 결제 주기** — 한 달은 **25일 ~ 익월 24일**로 정의한다(`lib/utils/date-range.ts`). `getCurrentYearMonth`는 25일 이상이면 당월, 24일 이하면 전월을 기준월로 본다.

## 아키텍처 용어

`/codebase-design` 어휘(module · interface · depth · deep/shallow · seam · adapter · leverage · locality)를 그대로 따른다. 그 위에 이 프로젝트 고유 용어를 더한다.

- **codec** — Notion 페이지 형태와 도메인 객체 사이의 **양방향 변환**을 책임지는 모듈. `read`(decode: page → domain), `write`(encode: input → Notion `properties`) 한 쌍으로 구성된다. 한글 property 이름(`'계좌명'` 등)과 Notion 형태(`.title[0]?.plain_text`, `.relation[0]?.id`, `.date?.start`, `.number`, `.checkbox`)를 **아는 유일한 장소**다. entity별로 존재: `accountCodec`, `categoryCodec`, `budgetCodec`, `expenseCodec`. `lib/notion/`에 거주.
  - 입력은 `any`(untyped Notion 페이지)를 허용하는 유일한 자리이고, 출력은 엄격한 도메인 타입이다. codec 바깥에 `page.properties...`나 `any`가 보이면 누수(leak) 신호다.
  - **adapter와 구분**: codec은 "형태 변환", adapter는 "seam을 채우는 것". 미래의 NotionRepo가 adapter 자리를 차지하며 내부에서 codec을 호출한다.
- **ExpenseRow** — 지출 페이지에 **실제로 보이는 필드만** 담은 타입(`Omit<Expense, 'accountName'|'categoryName'>`). `expenseCodec.read`의 반환값. 계좌명/카테고리명은 페이지에 없으므로 별도 join(이름 hydration)으로 채워 `Expense`가 된다.
