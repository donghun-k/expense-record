# Expense Record Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Notion을 DB로 활용한 개인 지출 기록 Next.js 웹 앱 구현

**Architecture:** Next.js App Router + Server Actions로 Notion API를 서버에서만 호출. 클라이언트는 React Server Components로 초기 데이터를 받고, 상태 변경은 Server Actions + `revalidatePath`로 처리한다.

**Tech Stack:** Next.js (latest stable), TypeScript, Tailwind CSS, shadcn/ui, @notionhq/client, date-fns, Jest (유닛 테스트)

---

## 파일 구조

| 파일 | 역할 |
|------|------|
| `app/layout.tsx` | 루트 레이아웃, Sonner Toaster, Nav 포함 |
| `app/page.tsx` | 메인 페이지 (지출 입력 + 예산 현황) |
| `app/history/page.tsx` | 지출 내역 조회/수정/삭제 |
| `app/settings/page.tsx` | 계좌/카테고리/예산 설정 |
| `lib/notion.ts` | Notion 클라이언트 초기화 + DB ID 상수 |
| `lib/types.ts` | TypeScript 타입 정의 |
| `lib/utils/budget.ts` | 예산 계산 순수 함수 (테스트 대상) |
| `lib/actions/account.ts` | 계좌 CRUD Server Actions |
| `lib/actions/category.ts` | 카테고리 CRUD Server Actions |
| `lib/actions/budget.ts` | 예산 CRUD Server Actions |
| `lib/actions/expense.ts` | 지출 CRUD Server Actions |
| `components/nav.tsx` | 공통 네비게이션 (Client Component) |
| `components/expense-form.tsx` | 지출 입력 폼 (Client Component) |
| `components/budget-status.tsx` | 예산 현황 카드 (Server Component) |
| `components/expense-list.tsx` | 지출 내역 테이블 (Client Component) |
| `components/month-selector.tsx` | 월 이동 컴포넌트 (Client Component) |
| `components/settings/account-settings.tsx` | 계좌 관리 UI |
| `components/settings/category-settings.tsx` | 카테고리 관리 UI |
| `components/settings/budget-settings.tsx` | 예산 관리 UI |
| `__tests__/utils/budget.test.ts` | 예산 계산 로직 유닛 테스트 |

---

## Chunk 1: 프로젝트 초기화

### Task 1: Next.js 프로젝트 생성

**Files:**
- Create: `package.json` (자동 생성)
- Create: `.env.local`
- Create: `.env.example`
- Create: `jest.config.ts`

- [ ] **Step 1: Next.js 앱 생성**

```bash
cd /Users/dormon/Desktop/workspace/expense-record
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --yes
```

Expected: Next.js 프로젝트 파일들이 현재 디렉토리에 생성됨

- [ ] **Step 2: 추가 패키지 설치**

```bash
npm install @notionhq/client date-fns
npm install --save-dev jest @types/jest ts-jest
```

- [ ] **Step 3: shadcn/ui 초기화**

```bash
npx shadcn@latest init --defaults
```

- [ ] **Step 4: 필요한 shadcn/ui 컴포넌트 설치**

```bash
npx shadcn@latest add button card form input label select table dialog sonner calendar popover badge separator tabs
```

- [ ] **Step 5: Jest 설정 파일 생성**

`jest.config.ts`:
```typescript
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

export default config
```

`package.json`의 `scripts`에 추가:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 6: 환경변수 파일 생성**

`.env.local`:
```
NOTION_API_KEY=your_notion_api_key_here
NOTION_EXPENSE_DB_ID=your_expense_db_id
NOTION_ACCOUNT_DB_ID=your_account_db_id
NOTION_CATEGORY_DB_ID=your_category_db_id
NOTION_BUDGET_DB_ID=your_budget_db_id
```

`.env.example` (값은 비워둠):
```
NOTION_API_KEY=
NOTION_EXPENSE_DB_ID=
NOTION_ACCOUNT_DB_ID=
NOTION_CATEGORY_DB_ID=
NOTION_BUDGET_DB_ID=
```

- [ ] **Step 7: `.gitignore`에 `.env.local` 포함 확인**

create-next-app이 자동 추가하므로 확인만 함:
```bash
grep ".env.local" .gitignore
```

Expected: `.env.local` 출력됨

- [ ] **Step 8: 커밋**

```bash
git add package.json tsconfig.json next.config.ts tailwind.config.ts \
  next-env.d.ts postcss.config.mjs eslint.config.mjs jest.config.ts \
  .env.example .gitignore
git commit -m "chore: Next.js 프로젝트 초기화 및 의존성 설치"
```

---

### Task 2: Notion 클라이언트 및 타입 정의

**Files:**
- Create: `lib/notion.ts`
- Create: `lib/types.ts`

- [ ] **Step 1: 타입 정의 작성**

`lib/types.ts`:
```typescript
export interface Account {
  id: string
  name: string
}

export interface Category {
  id: string
  name: string
  accountId: string
}

export interface Budget {
  id: string
  yearMonth: string // "YYYY-MM"
  amount: number
  categoryId: string
}

export interface Expense {
  id: string
  title: string
  amount: number
  date: string // "YYYY-MM-DD"
  accountId: string
  accountName: string
  categoryId: string
  categoryName: string
}

export interface BudgetStatus {
  categoryId: string
  categoryName: string
  budget: number
  spent: number
  remaining: number
  isOver: boolean
}
```

- [ ] **Step 2: Notion 클라이언트 초기화**

