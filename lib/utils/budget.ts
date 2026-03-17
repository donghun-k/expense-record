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
