import type { ExpenseRepository } from '@/lib/repositories/expense'

type Stored = { id: string; title: string; amount: number; date: string; accountId: string; categoryId: string }

/**
 * 지출 repository의 in-memory test adapter. 도메인 계약만 구현한다.
 * pagination/rate-limit/부분실패는 NotionRepo adapter 책임이라 흉내내지 않는다.
 */
export function createInMemoryExpenseRepository(
  seed: Stored[] = []
): ExpenseRepository & { store: Stored[] } {
  const store: Stored[] = seed.map((e) => ({ ...e }))
  let seq = store.length

  return {
    store,
    async create(input) {
      store.push({ id: `exp-${++seq}`, ...input, title: input.title.trim() })
    },
    async update(id, input) {
      const i = store.findIndex((e) => e.id === id)
      if (i >= 0) store[i] = { id, ...input, title: input.title.trim() }
    },
    async softDelete(id) {
      const i = store.findIndex((e) => e.id === id)
      if (i >= 0) store.splice(i, 1)
    },
    async countBefore(date) {
      return store.filter((e) => e.date < date).length
    },
    async softDeleteBefore(date) {
      const before = store.filter((e) => e.date < date)
      for (const e of before) store.splice(store.indexOf(e), 1)
      return { deletedCount: before.length }
    },
    async existsByAccount(accountId) {
      return store.some((e) => e.accountId === accountId)
    },
  }
}
