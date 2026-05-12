import { Suspense } from 'react'
import { getCurrentYearMonth } from '@/lib/utils/date-range'
import { getAccounts } from '@/lib/actions/account'
import { getCategories } from '@/lib/actions/category'
import { getExpensesByMonth } from '@/lib/actions/expense'
import { ExpenseList } from '@/components/expense-list'
import { MonthSelector } from '@/components/month-selector'
import { PageHeader } from '@/components/page-header'
import { Skeleton } from '@/components/ui/skeleton'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ month?: string }>
}

function formatCaption(yearMonth: string) {
  const [y, m] = yearMonth.split('-')
  return `${y}년 ${Number(m)}월`
}

async function HistoryContent({ yearMonth }: { yearMonth: string }) {
  const [accounts, categories, expenses] = await Promise.all([
    getAccounts(),
    getCategories(),
    getExpensesByMonth(yearMonth),
  ])

  return (
    <>
      <PageHeader
        caption={formatCaption(yearMonth)}
        title="지출 내역"
        actions={<MonthSelector currentMonth={yearMonth} />}
      />
      <ExpenseList expenses={expenses} accounts={accounts} categories={categories} />
    </>
  )
}

function HistorySkeleton() {
  return (
    <div className="space-y-4">
      <div className="mb-5 flex items-end justify-between border-b border-[var(--surface-subtle-border)] pb-4">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-32" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

export default async function HistoryPage({ searchParams }: Props) {
  const { month } = await searchParams
  const yearMonth = month ?? getCurrentYearMonth()

  return (
    <Suspense key={yearMonth} fallback={<HistorySkeleton />}>
      <HistoryContent yearMonth={yearMonth} />
    </Suspense>
  )
}
