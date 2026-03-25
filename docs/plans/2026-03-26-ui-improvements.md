# UI 개선 4종 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Select 레이블 표시 수정, 숫자 천단위 포맷팅, 예산 저장 상태 표시, 지출 내역 필터 기능 추가

**Architecture:** 4개의 독립적인 클라이언트 사이드 UI 개선. Select 컴포넌트 레벨 수정 후 사용처 반영, 예산 설정에 dirty/saved 상태 추가, 지출 내역에 클라이언트 필터 추가.

**Tech Stack:** Next.js 16, React 19, @base-ui/react Select, Tailwind CSS v4, Sonner toast, Lucide icons

---

## Chunk 1: Select 레이블 표시 수정 + 숫자 포맷팅

### Task 1: SelectValue 컴포넌트 수정

`@base-ui/react/select`의 `Select.Value`가 선택된 항목의 `value`(Notion ID)를 그대로 표시하는 문제. `SelectValue`에 `label` prop을 추가하여 명시적으로 레이블을 전달할 수 있게 수정한다.

**Files:**
- Modify: `components/ui/select.tsx:21-29`

- [ ] **Step 1: SelectValue에 label prop 추가**

`SelectPrimitive.Value` 대신 label이 있으면 직접 렌더링하도록 수정:

```tsx
function SelectValue({
  className,
  label,
  placeholder,
  ...props
}: SelectPrimitive.Value.Props & { label?: string }) {
  return (
    <span
      data-slot="select-value"
      className={cn(
        "flex flex-1 text-left",
        !label && "text-muted-foreground",
        className
      )}
    >
      {label || placeholder}
    </span>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add components/ui/select.tsx
git commit -m "fix: SelectValue에 label prop 추가하여 ID 대신 레이블 표시 지원"
```

### Task 2: ExpenseForm Select 레이블 표시 수정

**Files:**
- Modify: `components/expense-form.tsx:114,127`

- [ ] **Step 1: 계좌 Select에 label 전달**

```tsx
// 기존 (line 114)
<SelectTrigger><SelectValue placeholder="계좌 선택" /></SelectTrigger>

// 수정
<SelectTrigger>
  <SelectValue
    placeholder="계좌 선택"
    label={accounts.find((a) => a.id === accountId)?.name}
  />
</SelectTrigger>
```

- [ ] **Step 2: 카테고리 Select에 label 전달**

```tsx
// 기존 (line 127)
<SelectValue placeholder={accountId ? '카테고리 선택' : '계좌를 먼저 선택하세요'} />

// 수정
<SelectValue
  placeholder={accountId ? '카테고리 선택' : '계좌를 먼저 선택하세요'}
  label={filteredCategories.find((c) => c.id === categoryId)?.name}
/>
```

- [ ] **Step 3: 커밋**

```bash
git add components/expense-form.tsx
git commit -m "fix: 지출 입력 폼 Select에서 레이블 표시되도록 수정"
```

### Task 3: ExpenseList 수정 다이얼로그 Select 레이블 표시 수정

**Files:**
- Modify: `components/expense-list.tsx:161,170`

- [ ] **Step 1: 수정 다이얼로그의 계좌 Select에 label 전달**

```tsx
// 기존 (line 161)
<SelectTrigger><SelectValue /></SelectTrigger>

// 수정
<SelectTrigger>
  <SelectValue
    placeholder="계좌 선택"
    label={accounts.find((a) => a.id === editAccountId)?.name}
  />
</SelectTrigger>
```

- [ ] **Step 2: 수정 다이얼로그의 카테고리 Select에 label 전달**

```tsx
// 기존 (line 170)
<SelectTrigger><SelectValue /></SelectTrigger>

// 수정
<SelectTrigger>
  <SelectValue
    placeholder="카테고리 선택"
    label={filteredCategories.find((c) => c.id === editCategoryId)?.name}
  />
</SelectTrigger>
```

- [ ] **Step 3: 커밋**

```bash
git add components/expense-list.tsx
git commit -m "fix: 지출 수정 다이얼로그 Select에서 레이블 표시되도록 수정"
```

### Task 4: CategorySettings Select 레이블 표시 수정

**Files:**
- Modify: `components/settings/category-settings.tsx:73-74,93`

- [ ] **Step 1: 카테고리 추가 폼의 계좌 Select에 label 전달**

