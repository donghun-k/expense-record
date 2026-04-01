// Notion API 호출이 있으므로 정적 사전 렌더링 비활성화
export const dynamic = 'force-dynamic'

import { getCurrentYearMonth, getPrevYearMonth } from '@/lib/utils/date-range'
import { getAccounts } from '@/lib/actions/account'
import { getCategories } from '@/lib/actions/category'
import { getBudgetsByMonth } from '@/lib/actions/budget'
import { SettingsTabs } from '@/components/settings/settings-tabs'

export default async function SettingsPage() {
  const currentYearMonth = getCurrentYearMonth()
  const prevYearMonth = getPrevYearMonth(currentYearMonth)

  const [accounts, categories, budgets, prevBudgets] = await Promise.all([
    getAccounts(),
    getCategories(),
    getBudgetsByMonth(currentYearMonth),
    getBudgetsByMonth(prevYearMonth),
  ])

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">설정</h1>
      <SettingsTabs
        accounts={accounts}
        categories={categories}
        budgets={budgets}
        currentYearMonth={currentYearMonth}
        hasPreviousMonthBudget={prevBudgets.length > 0}
      />
    </div>
  )
}
