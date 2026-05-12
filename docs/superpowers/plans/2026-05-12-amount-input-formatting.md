# Amount Input Formatting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 금액 입력 필드 전체에 실시간 쉼표 포맷팅을 적용한다 (내부 상태는 정수 유지).

**Architecture:** `lib/utils/number.ts`에 공유 유틸 함수를 생성하고, `ExpenseForm`, `ExpenseList`(편집 모드), `BudgetSettings` 세 컴포넌트에서 import해 사용한다. 입력 타입을 `type="number"`에서 `type="text" inputMode="numeric"`으로 변경하고, onChange 시 `formatNumber`를 적용한다.

**Tech Stack:** TypeScript, React 19, Jest

---

## File Map

| 상태 | 파일 | 역할 |
|------|------|------|
| 신규 | `lib/utils/number.ts` | `formatNumber`, `parseNumber` 유틸 함수 |
| 신규 | `__tests__/utils/number.test.ts` | 유틸 함수 단위 테스트 |
| 수정 | `components/expense-form.tsx` | 금액 입력 포맷팅 적용 |
| 수정 | `components/expense-list.tsx` | 편집 모드 금액 입력 포맷팅 적용 |
| 수정 | `components/settings/budget-settings.tsx` | 로컬 함수 → 공유 유틸 교체 |

---

### Task 1: `lib/utils/number.ts` 유틸 함수 (TDD)

**Files:**
- Create: `lib/utils/number.ts`
- Create: `__tests__/utils/number.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

```ts
// __tests__/utils/number.test.ts
import { formatNumber, parseNumber } from '@/lib/utils/number'

describe('formatNumber', () => {
  it('숫자 문자열을 쉼표 포맷으로 변환한다', () => {
    expect(formatNumber('1234567')).toBe('1,234,567')
  })
  it('이미 쉼표가 있는 값도 올바르게 재포맷한다', () => {
    expect(formatNumber('1,234,567')).toBe('1,234,567')
  })
  it('빈 문자열이면 빈 문자열을 반환한다', () => {
    expect(formatNumber('')).toBe('')
  })
  it('숫자가 아닌 문자를 모두 제거한다', () => {
    expect(formatNumber('1a2b3')).toBe('123')
  })
  it('1000 미만은 쉼표 없이 반환한다', () => {
    expect(formatNumber('999')).toBe('999')
  })
})

describe('parseNumber', () => {
  it('쉼표를 제거하고 숫자 문자열을 반환한다', () => {
    expect(parseNumber('1,234,567')).toBe('1234567')
  })
  it('쉼표가 없는 문자열은 그대로 반환한다', () => {
    expect(parseNumber('1234')).toBe('1234')
  })
  it('빈 문자열이면 빈 문자열을 반환한다', () => {
    expect(parseNumber('')).toBe('')
  })
})
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

```bash
npx jest __tests__/utils/number.test.ts
```

예상 결과: `Cannot find module '@/lib/utils/number'`

- [ ] **Step 3: 유틸 함수 구현**

```ts
// lib/utils/number.ts
export function formatNumber(value: string): string {
  const num = value.replace(/[^0-9]/g, '')
  if (!num) return ''
  return parseInt(num, 10).toLocaleString()
}

export function parseNumber(formatted: string): string {
  return formatted.replace(/,/g, '')
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest __tests__/utils/number.test.ts
```

예상 결과: 모든 테스트 PASS

- [ ] **Step 5: 커밋**

```bash
git add lib/utils/number.ts __tests__/utils/number.test.ts
git commit -m "feat: add shared number formatting utilities"
```

---

### Task 2: `budget-settings.tsx` — 로컬 함수를 공유 유틸로 교체

**Files:**
- Modify: `components/settings/budget-settings.tsx:21-29`

- [ ] **Step 1: 로컬 함수 제거 후 import 추가**

`components/settings/budget-settings.tsx`에서 아래 두 함수(21~29번째 줄)를 삭제하고:

