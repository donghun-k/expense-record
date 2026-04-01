import { getCurrentYearMonth } from '@/lib/utils/date-range'
import { getAccounts } from '@/lib/actions/account'
import { getCategories } from '@/lib/actions/category'
import { getBudgetsByMonth } from '@/lib/actions/budget'
import { getExpensesByMonth } from '@/lib/actions/expense'
import { ExpenseForm } from '@/components/expense-form'
import { BudgetStatusCard } from '@/components/budget-status'
import { calculateBudgetStatus, groupExpensesByCategory } from '@/lib/utils/budget'
import type { BudgetStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
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
    <div className="max-w-2xl mx-auto space-y-6">
      <ExpenseForm accounts={accounts} categories={categories.filter((c) => !c.isFixed)} />
      <BudgetStatusCard statuses={budgetStatuses} />
    </div>
  )
}
