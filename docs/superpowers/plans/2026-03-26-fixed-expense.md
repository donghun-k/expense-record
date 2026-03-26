# 고정 지출 시스템 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 카테고리 DB에 `고정여부` 속성을 추가하여 고정 지출을 예산 현황에서 분리 표시하는 시스템 구축

**Architecture:** 카테고리 Notion DB에 `고정여부` checkbox 속성 추가 → Category 타입에 `isFixed` 필드 확장 → Server Actions에서 읽기/쓰기 처리 → 예산 현황 UI에서 일반/고정 분리 렌더링 → 지출 입력/수정 폼에서 고정 카테고리 제외

**Tech Stack:** Next.js App Router, Notion API (`@notionhq/client`), TypeScript, shadcn/ui, Tailwind CSS v4

**Spec:** `docs/superpowers/specs/2026-03-26-fixed-expense-design.md`

---

## Chunk 1: 데이터 모델 및 Server Actions

### Task 1: Category 타입에 isFixed 필드 추가

**Files:**
- Modify: `lib/types.ts:6-10`

- [ ] **Step 1: Category 인터페이스에 isFixed 추가**

`lib/types.ts`의 `Category` 인터페이스를 수정:

```typescript
export interface Category {
  id: string
  name: string
  accountId: string
  isFixed: boolean
}
```

- [ ] **Step 2: BudgetStatus 인터페이스에 isFixed 추가**

`lib/types.ts`의 `BudgetStatus` 인터페이스를 수정:

```typescript
export interface BudgetStatus {
  categoryId: string
  categoryName: string
  accountId: string
  accountName: string
  budget: number
  spent: number
  remaining: number
  isOver: boolean
  isFixed: boolean
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 타입 오류 발생 (아직 isFixed를 할당하는 코드가 없으므로). 이 오류들은 이후 태스크에서 해결.

- [ ] **Step 4: 커밋**

```bash
git add lib/types.ts
git commit -m "feat: Category, BudgetStatus 타입에 isFixed 필드 추가"
```

---

### Task 2: getCategories에서 고정여부 속성 읽기

**Files:**
- Modify: `lib/actions/category.ts:18-22`

**전제조건:** Notion 카테고리 DB에 `고정여부`(checkbox) 속성이 이미 추가되어 있어야 함.

- [ ] **Step 1: getCategories 반환값에 isFixed 매핑 추가**

`lib/actions/category.ts`의 `getCategories` 함수에서 반환 매핑 수정:

```typescript
return response.results.map((page: any) => ({
  id: page.id,
  name: page.properties['카테고리명'].title[0]?.plain_text ?? '',
  accountId: page.properties['계좌'].relation[0]?.id ?? '',
  isFixed: page.properties['고정여부']?.checkbox ?? false,
}))
```

- [ ] **Step 2: 커밋**

```bash
git add lib/actions/category.ts
git commit -m "feat: getCategories에서 고정여부 속성 읽기"
```

---

### Task 3: createCategory에 isFixed 파라미터 추가

**Files:**
- Modify: `lib/actions/category.ts:25-37`

- [ ] **Step 1: createCategory 함수 시그니처 및 로직 수정**

```typescript
export async function createCategory(name: string, accountId: string, isFixed: boolean = false): Promise<void> {
  if (!name.trim()) throw new Error('카테고리명을 입력해주세요')
  if (!accountId) throw new Error('계좌를 선택해주세요')

  await notion.pages.create({
    parent: { database_id: DB.CATEGORY },
    properties: {
      '카테고리명': { title: [{ text: { content: name.trim() } }] },
      '계좌': { relation: [{ id: accountId }] },
      '고정여부': { checkbox: isFixed },
    },
  })
  revalidatePath('/settings')
  revalidatePath('/')
}
```

- [ ] **Step 2: 커밋**

```bash
git add lib/actions/category.ts
git commit -m "feat: createCategory에 isFixed 파라미터 및 revalidatePath('/') 추가"
```

---

### Task 4: updateCategory에 isFixed 파라미터 추가

**Files:**
- Modify: `lib/actions/category.ts:39-49`

- [ ] **Step 1: updateCategory 함수 시그니처 및 로직 수정**

```typescript
export async function updateCategory(id: string, name: string, accountId: string, isFixed: boolean = false): Promise<void> {
  if (!name.trim()) throw new Error('카테고리명을 입력해주세요')

  await notion.pages.update({
    page_id: id,
    properties: {
      '카테고리명': { title: [{ text: { content: name.trim() } }] },
      '계좌': { relation: [{ id: accountId }] },
      '고정여부': { checkbox: isFixed },
    },
  })
  revalidatePath('/settings')
  revalidatePath('/')
}
```

- [ ] **Step 2: 커밋**

```bash
git add lib/actions/category.ts
git commit -m "feat: updateCategory에 isFixed 파라미터 및 revalidatePath('/') 추가"
```

---

## Chunk 2: 홈페이지 예산 현황 로직 및 UI

### Task 5: 홈페이지에서 고정 지출 BudgetStatus 분기 처리

**Files:**
- Modify: `app/page.tsx:25-40`

- [ ] **Step 1: budgetStatuses 생성 로직에 isFixed 분기 추가**

`app/page.tsx`의 budgetStatuses 매핑을 수정. 고정 카테고리는 `spent = budget`, `remaining = 0`, `isOver = false`로 설정:

```typescript
const budgetStatuses: BudgetStatus[] = budgets
  .map((b) => {
    const category = categories.find((c) => c.id === b.categoryId)
    if (!category) return null
    const account = accounts.find((a) => a.id === category.accountId)
    if (!account) return null

    if (category.isFixed) {
      return {
        categoryId: b.categoryId,
        categoryName: category.name,
        accountId: account.id,
        accountName: account.name,
        budget: b.amount,
        spent: b.amount,
        remaining: 0,
        isOver: false,
        isFixed: true,
      }
    }

    const spent = spentByCategory[b.categoryId] ?? 0
    return {
      categoryId: b.categoryId,
      categoryName: category.name,
      accountId: account.id,
      accountName: account.name,
      ...calculateBudgetStatus(b.amount, spent),
      isFixed: false,
    }
  })
  .filter((s): s is BudgetStatus => s !== null)
