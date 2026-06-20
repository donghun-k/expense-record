import type { Budget } from '@/lib/types'
import type { BudgetRepository } from '@/lib/repositories/budget'

/**
 * 예산 repository의 in-memory test adapter. 도메인 계약만 구현한다.
 * (categoryName은 Notion 제목 label 전용이라 Budget 도메인에 저장하지 않는다.)
 */
export function createInMemoryBudgetRepository(
  seed: Budget[] = []
): BudgetRepository & { store: Budget[] } {
  const store: Budget[] = seed.map((b) => ({ ...b }))
  let seq = store.length

  return {
    store,
    async listByMonth(yearMonth) {
      return store.filter((b) => b.yearMonth === yearMonth).map((b) => ({ ...b }))
    },
    async findByMonthAndCategory(yearMonth, categoryId) {
      const b = store.find((x) => x.yearMonth === yearMonth && x.categoryId === categoryId)
      return b ? { ...b } : null
    },
    async create(input) {
      store.push({
        id: `bud-${++seq}`,
        yearMonth: input.yearMonth,
        amount: input.amount,
        categoryId: input.categoryId,
      })
    },
    async updateAmount(id, amount) {
      const b = store.find((x) => x.id === id)
      if (b) b.amount = amount
    },
  }
}
