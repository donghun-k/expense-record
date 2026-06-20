import type { Category } from '@/lib/types'
import type { CategoryRepository } from '@/lib/repositories/category'

/** 카테고리 repository의 in-memory test adapter. 도메인 계약만 구현한다. */
export function createInMemoryCategoryRepository(
  seed: Category[] = []
): CategoryRepository & { store: Category[] } {
  const store: Category[] = seed.map((c) => ({ ...c }))
  let seq = store.length

  return {
    store,
    async list(accountId) {
      return store
        .filter((c) => (accountId ? c.accountId === accountId : true))
        .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
        .map((c) => ({ ...c }))
    },
    async create(input) {
      store.push({ id: `cat-${++seq}`, name: input.name.trim(), accountId: input.accountId, isFixed: input.isFixed })
    },
    async update(id, input) {
      const c = store.find((x) => x.id === id)
      if (c) Object.assign(c, { name: input.name.trim(), accountId: input.accountId, isFixed: input.isFixed })
    },
    async existsByAccount(accountId) {
      return store.some((c) => c.accountId === accountId)
    },
    async softDelete(id) {
      const i = store.findIndex((c) => c.id === id)
      if (i >= 0) store.splice(i, 1)
    },
  }
}