```

- [ ] **Step 2: ExpenseForm에 전달하는 categories에서 고정 카테고리 제외**

같은 파일의 JSX 부분에서 ExpenseForm에 전달하는 categories를 필터링:

```tsx
<ExpenseForm accounts={accounts} categories={categories.filter((c) => !c.isFixed)} />
```

- [ ] **Step 3: 커밋**

```bash
git add app/page.tsx
git commit -m "feat: 홈페이지 BudgetStatus에 고정 지출 분기 처리 및 폼 필터링"
```

---

### Task 6: BudgetStatusCard에서 일반/고정 분리 렌더링

**Files:**
- Modify: `components/budget-status.tsx` (전체 리팩토링)

- [ ] **Step 1: 일반/고정 분리 및 고정 지출 섹션 렌더링 추가**

`components/budget-status.tsx`를 다음과 같이 수정:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { BudgetStatus } from '@/lib/types'

function groupByAccount(statuses: BudgetStatus[]) {
  const grouped = statuses.reduce<Record<string, { accountName: string; items: BudgetStatus[] }>>(
    (acc, s) => {
      if (!acc[s.accountId]) {
        acc[s.accountId] = { accountName: s.accountName, items: [] }
      }
      acc[s.accountId].items.push(s)
      return acc
    },
    {}
  )
  return Object.values(grouped).map((group) => ({
    ...group,
    items: [...group.items].sort((a, b) => b.budget - a.budget),
  }))
}

export function BudgetStatusCard({ statuses }: { statuses: BudgetStatus[] }) {
  if (statuses.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>이번 달 예산 현황</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">설정에서 예산을 추가해주세요.</p>
        </CardContent>
      </Card>
    )
  }

  const normalStatuses = statuses.filter((s) => !s.isFixed)
  const fixedStatuses = statuses.filter((s) => s.isFixed)
  const normalGroups = groupByAccount(normalStatuses)
  const fixedGroups = groupByAccount(fixedStatuses)
  const fixedTotal = fixedStatuses.reduce((sum, s) => sum + s.budget, 0)

  return (
    <Card>
      <CardHeader><CardTitle>이번 달 예산 현황</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {/* 일반 지출 섹션 */}
        {normalGroups.map((group, groupIdx) => (
          <div key={group.items[0].accountId}>
            {groupIdx > 0 && <Separator className="mb-4" />}
            <p className="text-xs font-semibold text-muted-foreground mb-2">{group.accountName}</p>
            <div className="space-y-3">
              {group.items.map((s) => (
                <div key={s.categoryId} className="flex items-center justify-between">
                  <span className="font-medium">{s.categoryName}</span>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">예산 {s.budget.toLocaleString()}원</span>
                    <span className="text-muted-foreground">사용 {s.spent.toLocaleString()}원</span>
                    <Badge variant={s.isOver ? 'destructive' : 'secondary'}>
                      {s.remaining > 0 ? '+' : ''}{s.remaining.toLocaleString()}원
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* 고정 지출 섹션 */}
        {fixedStatuses.length > 0 && (
          <>
            {normalStatuses.length > 0 && <Separator />}
            {fixedGroups.map((group, groupIdx) => (
              <div key={group.items[0].accountId}>
                {groupIdx > 0 && <Separator className="mb-4" />}
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-semibold text-muted-foreground">{group.accountName}</p>
                  <Badge variant="outline" className="text-xs">고정 지출</Badge>
                </div>
                <div className="space-y-3">
                  {group.items.map((s) => (
                    <div key={s.categoryId} className="flex items-center justify-between">
                      <span className="font-medium">{s.categoryName}</span>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{s.budget.toLocaleString()}원</span>
                        <Badge variant="outline">고정</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Separator className="border-dashed" />
            <div className="flex items-center justify-between">
              <span className="font-semibold text-muted-foreground">고정 지출 합계</span>
              <span className="font-semibold">{fixedTotal.toLocaleString()}원</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: 개발 서버에서 확인**

Run: `npm run dev`
확인: 홈페이지에서 예산 현황이 일반/고정으로 분리 표시되는지 확인. (Notion DB에 고정여부 체크박스가 설정된 카테고리가 있어야 확인 가능)

- [ ] **Step 3: 커밋**

```bash
git add components/budget-status.tsx
git commit -m "feat: 예산 현황에서 일반/고정 지출 분리 렌더링"
```

---

## Chunk 3: 설정 및 지출 목록 UI

### Task 7: Checkbox 컴포넌트 설치 및 카테고리 설정에 고정 지출 체크박스 추가

**Files:**
- Modify: `components/settings/category-settings.tsx`

- [ ] **Step 0: Checkbox 컴포넌트 설치**

Run: `npx shadcn@latest add checkbox`
Expected: `components/ui/checkbox.tsx` 파일 생성

- [ ] **Step 1: 상태 및 생성 폼에 isFixed 추가**

`category-settings.tsx`에 다음 변경 적용:

1. 상태 추가:
```typescript
const [newIsFixed, setNewIsFixed] = useState(false)
const [editingIsFixed, setEditingIsFixed] = useState(false)
```

2. `handleCreate`에서 `createCategory` 호출 수정:
```typescript
await createCategory(newName, newAccountId, newIsFixed)
setNewName('')
setNewAccountId('')
setNewIsFixed(false)
```

3. `handleUpdate`에서 `updateCategory` 호출 수정:
```typescript
await updateCategory(id, editingName, editingAccountId, editingIsFixed)
```

4. 수정 버튼 클릭 시 `editingIsFixed` 초기화:
```typescript
onClick={() => { setEditingId(category.id); setEditingName(category.name); setEditingAccountId(category.accountId); setEditingIsFixed(category.isFixed) }}
```

- [ ] **Step 2: 생성 폼 UI에 체크박스 추가**

import에 `Checkbox`와 `Label` 추가:
```typescript
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
```

생성 폼의 `<div className="flex gap-2">` 안에 체크박스 추가 (Button 앞에):
```tsx
<div className="flex items-center gap-1.5">
  <Checkbox id="newIsFixed" checked={newIsFixed} onCheckedChange={(v) => setNewIsFixed(v === true)} />
  <Label htmlFor="newIsFixed" className="text-sm whitespace-nowrap">고정</Label>
