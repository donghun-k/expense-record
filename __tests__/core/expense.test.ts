/**
 * @jest-environment node
 */
import { countPastExpenses, deletePastExpenses } from '@/lib/core/expense'
import { createInMemoryExpenseRepository } from '../fakes/expense-repo'

// 2026-05-10 → 기준월 2026-04 (day<25) → 시작일 2026-04-25. "과거" = 2026-04-25 미만.
const may10 = new Date(2026, 4, 10)

function exp(id: string, date: string) {
  return { id, title: 't', amount: 1, date, accountId: 'a', categoryId: 'c' }
}

describe('countPastExpenses (core, mock 0개)', () => {
  it('기준월 시작일(2026-04-25) 이전 건만 센다', async () => {
    const repo = createInMemoryExpenseRepository([
      exp('p1', '2026-04-24'), // 과거
      exp('p2', '2026-04-25'), // 경계 = 현재 기준월
      exp('p3', '2026-05-01'), // 현재
    ])
    expect(await countPastExpenses(repo, may10)).toBe(1)
  })
})

describe('deletePastExpenses (core, mock 0개)', () => {
  it('이전 건만 삭제하고 카운트를 반환한다', async () => {
    const repo = createInMemoryExpenseRepository([
      exp('p1', '2026-04-24'),
      exp('p2', '2026-04-25'),
      exp('p3', '2026-05-01'),
    ])
    expect(await deletePastExpenses(repo, may10)).toEqual({ deletedCount: 1 })
    expect(repo.store.map((e) => e.id)).toEqual(['p2', 'p3'])
  })
})
