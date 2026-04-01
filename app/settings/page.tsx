// Notion API 호출이 있으므로 정적 사전 렌더링 비활성화
export const dynamic = 'force-dynamic'

import { getCurrentYearMonth } from '@/lib/utils/date-range'
import { getAccounts } from '@/lib/actions/account'
import { getCategories } from '@/lib/actions/category'
import { getBudgetsByMonth } from '@/lib/actions/budget'
import { SettingsTabs } from '@/components/settings/settings-tabs'

export default async function SettingsPage() {
  const currentYearMonth = getCurrentYearMonth()
  const [cy, cm] = currentYearMonth.split('-').map(Number)
  const prevYearMonth = `${cm === 1 ? cy - 1 : cy}-${String(cm === 1 ? 12 : cm - 1).padStart(2, '0')}`

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