`lib/notion.ts`:
```typescript
import { Client } from '@notionhq/client'

export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

export const DB = {
  EXPENSE: process.env.NOTION_EXPENSE_DB_ID!,
  ACCOUNT: process.env.NOTION_ACCOUNT_DB_ID!,
  CATEGORY: process.env.NOTION_CATEGORY_DB_ID!,
  BUDGET: process.env.NOTION_BUDGET_DB_ID!,
}
```

- [ ] **Step 3: 커밋**

```bash
git add lib/notion.ts lib/types.ts .env.example jest.config.ts
git commit -m "feat: Notion 클라이언트 초기화 및 타입 정의"
```

---

## Chunk 2: 계좌/카테고리 Server Actions + 설정 UI

### Task 3: 예산 계산 유틸 (TDD)

**Files:**
- Create: `lib/utils/budget.ts`
- Create: `__tests__/utils/budget.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/utils/budget.test.ts`:
```typescript
import { calculateBudgetStatus, groupExpensesByCategory } from '@/lib/utils/budget'

describe('calculateBudgetStatus', () => {
  it('잔여금액 = 예산 - 지출', () => {
    const result = calculateBudgetStatus(500000, 30000)
    expect(result.remaining).toBe(470000)
    expect(result.isOver).toBe(false)
  })

  it('초과 지출 시 음수 반환 및 isOver=true', () => {
    const result = calculateBudgetStatus(100000, 150000)
    expect(result.remaining).toBe(-50000)
    expect(result.isOver).toBe(true)
  })

  it('예산과 지출이 같으면 remaining=0, isOver=false', () => {
    const result = calculateBudgetStatus(100000, 100000)
    expect(result.remaining).toBe(0)
    expect(result.isOver).toBe(false)
  })
})

describe('groupExpensesByCategory', () => {
  it('카테고리별 지출 합계 계산', () => {
    const expenses = [
      { categoryId: 'cat1', amount: 10000 },
      { categoryId: 'cat1', amount: 20000 },
      { categoryId: 'cat2', amount: 15000 },
    ]
    const result = groupExpensesByCategory(expenses)
    expect(result['cat1']).toBe(30000)
    expect(result['cat2']).toBe(15000)
  })

  it('지출이 없으면 빈 객체 반환', () => {
    const result = groupExpensesByCategory([])
    expect(Object.keys(result).length).toBe(0)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest __tests__/utils/budget.test.ts
```

Expected: FAIL (함수 없음)

- [ ] **Step 3: 최소 구현 작성**

`lib/utils/budget.ts`:
```typescript
export function calculateBudgetStatus(budget: number, spent: number) {
  const remaining = budget - spent
  return {
    budget,
    spent,
    remaining,
    isOver: remaining < 0,
  }
}

export function groupExpensesByCategory(
  expenses: { categoryId: string; amount: number }[]
): Record<string, number> {
  return expenses.reduce((acc, expense) => {
    acc[expense.categoryId] = (acc[expense.categoryId] ?? 0) + expense.amount
    return acc
  }, {} as Record<string, number>)
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest __tests__/utils/budget.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 5: 커밋**

```bash
git add lib/utils/budget.ts __tests__/utils/budget.test.ts
git commit -m "feat: 예산 계산 유틸 함수 추가 (TDD)"
```

---

### Task 4: 계좌 Server Actions

**Files:**
- Create: `lib/actions/account.ts`

- [ ] **Step 1: 계좌 Server Actions 작성**

`lib/actions/account.ts`:
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { notion, DB } from '@/lib/notion'
import type { Account } from '@/lib/types'

export async function getAccounts(): Promise<Account[]> {
  const response = await notion.databases.query({
    database_id: DB.ACCOUNT,
    sorts: [{ property: '계좌명', direction: 'ascending' }],
  })

  return response.results.map((page: any) => ({
    id: page.id,
    name: page.properties['계좌명'].title[0]?.plain_text ?? '',
  }))
}

export async function createAccount(name: string): Promise<void> {
  if (!name.trim()) throw new Error('계좌명을 입력해주세요')

  await notion.pages.create({
    parent: { database_id: DB.ACCOUNT },
    properties: {
      '계좌명': { title: [{ text: { content: name.trim() } }] },
    },
  })
  revalidatePath('/settings')
}

export async function updateAccount(id: string, name: string): Promise<void> {
  if (!name.trim()) throw new Error('계좌명을 입력해주세요')

  await notion.pages.update({
    page_id: id,
    properties: {
      '계좌명': { title: [{ text: { content: name.trim() } }] },
    },
  })
  revalidatePath('/settings')
}

export async function deleteAccount(id: string): Promise<{ success: boolean; message?: string }> {
  // 참조 카테고리 확인
  const categories = await notion.databases.query({
    database_id: DB.CATEGORY,
    filter: { property: '계좌', relation: { contains: id } },
  })
  if (categories.results.length > 0) {
    return { success: false, message: '이 계좌를 사용하는 카테고리가 있어 삭제할 수 없습니다.' }
  }

  // 참조 지출기록 확인
  const expenses = await notion.databases.query({
    database_id: DB.EXPENSE,
    filter: { property: '계좌', relation: { contains: id } },
  })
  if (expenses.results.length > 0) {
    return { success: false, message: '이 계좌를 사용하는 지출 기록이 있어 삭제할 수 없습니다.' }
  }

  await notion.pages.update({ page_id: id, in_trash: true })
  revalidatePath('/settings')
  return { success: true }
}
```

- [ ] **Step 2: 커밋**

