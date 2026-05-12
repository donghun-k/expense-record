import { Suspense } from 'react'
import { getCurrentYearMonth } from '@/lib/utils/date-range'
import { getAccounts } from '@/lib/actions/account'
import { getCategories } from '@/lib/actions/category'
import { getBudgetsByMonth } from '@/lib/actions/budget'
import { getExpensesByMonth } from '@/lib/actions/expense'
import { ExpenseForm } from '@/components/expense-form'
import { BudgetStatusCard } from '@/components/budget-status'
import { PageHeader } from '@/components/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { calculateBudgetStatus, groupExpensesByCategory } from '@/lib/utils/budget'
import type { BudgetStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

function formatCaption(yearMonth: string) {
  const [y, m] = yearMonth.split('-')
  return `${y}년 ${Number(m)}월`
}

async function HomeContent() {
  const currentYearMonth = getCurrentYearMonth()

  const [accounts, categories, budgets, expenses] = await Promise.all([
    getAccounts(),
    getCategories(),
    getBudgetsByMonth(currentYearMonth),
    getExpensesByMonth(currentYearMonth),
  ])

  const spentByCategory = groupExpensesByCategory(expenses)

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

  return (
    <div className="space-y-5">
      <PageHeader caption={formatCaption(currentYearMonth)} title="지출 입력" />
      <ExpenseForm accounts={accounts} categories={categories.filter((c) => !c.isFixed)} />
      <BudgetStatusCard statuses={budgetStatuses} />
    </div>
  )
}

function HomeSkeleton() {
  return (
    <div className="space-y-5">
      <div className="mb-5 flex flex-col gap-1 border-b border-[var(--surface-subtle-border)] pb-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-32" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  )
}
