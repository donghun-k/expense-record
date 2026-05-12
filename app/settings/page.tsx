// Notion API 호출이 있으므로 정적 사전 렌더링 비활성화
export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { getCurrentYearMonth, getPrevYearMonth } from '@/lib/utils/date-range'
import { getAccounts } from '@/lib/actions/account'
import { getCategories } from '@/lib/actions/category'
import { getBudgetsByMonth } from '@/lib/actions/budget'
import { SettingsTabs } from '@/components/settings/settings-tabs'
import { PageHeader } from '@/components/page-header'
import { Skeleton } from '@/components/ui/skeleton'

async function SettingsContent() {
  const currentYearMonth = getCurrentYearMonth()
  const prevYearMonth = getPrevYearMonth(currentYearMonth)

  const [accounts, categories, budgets, prevBudgets] = await Promise.all([
    getAccounts(),
    getCategories(),
    getBudgetsByMonth(currentYearMonth),
    getBudgetsByMonth(prevYearMonth),
  ])

  return (
    <>
      <PageHeader caption="설정" title="계좌 · 카테고리 · 예산 관리" />
      <SettingsTabs
        accounts={accounts}
        categories={categories}
        budgets={budgets}
        currentYearMonth={currentYearMonth}
        hasPreviousMonthBudget={prevBudgets.length > 0}
      />
    </>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="mb-5 flex flex-col gap-1 border-b border-[var(--surface-subtle-border)] pb-4">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-7 w-64" />
      </div>
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  )
}