```tsx
// 기존 (line 73-74)
<SelectTrigger className="w-40">
  <SelectValue placeholder="계좌 선택" />
</SelectTrigger>

// 수정
<SelectTrigger className="w-40">
  <SelectValue
    placeholder="계좌 선택"
    label={accounts.find((a) => a.id === newAccountId)?.name}
  />
</SelectTrigger>
```

- [ ] **Step 2: 카테고리 수정 행의 계좌 Select에 label 전달**

```tsx
// 기존 (line 93)
<SelectTrigger className="w-40"><SelectValue /></SelectTrigger>

// 수정
<SelectTrigger className="w-40">
  <SelectValue
    placeholder="계좌 선택"
    label={accounts.find((a) => a.id === editingAccountId)?.name}
  />
</SelectTrigger>
```

- [ ] **Step 3: 커밋**

```bash
git add components/settings/category-settings.tsx
git commit -m "fix: 카테고리 설정 Select에서 레이블 표시되도록 수정"
```

### Task 5: 예산 설정 입력 필드 천단위 포맷팅

예산 금액 입력 시 `type="number"` 대신 `type="text"`로 변경하고, 입력값에 천단위 쉼표를 자동 적용한다.

**Files:**
- Modify: `components/settings/budget-settings.tsx:79-86`

- [ ] **Step 1: 포맷팅 헬퍼 함수 추가**

`budget-settings.tsx` 상단(컴포넌트 밖)에 추가:

```tsx
function formatNumber(value: string): string {
  const num = value.replace(/[^0-9]/g, '')
  if (!num) return ''
  return parseInt(num, 10).toLocaleString()
}

function parseNumber(formatted: string): string {
  return formatted.replace(/,/g, '')
}
```

- [ ] **Step 2: amounts 상태 초기값을 포맷팅된 값으로 변경**

```tsx
// 기존
const [amounts, setAmounts] = useState<Record<string, string>>(() => {
  const init: Record<string, string> = {}
  budgets.forEach((b) => { init[b.categoryId] = String(b.amount) })
  return init
})

// 수정
const [amounts, setAmounts] = useState<Record<string, string>>(() => {
  const init: Record<string, string> = {}
  budgets.forEach((b) => { init[b.categoryId] = b.amount.toLocaleString() })
  return init
})
```

- [ ] **Step 3: handleSave에서 파싱 로직 수정**

```tsx
// 기존
const amount = parseInt(amounts[categoryId] ?? '0', 10)

// 수정
const amount = parseInt(parseNumber(amounts[categoryId] ?? '0'), 10)
```

- [ ] **Step 4: Input을 type="text"로 변경하고 onChange에 포맷팅 적용**

```tsx
// 기존
<Input
  type="number"
  placeholder="0"
  value={amounts[category.id] ?? ''}
  onChange={(e) => setAmounts((prev) => ({ ...prev, [category.id]: e.target.value }))}
  className="flex-1"
  min="0"
/>

// 수정
<Input
  type="text"
  inputMode="numeric"
  placeholder="0"
  value={amounts[category.id] ?? ''}
  onChange={(e) => setAmounts((prev) => ({
    ...prev,
    [category.id]: formatNumber(e.target.value),
  }))}
  className="flex-1"
/>
```

- [ ] **Step 5: 커밋**

```bash
git add components/settings/budget-settings.tsx
git commit -m "feat: 예산 설정 입력 필드에 천단위 쉼표 포맷팅 적용"
```

---

## Chunk 2: 예산 저장 상태 표시

### Task 6: 예산 저장 상태 시각적 피드백 추가

각 카테고리 행에서 원본 값과 현재 입력값을 비교하여 dirty/saved 상태를 표시한다.

**Files:**
- Modify: `components/settings/budget-settings.tsx`

- [ ] **Step 1: savedState 상태 추가**

기존 state 선언부 아래에 추가:

```tsx
// 각 카테고리의 저장 상태: 'saved' | 'dirty' | 'idle'
const [savedState, setSavedState] = useState<Record<string, 'saved' | 'dirty' | 'idle'>>({})

// 원본 값 (서버에서 받은 값) 저장
const [originalAmounts] = useState<Record<string, string>>(() => {
  const init: Record<string, string> = {}
  budgets.forEach((b) => { init[b.categoryId] = b.amount.toLocaleString() })
  return init
})
```

