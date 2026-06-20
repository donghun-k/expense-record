import type { Account, Budget, BudgetStatus, Category, Expense } from '@/lib/types'

// 예산 상태를 계산하는 함수
export function calculateBudgetStatus(budget: number, spent: number) {
  const remaining = budget - spent
  return {
    budget,
    spent,
    remaining,
    isOver: remaining < 0,
  }
}

// 지출을 카테고리별로 그룹화하여 합계를 계산하는 함수
export function groupExpensesByCategory(
  expenses: { categoryId: string; amount: number }[]
): Record<string, number> {
  return expenses.reduce((acc, expense) => {
    acc[expense.categoryId] = (acc[expense.categoryId] ?? 0) + expense.amount
    return acc
  }, {} as Record<string, number>)
}

/**
 * 예산 목록을 카테고리·계좌와 join하고 지출 합계를 더해 화면용 BudgetStatus[]로 조립한다.
 * 고정 카테고리는 예산금액을 곧 지출로 보고(budget=spent, remaining=0), 일반 카테고리는
 * 카테고리별 지출 합계로 잔여를 계산한다. 카테고리/계좌를 찾지 못하는 예산은 제외한다.
 */
export function buildBudgetStatuses(
  budgets: Budget[],
  categories: Category[],
  accounts: Account[],
  expenses: Expense[]
): BudgetStatus[] {
  const spentByCategory = groupExpensesByCategory(expenses)
  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const accountById = new Map(accounts.map((a) => [a.id, a]))

  return budgets
    .map((b): BudgetStatus | null => {
      const category = categoryById.get(b.categoryId)
      if (!category) return null
      const account = accountById.get(category.accountId)
      if (!account) return null

      const label = {
        categoryId: b.categoryId,
        categoryName: category.name,
        accountId: account.id,
        accountName: account.name,
      }

      if (category.isFixed) {
        return { ...label, budget: b.amount, spent: b.amount, remaining: 0, isOver: false, isFixed: true }
      }

      const spent = spentByCategory[b.categoryId] ?? 0
      return { ...label, ...calculateBudgetStatus(b.amount, spent), isFixed: false }
    })
    .filter((s): s is BudgetStatus => s !== null)
}
