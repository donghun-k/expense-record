# 커스텀 월 기간 설계 (25일~익월 24일)

## 개요

지출/예산 관리 기간을 달력 월(1일~말일)에서 커스텀 기간(25일~익월 24일)으로 변경한다.
"2026-04"를 선택하면 2026-04-25 ~ 2026-05-24 기간의 데이터를 조회한다.

## 설계 결정

- **Notion DB 스키마 변경 없음** — 예산의 `연월`은 "YYYY-MM" 형태 유지, 지출의 `날짜`는 "YYYY-MM-DD" 유지
- **데이터 마이그레이션 없음** — 지출은 날짜 기반 조회이므로 범위만 바뀌면 자동 반영
- **기간 정의를 중앙 유틸리티로 집중** — 단일 함수에서 범위를 계산하고 모든 사용처에서 호출

## 핵심 유틸리티

### `lib/utils/date-range.ts`

```typescript
/**
 * 기준월(YYYY-MM)을 받아 해당 기간의 시작일/종료일을 반환한다.
 * "2026-04" → { start: "2026-04-25", end: "2026-05-24" }
 */
function getMonthDateRange(yearMonth: string): { start: string; end: string }
```

- 입력: `YYYY-MM` 형식 문자열
- 시작일: 해당 월 25일
- 종료일: 익월 24일
- `new Date()` UTC 파싱 버그 방지를 위해 수동 파싱 패턴 사용

## 영향받는 파일 및 변경 내용

### 서버 액션

| 파일 | 함수 | 변경 내용 |
|------|------|-----------|
| `lib/actions/expense.ts` | `getExpensesByMonth` | 인라인 범위 계산을 `getMonthDateRange` 호출로 교체. Notion 필터를 `on_or_after: start`, `on_or_before: end`로 변경 |
| `lib/actions/budget.ts` | `getBudgetsByMonth` | 변경 없음 (연월 문자열 매칭) |
| `lib/actions/budget.ts` | `copyBudgetFromPreviousMonth` | 변경 없음 (연월 단위 참조) |

### UI 컴포넌트

| 파일 | 변경 내용 |
|------|-----------|
| `components/month-selector.tsx` | 기존 `2026-04` 표시에 추가로 `04.25 ~ 05.24` 기간을 서브텍스트로 표시 |
| `app/page.tsx` | `getMonthDateRange` 사용하여 지출 조회 (기존 인라인 범위 제거) |
| `app/history/page.tsx` | 동일하게 `getMonthDateRange` 적용 |
| `app/settings/page.tsx` | 변경 없음 (예산은 연월 매칭) |

### 변경하지 않는 것

- Notion DB 스키마 및 저장 형식
- 지출 입력 폼 (날짜 필드는 캘린더 선택 그대로)
- 예산 복사 로직
- 예산 설정 UI