- [ ] **Step 2: Input onChange에 dirty 상태 반영**

Input의 onChange를 수정:

```tsx
onChange={(e) => {
  const formatted = formatNumber(e.target.value)
  setAmounts((prev) => ({ ...prev, [category.id]: formatted }))
  setSavedState((prev) => ({
    ...prev,
    [category.id]: formatted === (originalAmounts[category.id] || '') ? 'idle' : 'dirty',
  }))
}}
```

- [ ] **Step 3: handleSave에서 저장 완료 시 saved 상태로 변경**

```tsx
// 기존
toast.success('예산이 저장됐습니다')

// 수정
toast.success('예산이 저장됐습니다')
setSavedState((prev) => ({ ...prev, [categoryId]: 'saved' }))
```

- [ ] **Step 4: Lucide Check 아이콘 import 추가**

```tsx
import { Check } from 'lucide-react'
```

- [ ] **Step 5: 저장 버튼을 상태에 따라 다르게 표시**

기존 버튼:
```tsx
<Button size="sm" onClick={() => handleSave(category.id, category.name)} disabled={isPending}>
  저장
</Button>
```

수정:
```tsx
{(() => {
  const state = savedState[category.id] ?? 'idle'
  if (state === 'saved') {
    return (
      <Button size="sm" variant="outline" disabled className="text-green-600 border-green-600">
        <Check className="h-4 w-4 mr-1" />저장됨
      </Button>
    )
  }
  return (
    <Button
      size="sm"
      variant={state === 'dirty' ? 'default' : 'outline'}
      onClick={() => handleSave(category.id, category.name)}
      disabled={isPending || state === 'idle'}
    >
      저장
    </Button>
  )
})()}
```

동작:
- `idle` (초기 상태 / 변경 없음): outline 스타일, disabled
- `dirty` (값 변경됨): default(primary) 스타일, 활성화 — 저장 필요함을 강조
- `saved` (저장 완료): 초록색 "저장됨" + 체크마크, disabled

- [ ] **Step 6: 전월 복사 후 dirty 상태 설정**

`handleCopyFromPrevious` 성공 시, 복사된 값들을 dirty로 표시:

```tsx
// toast.success 이후에 추가
// 페이지를 revalidate하므로 컴포넌트가 새로 마운트됨 — 별도 처리 불필요
```

참고: `copyBudgetFromPreviousMonth`은 서버에서 직접 저장하고 `revalidatePath`를 호출하므로, 컴포넌트가 새로 마운트되어 자동으로 idle 상태가 된다.

- [ ] **Step 7: 커밋**

```bash
git add components/settings/budget-settings.tsx
git commit -m "feat: 예산 설정에 저장 상태 시각적 피드백 추가"
```

---

## Chunk 3: 지출 내역 필터 기능

### Task 7: ExpenseList에 계좌/카테고리 필터 추가

클라이언트 사이드에서 계좌별, 카테고리별 필터링 기능을 추가한다. 데이터는 이미 전부 로드되어 있으므로 서버 액션 수정은 불필요하다.

**Files:**
- Modify: `components/expense-list.tsx`

- [ ] **Step 1: 필터 state 추가**

기존 state 선언부에 추가:

```tsx
const [filterAccountId, setFilterAccountId] = useState('')
const [filterCategoryId, setFilterCategoryId] = useState('')
```

- [ ] **Step 2: 필터링 로직 추가**

state 선언 아래에 필터링된 데이터 계산:

```tsx
const filteredExpenses = expenses.filter((e) => {
  if (filterAccountId && e.accountId !== filterAccountId) return false
  if (filterCategoryId && e.categoryId !== filterCategoryId) return false
  return true
})

const filteredTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
```

- [ ] **Step 3: 테이블 위에 필터 UI 추가**

`return` 문의 `<>` 바로 아래, `<Table>` 위에 추가:

