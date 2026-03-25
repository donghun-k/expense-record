# 지출 기간제 변경: 캘린더 월 → 25일~24일 기간

## 개요

지출 기록 기간을 캘린더 월(1일~말일)에서 25일~다음달 24일 기간으로 변경한다.
급여일 기준 가계부 관리를 위한 변경이며, 시작일은 25일로 고정(하드코딩)한다.

## 요구사항

- 지출 조회 기간: 매월 25일 ~ 다음달 24일
- 기간 라벨: "3/25 ~ 4/24" 형식으로 표시
- 메인 페이지: 오늘 날짜가 속한 기간의 예산 현황 표시
- 예산 매핑: 기간 시작월 기준 `"YYYY-MM"` 유지
- 기존 데이터: 마이그레이션 불필요 (수동 처리)
- URL 파라미터: `?month=YYYY-MM` 유지 (하위 호환)

## 설계

### 1. 기간 계산 유틸리티 (`lib/utils/period.ts`)

```typescript
const PERIOD_START_DAY = 25

interface Period {
  start: string     // "YYYY-MM-DD" (기간 시작일)
  end: string       // "YYYY-MM-DD" (기간 종료일, inclusive)
  label: string     // "3/25 ~ 4/24" (UI 표시용)
  yearMonth: string // "YYYY-MM" (예산 매핑용, 시작일 기준 월)
}

// 주어진 날짜가 속한 기간 반환
function getCurrentPeriod(date: Date): Period
// 로직:
//   if (date.getDate() >= 25)
//     start = 이번달/25, end = 다음달/24
//   else
//     start = 전달/25, end = 이번달/24
//
// 예: 3/25~4/24 사이 → { start: "2026-03-25", end: "2026-04-24", label: "3/25 ~ 4/24", yearMonth: "2026-03" }
// 예: 3/1~3/24 사이 → { start: "2026-02-25", end: "2026-03-24", label: "2/25 ~ 3/24", yearMonth: "2026-02" }
// 연말: 12/25 → { start: "2026-12-25", end: "2027-01-24", yearMonth: "2026-12" }
// 연초: 1/1 → { start: "2025-12-25", end: "2026-01-24", yearMonth: "2025-12" }

// 이전/다음 기간 계산
function getAdjacentPeriod(period: Period, direction: 'prev' | 'next'): Period

// yearMonth로부터 Period 복원 (URL 파라미터 → Period 변환)
// getCurrentPeriod(new Date(year, month - 1, 25)) 로 구현
// 주의: new Date("YYYY-MM-25") 문자열 파싱 사용 금지 (UTC 버그). 반드시 new Date(year, month-1, 25) 사용
```

### 2. 데이터 조회 로직 변경

#### `lib/actions/expense.ts`

`getExpensesByMonth(yearMonth: string)` → `getExpensesByPeriod(period: Period)` 로 변경:

- Notion 필터: `on_or_after: period.start`, `before: period.end의 다음날`
  - `end`는 inclusive이므로 Notion API의 `before` (exclusive) 사용 시 +1일 처리
- 정렬, 데이터 매핑 로직은 기존과 동일

#### `lib/actions/budget.ts`

변경 없음. `Period.yearMonth`를 기존 함수에 그대로 전달:

- `getBudgetsByMonth(period.yearMonth)`
- `upsertBudget(period.yearMonth, ...)`
- `copyBudgetFromPreviousMonth(current.yearMonth, prev.yearMonth)`

### 3. UI 변경

#### `components/month-selector.tsx`

- 표시: `"2026년 3월"` → `"3/25 ~ 4/24"` (`period.label`)
- 이전/다음 버튼: `getAdjacentPeriod()` 사용
- URL 파라미터: `?month={period.yearMonth}` (기존 형식 유지)

#### `app/history/page.tsx`

- `?month=YYYY-MM` 파라미터 → Period 변환 후 `getExpensesByPeriod()` 호출
- 기본값: `getCurrentPeriod(new Date())`

#### `app/page.tsx` (메인 페이지)

- 예산 현황에 현재 기간 라벨 표시
- `getExpensesByPeriod(getCurrentPeriod(new Date()))` 로 조회

#### `app/settings/page.tsx`

- `prevYearMonth` 계산: `subMonths` 대신 `getAdjacentPeriod(currentPeriod, 'prev').yearMonth` 사용
- 현재/이전 기간 예산 모두 Period 기반으로 조회

#### `components/settings/budget-settings.tsx`

- 월 선택 표시를 기간 라벨로 변경
- `handleCopyFromPrevious`: `subMonths` 대신 `getAdjacentPeriod(currentPeriod, 'prev').yearMonth` 사용
- `currentYearMonth` prop 대신 `Period` 객체를 받도록 변경

#### `components/month-selector.tsx` UI 조정

- 라벨 영역 너비: `w-24` → 기간 라벨("3/25 ~ 4/24") 수용 가능하도록 확장

### 4. 호출부 변경 요약

| 파일 | 기존 | 변경 |
|------|------|------|
| `app/page.tsx` | `getExpensesByMonth(currentYearMonth)` | `getExpensesByPeriod(getCurrentPeriod(new Date()))` |
| `app/history/page.tsx` | `getExpensesByMonth(yearMonth)` | `getExpensesByPeriod(period)` |
| `app/settings/page.tsx` | `subMonths`로 `prevYearMonth` 계산 | `getAdjacentPeriod(currentPeriod, 'prev').yearMonth` |
| `budget-settings.tsx` | `subMonths`로 전월 계산 | `getAdjacentPeriod`로 이전 기간 계산 |

## 변경하지 않는 것

- Notion DB 스키마 (계좌, 카테고리, 지출, 예산 구조 모두 유지)
- 예산 DB의 `연월` 필드 형식 (`"YYYY-MM"`)
- 지출 입력 폼 로직
- 다크모드, 토스트, 에러 바운더리 등 인프라

## 테스트 케이스 (`__tests__/utils/period.test.ts`)

### `getCurrentPeriod`
- 25일 당일 (3/25) → 새 기간 시작 (`start: "2026-03-25"`)
- 24일 당일 (3/24) → 이전 기간 마지막 날 (`end: "2026-03-24"`)
- 월 중간 (3/15) → 이전 기간에 속함 (`start: "2026-02-25"`)
- 연말 경계 (12/25) → `yearMonth: "2026-12"`, `end: "2027-01-24"`
- 연초 경계 (1/1) → `yearMonth: "2025-12"`, `start: "2025-12-25"`

### `getAdjacentPeriod`
- 다음 기간: "3/25~4/24" → "4/25~5/24"
- 이전 기간: "3/25~4/24" → "2/25~3/24"
- 연말→연초 순환: "12/25~1/24" → next → "1/25~2/24"
- 연초→전년 순환: "1/25~2/24" → prev → "12/25~1/24"
