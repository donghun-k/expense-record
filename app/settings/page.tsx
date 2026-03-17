// Notion API 호출이 있으므로 정적 사전 렌더링 비활성화
export const dynamic = 'force-dynamic'

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