```bash
git add lib/actions/account.ts
git commit -m "feat: 계좌 CRUD Server Actions 구현"
```

---

### Task 5: 카테고리 Server Actions

**Files:**
- Create: `lib/actions/category.ts`

- [ ] **Step 1: 카테고리 Server Actions 작성**

`lib/actions/category.ts`:
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { notion, DB } from '@/lib/notion'
import type { Category } from '@/lib/types'

export async function getCategories(accountId?: string): Promise<Category[]> {
  const filter = accountId
    ? { property: '계좌', relation: { contains: accountId } }
    : undefined

  const response = await notion.databases.query({
    database_id: DB.CATEGORY,
    ...(filter ? { filter } : {}),
    sorts: [{ property: '카테고리명', direction: 'ascending' }],
  })

  return response.results.map((page: any) => ({
    id: page.id,
    name: page.properties['카테고리명'].title[0]?.plain_text ?? '',
    accountId: page.properties['계좌'].relation[0]?.id ?? '',
  }))
}

export async function createCategory(name: string, accountId: string): Promise<void> {
  if (!name.trim()) throw new Error('카테고리명을 입력해주세요')
  if (!accountId) throw new Error('계좌를 선택해주세요')

  await notion.pages.create({
    parent: { database_id: DB.CATEGORY },
    properties: {
      '카테고리명': { title: [{ text: { content: name.trim() } }] },
      '계좌': { relation: [{ id: accountId }] },
    },
  })
  revalidatePath('/settings')
}

export async function updateCategory(id: string, name: string, accountId: string): Promise<void> {
  if (!name.trim()) throw new Error('카테고리명을 입력해주세요')

  await notion.pages.update({
    page_id: id,
    properties: {
      '카테고리명': { title: [{ text: { content: name.trim() } }] },
      '계좌': { relation: [{ id: accountId }] },
    },
  })
  revalidatePath('/settings')
}

export async function deleteCategory(id: string): Promise<{ success: boolean; message?: string }> {
  // 참조 지출기록 확인
  const expenses = await notion.databases.query({
    database_id: DB.EXPENSE,
    filter: { property: '카테고리', relation: { contains: id } },
  })
  if (expenses.results.length > 0) {
    return { success: false, message: '이 카테고리를 사용하는 지출 기록이 있어 삭제할 수 없습니다.' }
  }

  // 참조 예산 확인
  const budgets = await notion.databases.query({
    database_id: DB.BUDGET,
    filter: { property: '카테고리', relation: { contains: id } },
  })
  if (budgets.results.length > 0) {
    return { success: false, message: '이 카테고리를 사용하는 예산이 있어 삭제할 수 없습니다.' }
  }

  await notion.pages.update({ page_id: id, in_trash: true })
  revalidatePath('/settings')
  return { success: true }
}
```

- [ ] **Step 2: 커밋**

```bash
git add lib/actions/category.ts
git commit -m "feat: 카테고리 CRUD Server Actions 구현"
```

---

### Task 6: 설정 UI (계좌/카테고리)

**Files:**
- Create: `components/nav.tsx`
- Create: `app/layout.tsx`
- Create: `components/settings/account-settings.tsx`
- Create: `components/settings/category-settings.tsx`
- Create: `app/settings/page.tsx`

- [ ] **Step 1: Nav 컴포넌트 작성**

`components/nav.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: '지출 입력' },
  { href: '/history', label: '지출 내역' },
  { href: '/settings', label: '설정' },
]

