/**
 * @jest-environment node
 */
import { countPastExpenses, deletePastExpenses, listExpensesByMonth } from '@/lib/core/expense'
import { createInMemoryExpenseRepository } from '../fakes/expense-repo'
import { createInMemoryAccountRepository } from '../fakes/account-repo'
import { createInMemoryCategoryRepository } from '../fakes/category-repo'

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

describe('listExpensesByMonth (core, mock 0개)', () => {
  // 기준월 2026-06 → 2026-06-25 ~ 2026-07-24
  const accounts = createInMemoryAccountRepository([
    { id: 'acc-1', name: '신한' },
    { id: 'acc-2', name: '국민' },
  ])
  const categories = createInMemoryCategoryRepository([
    { id: 'cat-1', name: '식비', accountId: 'acc-1', isFixed: false },
    { id: 'cat-2', name: '교통', accountId: 'acc-2', isFixed: false },
  ])

  it('기준월 기간 내 지출만 날짜 내림차순으로, 계좌명/카테고리명을 채워 반환한다', async () => {
    const expenses = createInMemoryExpenseRepository([
      { id: 'e1', title: '커피', amount: 5000, date: '2026-06-26', accountId: 'acc-1', categoryId: 'cat-1' },
      { id: 'e2', title: '버스', amount: 1500, date: '2026-07-10', accountId: 'acc-2', categoryId: 'cat-2' },
      { id: 'e3', title: '범위밖', amount: 1000, date: '2026-06-24', accountId: 'acc-1', categoryId: 'cat-1' },
    ])

    const result = await listExpensesByMonth(expenses, accounts, categories, '2026-06')

    expect(result.map((e) => e.id)).toEqual(['e2', 'e1']) // 내림차순, 범위밖 e3 제외
    expect(result[0]).toMatchObject({ accountName: '국민', categoryName: '교통' })
    expect(result[1]).toMatchObject({ accountName: '신한', categoryName: '식비' })
  })

  it('계좌/카테고리를 찾지 못하면 이름을 빈 문자열로 둔다', async () => {
    const expenses = createInMemoryExpenseRepository([
      { id: 'e1', title: '미아', amount: 5000, date: '2026-06-26', accountId: 'gone', categoryId: 'gone' },
    ])

    const result = await listExpensesByMonth(expenses, accounts, categories, '2026-06')

    expect(result[0]).toMatchObject({ accountName: '', categoryName: '' })
  })
})
