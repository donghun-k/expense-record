import type { Account } from '@/lib/types'
import type { AccountRepository } from '@/lib/repositories/account'

/**
 * 계좌 repository의 in-memory test adapter.
 * 도메인 계약만 구현한다(저장·조회·정렬·trim). store를 노출해 검증에 쓴다.
 */
export function createInMemoryAccountRepository(
  seed: Account[] = []
): AccountRepository & { store: Account[] } {
  const store: Account[] = seed.map((a) => ({ ...a }))
  let seq = store.length

  return {
    store,
    async list() {
      return [...store].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    },
    async create(input) {
      store.push({ id: `acc-${++seq}`, name: input.name.trim() })
    },
    async update(id, input) {
      const acc = store.find((a) => a.id === id)
      if (acc) acc.name = input.name.trim()
    },
  }
}