export function Nav() {
  const pathname = usePathname()
  return (
    <nav className="border-b">
      <div className="container mx-auto flex h-14 items-center gap-6 px-4">
        <span className="font-bold text-lg">지출 기록</span>
        <div className="flex gap-4">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === href ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: 루트 레이아웃 작성**

`app/layout.tsx`:
```tsx
import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '지출 기록',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Nav />
        <main className="container mx-auto px-4 py-6">{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
```

- [ ] **Step 3: 계좌 설정 컴포넌트 작성**

`components/settings/account-settings.tsx`:
```tsx
'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createAccount, updateAccount, deleteAccount } from '@/lib/actions/account'
import type { Account } from '@/lib/types'

export function AccountSettings({ accounts }: { accounts: Account[] }) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleCreate = () => {
    if (!newName.trim()) return
    startTransition(async () => {
      try {
        await createAccount(newName)
        setNewName('')
        toast.success('계좌가 추가됐습니다')
      } catch {
        toast.error('계좌 추가에 실패했습니다')
      }
    })
  }

  const handleUpdate = (id: string) => {
    startTransition(async () => {
      try {
        await updateAccount(id, editingName)
        setEditingId(null)
        toast.success('계좌가 수정됐습니다')
      } catch {
        toast.error('계좌 수정에 실패했습니다')
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        const result = await deleteAccount(id)
        if (result.success) {
          toast.success('계좌가 삭제됐습니다')
        } else {
          toast.error(result.message)
        }
      } catch {
        toast.error('삭제 중 오류가 발생했습니다')
      }
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>계좌 관리</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="계좌명 입력"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={isPending}>추가</Button>
        </div>
        <div className="space-y-2">
          {accounts.map((account) => (
            <div key={account.id} className="flex items-center gap-2">
              {editingId === account.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={() => handleUpdate(account.id)} disabled={isPending}>저장</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>취소</Button>
                </>
              ) : (
                <>
                  <span className="flex-1">{account.name}</span>
                  <Button size="sm" variant="outline" onClick={() => { setEditingId(account.id); setEditingName(account.name) }}>수정</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(account.id)} disabled={isPending}>삭제</Button>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: 카테고리 설정 컴포넌트 작성**

`components/settings/category-settings.tsx`:
```tsx
'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createCategory, updateCategory, deleteCategory } from '@/lib/actions/category'
import type { Account, Category } from '@/lib/types'

export function CategorySettings({ accounts, categories }: { accounts: Account[]; categories: Category[] }) {
  const [newName, setNewName] = useState('')
  const [newAccountId, setNewAccountId] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingAccountId, setEditingAccountId] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleCreate = () => {
    if (!newName.trim() || !newAccountId) return
    startTransition(async () => {
      try {
        await createCategory(newName, newAccountId)
        setNewName('')
        setNewAccountId('')
        toast.success('카테고리가 추가됐습니다')
      } catch {
        toast.error('카테고리 추가에 실패했습니다')
      }
    })
  }

  const handleUpdate = (id: string) => {
    startTransition(async () => {
      try {
        await updateCategory(id, editingName, editingAccountId)
        setEditingId(null)
        toast.success('카테고리가 수정됐습니다')
      } catch {
        toast.error('카테고리 수정에 실패했습니다')
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        const result = await deleteCategory(id)
        if (result.success) {
          toast.success('카테고리가 삭제됐습니다')
        } else {
          toast.error(result.message)
        }
      } catch {
        toast.error('삭제 중 오류가 발생했습니다')
      }
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>카테고리 관리</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="카테고리명"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
          />
          <Select value={newAccountId} onValueChange={setNewAccountId}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="계좌 선택" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleCreate} disabled={isPending || !newName.trim() || !newAccountId}>추가</Button>
        </div>
        <div className="space-y-2">
          {categories.map((category) => {
            const accountName = accounts.find((a) => a.id === category.accountId)?.name ?? ''
            return (
              <div key={category.id} className="flex items-center gap-2">
                {editingId === category.id ? (
                  <>
                    <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="flex-1" />
                    <Select value={editingAccountId} onValueChange={setEditingAccountId}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => handleUpdate(category.id)} disabled={isPending}>저장</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>취소</Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{category.name}</span>
                    <span className="text-sm text-muted-foreground">{accountName}</span>
                    <Button size="sm" variant="outline" onClick={() => { setEditingId(category.id); setEditingName(category.name); setEditingAccountId(category.accountId) }}>수정</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(category.id)} disabled={isPending}>삭제</Button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 5: 설정 페이지 작성 (예산 탭은 임시 placeholder)**

`app/settings/page.tsx`:
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getAccounts } from '@/lib/actions/account'
import { getCategories } from '@/lib/actions/category'
import { AccountSettings } from '@/components/settings/account-settings'
import { CategorySettings } from '@/components/settings/category-settings'

export default async function SettingsPage() {
  const [accounts, categories] = await Promise.all([
    getAccounts(),
    getCategories(),
  ])

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">설정</h1>
      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">계좌</TabsTrigger>
          <TabsTrigger value="categories">카테고리</TabsTrigger>
          <TabsTrigger value="budgets">예산</TabsTrigger>
        </TabsList>
        <TabsContent value="accounts" className="mt-4">
          <AccountSettings accounts={accounts} />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <CategorySettings accounts={accounts} categories={categories} />
        </TabsContent>
        <TabsContent value="budgets" className="mt-4">
          <p className="text-sm text-muted-foreground">다음 단계에서 추가됩니다.</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 6: 개발 서버로 동작 확인**

```bash
npm run dev
```

`http://localhost:3000/settings` 접속 후 확인:
- Nav 표시
- 계좌 탭에서 추가/수정/삭제 동작
- 카테고리 탭에서 계좌 필터 동작

- [ ] **Step 7: 커밋**

```bash
git add components/nav.tsx app/layout.tsx components/settings/account-settings.tsx components/settings/category-settings.tsx app/settings/page.tsx
git commit -m "feat: 계좌/카테고리 설정 UI 구현"
```

---

## Chunk 3: 예산 Server Actions + 예산 설정 UI

### Task 7: 예산 Server Actions

**Files:**
- Create: `lib/actions/budget.ts`

- [ ] **Step 1: 예산 Server Actions 작성**

`lib/actions/budget.ts`:
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'
import { notion, DB } from '@/lib/notion'
import type { Budget } from '@/lib/types'

export async function getBudgetsByMonth(yearMonth: string): Promise<Budget[]> {
  const response = await notion.databases.query({
    database_id: DB.BUDGET,
    filter: {
      property: '연월',
      rich_text: { equals: yearMonth },
    },
  })

  return response.results.map((page: any) => ({
    id: page.id,
    yearMonth: page.properties['연월'].rich_text[0]?.plain_text ?? '',
    amount: page.properties['예산금액'].number ?? 0,
    categoryId: page.properties['카테고리'].relation[0]?.id ?? '',
  }))
}

export async function upsertBudget(
  yearMonth: string,
  categoryId: string,
  amount: number,
  categoryName: string
): Promise<void> {
  if (isNaN(amount) || amount < 0) throw new Error('올바른 예산 금액을 입력해주세요')

  const existing = await notion.databases.query({
    database_id: DB.BUDGET,
    filter: {
      and: [
        { property: '연월', rich_text: { equals: yearMonth } },
        { property: '카테고리', relation: { contains: categoryId } },
      ],
    },
  })

  if (existing.results.length > 0) {
    await notion.pages.update({
      page_id: existing.results[0].id,
      properties: {
        '예산금액': { number: amount },
      },
    })
  } else {
    await notion.pages.create({
      parent: { database_id: DB.BUDGET },
      properties: {
        '이름': { title: [{ text: { content: `${yearMonth} ${categoryName}` } }] },
        '연월': { rich_text: [{ text: { content: yearMonth } }] },
        '예산금액': { number: amount },
        '카테고리': { relation: [{ id: categoryId }] },
      },
    })
  }

  revalidatePath('/settings')
  revalidatePath('/')
}

export async function copyBudgetFromPreviousMonth(
  targetYearMonth: string,
  sourceYearMonth: string
): Promise<boolean> {
  const sourceBudgets = await getBudgetsByMonth(sourceYearMonth)
  if (sourceBudgets.length === 0) return false

  await Promise.all(
    sourceBudgets.map(async (b) => {
      const categoryPage = await notion.pages.retrieve({ page_id: b.categoryId }) as any
      const categoryName = categoryPage.properties['카테고리명'].title[0]?.plain_text ?? ''
      await upsertBudget(targetYearMonth, b.categoryId, b.amount, categoryName)
    })
  )

  return true
}
```

- [ ] **Step 2: 커밋**

```bash
git add lib/actions/budget.ts
git commit -m "feat: 예산 CRUD Server Actions 구현"
```

---

### Task 8: 예산 설정 UI

**Files:**
- Create: `components/settings/budget-settings.tsx`
- Modify: `app/settings/page.tsx`

- [ ] **Step 1: 예산 설정 컴포넌트 작성**

`components/settings/budget-settings.tsx`:
```tsx
'use client'

import { useState, useTransition } from 'react'
import { format, subMonths } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { upsertBudget, copyBudgetFromPreviousMonth } from '@/lib/actions/budget'
import type { Budget, Category } from '@/lib/types'

interface Props {
  categories: Category[]
  currentYearMonth: string
  budgets: Budget[]
  hasPreviousMonthBudget: boolean
}

export function BudgetSettings({ categories, currentYearMonth, budgets, hasPreviousMonthBudget }: Props) {
  const [amounts, setAmounts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    budgets.forEach((b) => { init[b.categoryId] = String(b.amount) })
    return init
  })
  const [isPending, startTransition] = useTransition()

  const handleSave = (categoryId: string, categoryName: string) => {
    const amount = parseInt(amounts[categoryId] ?? '0', 10)
    if (isNaN(amount) || amount < 0) {
      toast.error('올바른 금액을 입력해주세요')
      return
    }
    startTransition(async () => {
      try {
        await upsertBudget(currentYearMonth, categoryId, amount, categoryName)
        toast.success('예산이 저장됐습니다')
      } catch {
        toast.error('예산 저장에 실패했습니다')
      }
    })
  }

  const handleCopyFromPrevious = () => {
    const [year, month] = currentYearMonth.split('-').map(Number)
    const prevYearMonth = format(subMonths(new Date(year, month - 1, 1), 1), 'yyyy-MM')
    startTransition(async () => {
      try {
        const copied = await copyBudgetFromPreviousMonth(currentYearMonth, prevYearMonth)
        if (copied) {
          toast.success('전월 예산을 복사했습니다')
        } else {
          toast.error('전월 예산 데이터가 없습니다')
        }
      } catch {
        toast.error('전월 예산 복사 중 오류가 발생했습니다')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{currentYearMonth} 예산 설정</CardTitle>
          {hasPreviousMonthBudget && (
            <Button variant="outline" size="sm" onClick={handleCopyFromPrevious} disabled={isPending}>
              전월에서 복사
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">카테고리를 먼저 추가해주세요.</p>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="flex items-center gap-3">
              <span className="w-32 text-sm">{category.name}</span>
              <Input
                type="number"
                placeholder="0"
                value={amounts[category.id] ?? ''}
                onChange={(e) => setAmounts((prev) => ({ ...prev, [category.id]: e.target.value }))}
                className="flex-1"
                min="0"
              />
              <Button size="sm" onClick={() => handleSave(category.id, category.name)} disabled={isPending}>
                저장
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: 설정 페이지에 예산 탭 추가**

`app/settings/page.tsx` 전체 교체:
```tsx
import { format, subMonths } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getAccounts } from '@/lib/actions/account'
import { getCategories } from '@/lib/actions/category'
import { getBudgetsByMonth } from '@/lib/actions/budget'
import { AccountSettings } from '@/components/settings/account-settings'
import { CategorySettings } from '@/components/settings/category-settings'
import { BudgetSettings } from '@/components/settings/budget-settings'

export default async function SettingsPage() {
  const currentYearMonth = format(new Date(), 'yyyy-MM')
  const prevYearMonth = format(subMonths(new Date(), 1), 'yyyy-MM')

  const [accounts, categories, budgets, prevBudgets] = await Promise.all([
    getAccounts(),
    getCategories(),
    getBudgetsByMonth(currentYearMonth),
    getBudgetsByMonth(prevYearMonth),
  ])

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">설정</h1>
      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">계좌</TabsTrigger>
          <TabsTrigger value="categories">카테고리</TabsTrigger>
          <TabsTrigger value="budgets">예산</TabsTrigger>
        </TabsList>
        <TabsContent value="accounts" className="mt-4">
          <AccountSettings accounts={accounts} />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <CategorySettings accounts={accounts} categories={categories} />
        </TabsContent>
        <TabsContent value="budgets" className="mt-4">
          <BudgetSettings
            categories={categories}
            currentYearMonth={currentYearMonth}
            budgets={budgets}
            hasPreviousMonthBudget={prevBudgets.length > 0}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 3: 동작 확인**

```bash
npm run dev
```

`http://localhost:3000/settings` → 예산 탭에서 카테고리별 금액 입력 및 저장 확인

- [ ] **Step 4: 커밋**

```bash
git add components/settings/budget-settings.tsx app/settings/page.tsx
git commit -m "feat: 예산 설정 UI 구현"
```

---

## Chunk 4: 메인 페이지 (지출 입력 + 예산 현황)

### Task 9: 지출 Server Actions

**Files:**
- Create: `lib/actions/expense.ts`

- [ ] **Step 1: 지출 Server Actions 작성**

`lib/actions/expense.ts`:
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { format, addMonths } from 'date-fns'
import { notion, DB } from '@/lib/notion'
import type { Expense } from '@/lib/types'

export async function createExpense(data: {
  title: string
  amount: number
  date: string
  accountId: string
  categoryId: string
}): Promise<void> {
  if (!data.title.trim()) throw new Error('사용처를 입력해주세요')
  if (!data.amount || data.amount <= 0) throw new Error('금액을 입력해주세요')
  if (!data.accountId) throw new Error('계좌를 선택해주세요')
  if (!data.categoryId) throw new Error('카테고리를 선택해주세요')

  await notion.pages.create({
    parent: { database_id: DB.EXPENSE },
    properties: {
      '사용처': { title: [{ text: { content: data.title.trim() } }] },
      '금액': { number: data.amount },
      '날짜': { date: { start: data.date } },
      '계좌': { relation: [{ id: data.accountId }] },
      '카테고리': { relation: [{ id: data.categoryId }] },
    },
  })
  revalidatePath('/')
  revalidatePath('/history')
}

export async function getExpensesByMonth(yearMonth: string): Promise<Expense[]> {
  const [year, month] = yearMonth.split('-').map(Number)
  const startDate = `${yearMonth}-01`
  // toISOString() 타임존 버그 방지: date-fns로 직접 포맷
  const endDate = format(addMonths(new Date(year, month - 1, 1), 1), 'yyyy-MM-dd')

  const response = await notion.databases.query({
    database_id: DB.EXPENSE,
    filter: {
      and: [
        { property: '날짜', date: { on_or_after: startDate } },
        { property: '날짜', date: { before: endDate } },
      ],
    },
    sorts: [{ property: '날짜', direction: 'descending' }],
  })

  // 계좌/카테고리명 조회를 위해 accounts, categories를 별도 fetch
  const accountIds = [...new Set(response.results.map((p: any) => p.properties['계좌'].relation[0]?.id).filter(Boolean))]
  const categoryIds = [...new Set(response.results.map((p: any) => p.properties['카테고리'].relation[0]?.id).filter(Boolean))]

  const [accountPages, categoryPages] = await Promise.all([
    Promise.all(accountIds.map((id) => notion.pages.retrieve({ page_id: id as string }) as any)),
    Promise.all(categoryIds.map((id) => notion.pages.retrieve({ page_id: id as string }) as any)),
  ])

  const accountMap = Object.fromEntries(
    accountPages.map((p: any) => [p.id, p.properties['계좌명'].title[0]?.plain_text ?? ''])
  )
  const categoryMap = Object.fromEntries(
    categoryPages.map((p: any) => [p.id, p.properties['카테고리명'].title[0]?.plain_text ?? ''])
  )

  return response.results.map((page: any) => {
    const accountId = page.properties['계좌'].relation[0]?.id ?? ''
    const categoryId = page.properties['카테고리'].relation[0]?.id ?? ''
    return {
      id: page.id,
      title: page.properties['사용처'].title[0]?.plain_text ?? '',
      amount: page.properties['금액'].number ?? 0,
      date: page.properties['날짜'].date?.start ?? '',
      accountId,
      accountName: accountMap[accountId] ?? '',
      categoryId,
      categoryName: categoryMap[categoryId] ?? '',
    }
  })
}

export async function updateExpense(
  id: string,
  data: { title: string; amount: number; date: string; accountId: string; categoryId: string }
): Promise<void> {
  if (!data.title.trim()) throw new Error('사용처를 입력해주세요')
  if (!data.amount || data.amount <= 0) throw new Error('금액을 입력해주세요')
  if (!data.accountId) throw new Error('계좌를 선택해주세요')
  if (!data.categoryId) throw new Error('카테고리를 선택해주세요')

  await notion.pages.update({
    page_id: id,
    properties: {
      '사용처': { title: [{ text: { content: data.title.trim() } }] },
      '금액': { number: data.amount },
      '날짜': { date: { start: data.date } },
      '계좌': { relation: [{ id: data.accountId }] },
      '카테고리': { relation: [{ id: data.categoryId }] },
    },
  })
  revalidatePath('/history')
  revalidatePath('/')
}

export async function deleteExpense(id: string): Promise<void> {
  await notion.pages.update({ page_id: id, in_trash: true })
  revalidatePath('/history')
  revalidatePath('/')
}
```

- [ ] **Step 2: 커밋**

```bash
git add lib/actions/expense.ts
git commit -m "feat: 지출 CRUD Server Actions 구현"
```

---

### Task 10: 지출 입력 폼 컴포넌트

**Files:**
- Create: `components/expense-form.tsx`

- [ ] **Step 1: lucide-react 설치 확인 (shadcn/ui 의존성)**

```bash
npm list lucide-react
```

Expected: 이미 설치됨 (shadcn/ui 의존성)

- [ ] **Step 2: 지출 입력 폼 컴포넌트 작성**

`components/expense-form.tsx`:
```tsx
'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { createExpense } from '@/lib/actions/expense'
import type { Account, Category } from '@/lib/types'

interface Props {
  accounts: Account[]
  categories: Category[]
}

export function ExpenseForm({ accounts, categories }: Props) {
  const [date, setDate] = useState<Date>(new Date())
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isPending, startTransition] = useTransition()

  const filteredCategories = categories.filter((c) => c.accountId === accountId)

  const handleAccountChange = (value: string) => {
    setAccountId(value)
    setCategoryId('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !amount || !accountId || !categoryId) {
      toast.error('모든 필드를 입력해주세요')
      return
    }

    startTransition(async () => {
      try {
        await createExpense({
          title,
          amount: parseInt(amount, 10),
          date: format(date, 'yyyy-MM-dd'),
          accountId,
          categoryId,
        })
        setTitle('')
        setAmount('')
        setDate(new Date())
        toast.success('지출이 기록됐습니다')
      } catch (e: any) {
        toast.error(e.message ?? '지출 기록에 실패했습니다')
      }
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>지출 입력</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>날짜</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start', !date && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'yyyy년 MM월 dd일', { locale: ko }) : '날짜 선택'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  locale={ko}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <Label>사용처</Label>
            <Input placeholder="예: 스타벅스" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>금액 (원)</Label>
            <Input type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" />
          </div>

          <div className="space-y-1">
            <Label>계좌</Label>
            <Select value={accountId} onValueChange={handleAccountChange}>
              <SelectTrigger><SelectValue placeholder="계좌 선택" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>카테고리</Label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={!accountId}>
              <SelectTrigger>
                <SelectValue placeholder={accountId ? '카테고리 선택' : '계좌를 먼저 선택하세요'} />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? '기록 중...' : '지출 기록'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: 커밋**

```bash
git add components/expense-form.tsx
git commit -m "feat: 지출 입력 폼 컴포넌트 구현"
```

---

### Task 11: 예산 현황 컴포넌트 + 메인 페이지

**Files:**
- Create: `components/budget-status.tsx`
- Create: `app/page.tsx`

- [ ] **Step 1: 예산 현황 컴포넌트 작성**

`components/budget-status.tsx`:
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { BudgetStatus } from '@/lib/types'

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

  return (
    <Card>
      <CardHeader><CardTitle>이번 달 예산 현황</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {statuses.map((s) => (
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
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: 메인 페이지 작성**

`app/page.tsx`:
```tsx
import { format } from 'date-fns'
import { getAccounts } from '@/lib/actions/account'
import { getCategories } from '@/lib/actions/category'
import { getBudgetsByMonth } from '@/lib/actions/budget'
import { getExpensesByMonth } from '@/lib/actions/expense'
import { ExpenseForm } from '@/components/expense-form'
import { BudgetStatusCard } from '@/components/budget-status'
import { calculateBudgetStatus, groupExpensesByCategory } from '@/lib/utils/budget'
import type { BudgetStatus } from '@/lib/types'

export default async function HomePage() {
  const currentYearMonth = format(new Date(), 'yyyy-MM')

  const [accounts, categories, budgets, expenses] = await Promise.all([
    getAccounts(),
    getCategories(),
    getBudgetsByMonth(currentYearMonth),
    getExpensesByMonth(currentYearMonth),
  ])

  const spentByCategory = groupExpensesByCategory(expenses)

  const budgetStatuses: BudgetStatus[] = budgets.map((b) => {
    const category = categories.find((c) => c.id === b.categoryId)
    const spent = spentByCategory[b.categoryId] ?? 0
    return {
      categoryId: b.categoryId,
      categoryName: category?.name ?? '',
      ...calculateBudgetStatus(b.amount, spent),
    }
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <ExpenseForm accounts={accounts} categories={categories} />
      <BudgetStatusCard statuses={budgetStatuses} />
    </div>
  )
}
```

- [ ] **Step 3: 동작 확인**

```bash
npm run dev
```

`http://localhost:3000` 접속 후 확인:
- 지출 입력 폼 표시
- 계좌 선택 시 카테고리 필터 동작
- 지출 입력 후 예산 현황 갱신

- [ ] **Step 4: 커밋**

```bash
git add components/budget-status.tsx app/page.tsx
git commit -m "feat: 메인 페이지 구현 (지출 입력 + 예산 현황)"
```

---

## Chunk 5: 지출 내역 페이지

### Task 12: 지출 내역 테이블 + 수정/삭제

**Files:**
- Create: `components/month-selector.tsx`
- Create: `components/expense-list.tsx`
- Create: `app/history/page.tsx`

- [ ] **Step 1: 월 선택 컴포넌트 작성**

`components/month-selector.tsx`:
```tsx
'use client'

import { useRouter } from 'next/navigation'
import { format, addMonths, subMonths } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MonthSelector({ currentMonth }: { currentMonth: string }) {
  const router = useRouter()
  const current = new Date(`${currentMonth}-01`)

  const go = (date: Date) => {
    router.push(`/history?month=${format(date, 'yyyy-MM')}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => go(subMonths(current, 1))}>
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium w-24 text-center">{currentMonth}</span>
      <Button variant="outline" size="icon" onClick={() => go(addMonths(current, 1))}>
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: 지출 내역 테이블 컴포넌트 작성**

`components/expense-list.tsx`:
```tsx
'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { updateExpense, deleteExpense } from '@/lib/actions/expense'
import type { Account, Category, Expense } from '@/lib/types'

interface Props {
  expenses: Expense[]
  accounts: Account[]
  categories: Category[]
}

export function ExpenseList({ expenses, accounts, categories }: Props) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editDate, setEditDate] = useState<Date>(new Date())
  const [editTitle, setEditTitle] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editAccountId, setEditAccountId] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [isPending, startTransition] = useTransition()

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense)
    // UTC 파싱 버그 방지: "YYYY-MM-DD" 문자열을 로컬 날짜로 파싱
    const [y, m, d] = expense.date.split('-').map(Number)
    setEditDate(new Date(y, m - 1, d))
    setEditTitle(expense.title)
    setEditAmount(String(expense.amount))
    setEditAccountId(expense.accountId)
    setEditCategoryId(expense.categoryId)
  }

  const handleUpdate = () => {
    if (!editingExpense) return
    startTransition(async () => {
      try {
        await updateExpense(editingExpense.id, {
          title: editTitle,
          amount: parseInt(editAmount, 10),
          date: format(editDate, 'yyyy-MM-dd'),
          accountId: editAccountId,
          categoryId: editCategoryId,
        })
        setEditingExpense(null)
        toast.success('지출이 수정됐습니다')
      } catch {
        toast.error('지출 수정에 실패했습니다')
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('이 지출 기록을 삭제하시겠습니까?')) return
    startTransition(async () => {
      try {
        await deleteExpense(id)
        toast.success('지출이 삭제됐습니다')
      } catch {
        toast.error('지출 삭제에 실패했습니다')
      }
    })
  }

  const filteredCategories = categories.filter((c) => c.accountId === editAccountId)

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>날짜</TableHead>
            <TableHead>사용처</TableHead>
            <TableHead className="text-right">금액</TableHead>
            <TableHead>계좌</TableHead>
            <TableHead>카테고리</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                지출 기록이 없습니다
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{format(new Date(expense.date), 'MM/dd', { locale: ko })}</TableCell>
                <TableCell>{expense.title}</TableCell>
                <TableCell className="text-right">{expense.amount.toLocaleString()}원</TableCell>
                <TableCell>{expense.accountName}</TableCell>
                <TableCell>{expense.categoryName}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => openEdit(expense)}>수정</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(expense.id)} disabled={isPending}>삭제</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>지출 수정</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>날짜</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(editDate, 'yyyy년 MM월 dd일', { locale: ko })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={editDate} onSelect={(d) => d && setEditDate(d)} locale={ko} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label>사용처</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>금액 (원)</Label>
              <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} min="1" />
            </div>
            <div className="space-y-1">
              <Label>계좌</Label>
              <Select value={editAccountId} onValueChange={(v) => { setEditAccountId(v); setEditCategoryId('') }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>카테고리</Label>
              <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingExpense(null)}>취소</Button>
            <Button onClick={handleUpdate} disabled={isPending}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

- [ ] **Step 3: 지출 내역 페이지 작성**

`app/history/page.tsx`:
```tsx
import { format } from 'date-fns'
import { getAccounts } from '@/lib/actions/account'
import { getCategories } from '@/lib/actions/category'
import { getExpensesByMonth } from '@/lib/actions/expense'
import { ExpenseList } from '@/components/expense-list'
import { MonthSelector } from '@/components/month-selector'

interface Props {
  searchParams: Promise<{ month?: string }>
}

export default async function HistoryPage({ searchParams }: Props) {
  const { month } = await searchParams
  const yearMonth = month ?? format(new Date(), 'yyyy-MM')

  const [accounts, categories, expenses] = await Promise.all([
    getAccounts(),
    getCategories(),
    getExpensesByMonth(yearMonth),
  ])

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">지출 내역</h1>
        <MonthSelector currentMonth={yearMonth} />
      </div>
      <div className="text-sm text-muted-foreground">
        총 {expenses.length}건 · {total.toLocaleString()}원
      </div>
      <ExpenseList expenses={expenses} accounts={accounts} categories={categories} />
    </div>
  )
}
```

- [ ] **Step 4: 동작 확인**

```bash
npm run dev
```

`http://localhost:3000/history` 접속 후 확인:
- 이번 달 지출 목록 표시
- 월 이동 버튼 동작
- 수정 모달 열기/닫기
- 삭제 후 목록 갱신

- [ ] **Step 5: 전체 테스트 실행**

```bash
npx jest
```

Expected: PASS (5 tests)

- [ ] **Step 6: 빌드 확인**

```bash
npm run build
```

Expected: 에러 없이 빌드 성공

- [ ] **Step 7: 최종 커밋**

```bash
git add components/expense-list.tsx app/history/page.tsx components/month-selector.tsx
git commit -m "feat: 지출 내역 페이지 구현 (조회/수정/삭제)"
```

---

## 완료 체크리스트

- [ ] `npm run build` 에러 없음
- [ ] `npx jest` 전체 통과
- [ ] Notion DB 4개 생성 및 `.env.local` ID 입력 완료
- [ ] 메인 페이지: 지출 입력 후 예산 현황 갱신 확인
- [ ] 설정: 계좌/카테고리/예산 CRUD 동작 확인
- [ ] 설정: 계좌/카테고리 삭제 시 참조 무결성 차단 확인
- [ ] 지출 내역: 월 이동, 수정, 삭제 동작 확인
- [ ] 예산 설정: 전월 복사 동작 확인
