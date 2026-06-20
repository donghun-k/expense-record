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
import { buildBudgetStatuses } from '@/lib/utils/budget'

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

  const budgetStatuses = buildBudgetStatuses(budgets, categories, accounts, expenses)

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
