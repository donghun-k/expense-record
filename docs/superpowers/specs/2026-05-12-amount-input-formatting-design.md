# Amount Input Formatting Design

**Date:** 2026-05-12  
**Status:** Approved

## Goal

금액 입력 필드에서 UI 표시는 세 자리마다 쉼표로 구분(e.g. `1,234,567`)하되, 실제 상태 및 서버 전달 값은 정수(number)로 유지한다.

## Scope

변경 대상 파일 4개:

1. `lib/utils/number.ts` — 신규 생성
2. `components/expense-form.tsx`
3. `components/expense-list.tsx`
4. `components/settings/budget-settings.tsx`

## Shared Utility

`lib/utils/number.ts` 신규 생성. `budget-settings.tsx`의 로컬 함수를 이동.

```ts
export function formatNumber(value: string): string {
  const num = value.replace(/[^0-9]/g, '')
  if (!num) return ''
  return parseInt(num, 10).toLocaleString()
}

export function parseNumber(formatted: string): string {
  return formatted.replace(/,/g, '')
}
```

## Component Changes

### expense-form.tsx

- Input: `type="number"` → `type="text"` + `inputMode="numeric"`
- `onChange`: `setAmount(formatNumber(e.target.value))`
- 제출 시: `parseInt(parseNumber(amount), 10)` → 서버 액션 전달
- 유효성 검사 로직은 기존과 동일

### expense-list.tsx (편집 모드)

- 편집 진입 시: `setEditAmount(formatNumber(String(expense.amount)))`
- Input: `type="number"` → `type="text"` + `inputMode="numeric"`
- `onChange`: `setEditAmount(formatNumber(e.target.value))`
- 제출 시: `parseInt(parseNumber(editAmount), 10)` → 서버 액션 전달

### budget-settings.tsx

- 로컬 `formatNumber`/`parseNumber` 함수 제거
- `import { formatNumber, parseNumber } from '@/lib/utils/number'` 추가
- 나머지 로직 변경 없음

## Data Flow

```
사용자 입력 → formatNumber → 상태(string) → UI 표시
                                           → 제출 시 parseInt(parseNumber()) → number → Server Action
```

## Constraints

- `type="text"`로 변경 시 브라우저 기본 숫자 유효성 검사가 사라지므로, 기존 `parseInt` 기반 검증 로직으로 커버
- 음수 입력 불가 (`/[^0-9]/g` 패턴으로 숫자만 허용)