</div>
```

- [ ] **Step 3: 수정 모드 UI에 체크박스 추가**

수정 모드(`editingId === category.id` 분기) 안에서 저장 Button 앞에 체크박스 추가:
```tsx
<div className="flex items-center gap-1.5">
  <Checkbox id="editIsFixed" checked={editingIsFixed} onCheckedChange={(v) => setEditingIsFixed(v === true)} />
  <Label htmlFor="editIsFixed" className="text-sm whitespace-nowrap">고정</Label>
</div>
```

- [ ] **Step 4: 목록에서 고정 카테고리에 뱃지 표시**

import에 `Badge` 추가:
```typescript
import { Badge } from '@/components/ui/badge'
```

카테고리 목록의 읽기 모드(else 분기)에서 카테고리명 옆에 뱃지 추가:
```tsx
<span className="flex-1">
  {category.name}
  {category.isFixed && <Badge variant="outline" className="ml-2 text-xs">고정</Badge>}
</span>
```

- [ ] **Step 5: 커밋**

```bash
git add components/settings/category-settings.tsx
git commit -m "feat: 카테고리 설정에 고정 지출 체크박스 및 뱃지 추가"
```

---

### Task 8: 지출 수정 다이얼로그에서 고정 카테고리 필터링

**Files:**
- Modify: `components/expense-list.tsx:85,122,235`

- [ ] **Step 1: 수정 다이얼로그의 filteredCategories에서 고정 카테고리 제외**

`expense-list.tsx` 85번 줄의 `filteredCategories` 수정:

```typescript
const filteredCategories = categories.filter((c) => c.accountId === editAccountId && !c.isFixed)
```

- [ ] **Step 2: 커밋**

```bash
git add components/expense-list.tsx
git commit -m "feat: 지출 목록에서 고정 카테고리 필터링"
```

---

### Task 9: 빌드 확인 및 최종 검증

- [ ] **Step 1: 린트 실행**

Run: `npm run lint`
Expected: 오류 없음

- [ ] **Step 2: 프로덕션 빌드**

Run: `npm run build`
Expected: 빌드 성공

- [ ] **Step 3: 개발 서버에서 전체 기능 확인**

Run: `npm run dev`

확인 항목:
1. `/settings` — 카테고리 생성 시 "고정" 체크박스가 보이는지
2. `/settings` — 고정 카테고리에 "고정" 뱃지가 표시되는지
3. `/` — 지출 입력 폼에서 고정 카테고리가 제외되는지
4. `/` — 예산 현황에서 일반/고정이 분리 표시되는지
5. `/history` — 지출 수정 시 카테고리 드롭다운에서 고정 카테고리가 제외되는지