```ts
function formatNumber(value: string): string {
  const num = value.replace(/[^0-9]/g, '')
  if (!num) return ''
  return parseInt(num, 10).toLocaleString()
}

function parseNumber(formatted: string): string {
  return formatted.replace(/,/g, '')
}
```

파일 상단 import 영역에 아래를 추가한다:

```ts
import { formatNumber, parseNumber } from '@/lib/utils/number'
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```

예상 결과: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add components/settings/budget-settings.tsx
git commit -m "refactor(budget-settings): use shared number formatting utilities"
```

---

### Task 3: `expense-form.tsx` — 금액 입력 포맷팅 적용

**Files:**
- Modify: `components/expense-form.tsx`

- [ ] **Step 1: import 추가**

파일 상단 import 영역에 추가:

```ts
import { formatNumber, parseNumber } from '@/lib/utils/number'
```

- [ ] **Step 2: handleSubmit의 파싱 로직 수정**

기존 (39번째 줄):
```ts
const parsedAmount = parseInt(amount, 10)
```

변경 후:
```ts
const parsedAmount = parseInt(parseNumber(amount), 10)
```

- [ ] **Step 3: 제출 후 상태 초기화 — 변경 없음**

`setAmount('')`는 그대로 유지한다.

- [ ] **Step 4: Input 교체**

기존 (92번째 줄):
```tsx
<Input type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" />
```

변경 후:
```tsx
<Input
  type="text"
  inputMode="numeric"
  placeholder="0"
  value={amount}
  onChange={(e) => setAmount(formatNumber(e.target.value))}
/>
```

- [ ] **Step 5: 빌드 확인**

```bash
npm run build
```

예상 결과: 오류 없음

- [ ] **Step 6: 커밋**

```bash
git add components/expense-form.tsx
git commit -m "feat(expense-form): apply comma formatting to amount input"
```

---

### Task 4: `expense-list.tsx` — 편집 모드 금액 입력 포맷팅 적용

**Files:**
- Modify: `components/expense-list.tsx`

- [ ] **Step 1: import 추가**

파일 상단 import 영역에 추가:

```ts
import { formatNumber, parseNumber } from '@/lib/utils/number'
```

- [ ] **Step 2: openEdit에서 초기값 포맷팅 적용**

기존 (66번째 줄):
```ts
setEditAmount(String(expense.amount))
```

변경 후:
```ts
setEditAmount(formatNumber(String(expense.amount)))
```

- [ ] **Step 3: handleUpdate의 파싱 로직 수정**

기존 (73번째 줄):
```ts
const parsedAmount = parseInt(editAmount, 10)
```

변경 후:
```ts
const parsedAmount = parseInt(parseNumber(editAmount), 10)
```

- [ ] **Step 4: Input 교체**

기존 (241번째 줄):
```tsx
<Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} min="1" />
```

변경 후:
```tsx
<Input
  type="text"
  inputMode="numeric"
  value={editAmount}
  onChange={(e) => setEditAmount(formatNumber(e.target.value))}
/>
```

- [ ] **Step 5: 빌드 확인**

```bash
npm run build
```

예상 결과: 오류 없음

- [ ] **Step 6: 커밋**

```bash
git add components/expense-list.tsx
git commit -m "feat(expense-list): apply comma formatting to edit amount input"
```

---

### Task 5: 전체 테스트 및 최종 확인

- [ ] **Step 1: 전체 테스트 실행**

```bash
npm test
```

예상 결과: 모든 테스트 PASS

- [ ] **Step 2: 개발 서버 실행 후 수동 검증**

```bash
npm run dev
```

확인 항목:
- `/` 페이지: 금액 입력 시 실시간 쉼표 포맷팅 (예: `1234` 입력 → `1,234` 표시)
- `/history` 페이지: 지출 편집 다이얼로그의 금액 필드에 기존 값이 쉼표 포맷으로 표시됨
- `/settings` 페이지: BudgetSettings 금액 입력이 기존과 동일하게 동작
- 세 곳 모두 제출 후 올바른 정수값으로 저장됨
