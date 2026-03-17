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