```tsx
<div className="flex items-center gap-3 mb-4">
  <div className="flex items-center gap-2">
    <span className="text-sm text-muted-foreground">계좌</span>
    <Select value={filterAccountId} onValueChange={(v) => { setFilterAccountId(v ?? ''); setFilterCategoryId('') }}>
      <SelectTrigger className="w-32">
        <SelectValue placeholder="전체" label={filterAccountId ? accounts.find((a) => a.id === filterAccountId)?.name : undefined} />
      </SelectTrigger>
      <SelectContent>
        {accounts.map((a) => (
          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
    {filterAccountId && (
      <Button variant="ghost" size="sm" onClick={() => { setFilterAccountId(''); setFilterCategoryId('') }}>
        초기화
      </Button>
    )}
  </div>
  <div className="flex items-center gap-2">
    <span className="text-sm text-muted-foreground">카테고리</span>
    <Select value={filterCategoryId} onValueChange={(v) => setFilterCategoryId(v ?? '')}>
      <SelectTrigger className="w-32">
        <SelectValue placeholder="전체" label={filterCategoryId ? categories.find((c) => c.id === filterCategoryId)?.name : undefined} />
      </SelectTrigger>
      <SelectContent>
        {(filterAccountId ? categories.filter((c) => c.accountId === filterAccountId) : categories).map((c) => (
          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
    {filterCategoryId && (
      <Button variant="ghost" size="sm" onClick={() => setFilterCategoryId('')}>
        초기화
      </Button>
    )}
  </div>
</div>
```

- [ ] **Step 4: 테이블에서 expenses → filteredExpenses로 변경**

테이블 렌더링에서 `expenses`를 `filteredExpenses`로 교체:

```tsx
// 기존
{expenses.length === 0 ? (
// 수정
{filteredExpenses.length === 0 ? (
```

```tsx
// 기존 (빈 상태 메시지도 필터 상태에 맞게)
<TableCell colSpan={6} className="text-center text-muted-foreground py-8">
  지출 기록이 없습니다
</TableCell>

// 수정
<TableCell colSpan={6} className="text-center text-muted-foreground py-8">
  {(filterAccountId || filterCategoryId) ? '필터 조건에 맞는 기록이 없습니다' : '지출 기록이 없습니다'}
</TableCell>
```

```tsx
// 기존
expenses.map((expense) => {
// 수정
filteredExpenses.map((expense) => {
```

- [ ] **Step 5: history/page.tsx에서 필터 적용된 합계 표시**

합계 표시를 ExpenseList 내부로 이동하여 필터 반영. `history/page.tsx`에서 합계 부분을 제거하고, `ExpenseList`에서 표시한다.

**Modify: `app/history/page.tsx`**

```tsx
// 기존 (line 30-32)
<div className="text-sm text-muted-foreground">
  총 {expenses.length}건 · {total.toLocaleString()}원
</div>

// 삭제 (ExpenseList 내부로 이동)
```

`total` 변수 계산도 삭제 (line 22).

**Modify: `components/expense-list.tsx`**

필터 UI 아래, 테이블 위에 합계 표시 추가:

```tsx
<div className="text-sm text-muted-foreground mb-4">
  {(filterAccountId || filterCategoryId)
    ? `필터 결과: ${filteredExpenses.length}건 · ${filteredTotal.toLocaleString()}원 (전체 ${expenses.length}건 · ${expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}원)`
    : `총 ${filteredExpenses.length}건 · ${filteredTotal.toLocaleString()}원`
  }
</div>
```

- [ ] **Step 6: 커밋**

```bash
git add components/expense-list.tsx app/history/page.tsx
git commit -m "feat: 지출 내역에 계좌별/카테고리별 필터 기능 추가"
```

---

## 검증

### Task 8: 전체 빌드 검증

- [ ] **Step 1: 빌드 확인**

```bash
npm run build
```

에러 없이 빌드되어야 한다.

- [ ] **Step 2: lint 확인**

```bash
npm run lint
```

- [ ] **Step 3: 수동 검증 항목**

개발 서버(`npm run dev`)에서 확인:
1. 지출 입력 폼에서 계좌/카테고리 선택 후 레이블이 표시되는지
2. 지출 수정 다이얼로그에서 계좌/카테고리 레이블이 표시되는지
3. 카테고리 설정에서 계좌 선택 후 레이블이 표시되는지
4. 예산 설정에서 금액 입력 시 천단위 쉼표가 표시되는지
5. 예산 저장 버튼이 idle/dirty/saved 상태에 따라 변하는지
6. 지출 내역에서 계좌/카테고리 필터가 동작하는지
7. 필터 적용 시 건수/합계가 반영되는지
