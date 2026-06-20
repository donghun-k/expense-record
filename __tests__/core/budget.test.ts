/**
 * @jest-environment node
 */
import { upsertBudget, copyBudgetFromPreviousMonth } from '@/lib/core/budget'
import { createInMemoryBudgetRepository } from '../fakes/budget-repo'
import { createInMemoryCategoryRepository } from '../fakes/category-repo'

describe('upsertBudget (core, mock 0개)', () => {
  it('같은 연월+카테고리가 없으면 새로 만든다', async () => {
    const repo = createInMemoryBudgetRepository()
    await upsertBudget(repo, { yearMonth: '2026-06', categoryId: 'cat-1', amount: 50000, categoryName: '식비' })

    expect(repo.store).toHaveLength(1)
    expect(repo.store[0]).toMatchObject({ yearMonth: '2026-06', categoryId: 'cat-1', amount: 50000 })
  })

  it('이미 있으면 중복 생성하지 않고 금액만 갱신한다', async () => {
    const repo = createInMemoryBudgetRepository([
      { id: 'bud-1', yearMonth: '2026-06', categoryId: 'cat-1', amount: 50000 },
    ])
    await upsertBudget(repo, { yearMonth: '2026-06', categoryId: 'cat-1', amount: 70000, categoryName: '식비' })

    expect(repo.store).toHaveLength(1)
    expect(repo.store[0].amount).toBe(70000)
  })

  it('다른 카테고리는 별도로 생성한다', async () => {
    const repo = createInMemoryBudgetRepository([
      { id: 'bud-1', yearMonth: '2026-06', categoryId: 'cat-1', amount: 50000 },
    ])
    await upsertBudget(repo, { yearMonth: '2026-06', categoryId: 'cat-2', amount: 30000, categoryName: '교통' })

    expect(repo.store).toHaveLength(2)
  })

  it('음수 금액이면 throw한다', async () => {
    const repo = createInMemoryBudgetRepository()
    await expect(
      upsertBudget(repo, { yearMonth: '2026-06', categoryId: 'cat-1', amount: -1, categoryName: '식비' })
    ).rejects.toThrow('올바른 예산 금액을 입력해주세요')
    expect(repo.store).toHaveLength(0)
  })
})

describe('copyBudgetFromPreviousMonth (core, mock 0개)', () => {
  const categories = createInMemoryCategoryRepository([
    { id: 'cat-1', name: '식비', accountId: 'acc-1', isFixed: false },
    { id: 'cat-2', name: '교통', accountId: 'acc-1', isFixed: false },
  ])

  it('이전 달 예산을 대상 달로 복사하고 true를 반환한다', async () => {
    const budgets = createInMemoryBudgetRepository([
      { id: 'b1', yearMonth: '2026-05', categoryId: 'cat-1', amount: 50000 },
      { id: 'b2', yearMonth: '2026-05', categoryId: 'cat-2', amount: 30000 },
    ])
    const ok = await copyBudgetFromPreviousMonth(budgets, categories, '2026-06', '2026-05')

    expect(ok).toBe(true)
    const target = await budgets.listByMonth('2026-06')
    expect(target.map((b) => [b.categoryId, b.amount]).sort()).toEqual([
      ['cat-1', 50000],
      ['cat-2', 30000],
    ])
  })

  it('이미 같은 연월+카테고리가 있으면 금액만 갱신한다', async () => {
    const budgets = createInMemoryBudgetRepository([
      { id: 'b1', yearMonth: '2026-05', categoryId: 'cat-1', amount: 50000 },
      { id: 'b2', yearMonth: '2026-06', categoryId: 'cat-1', amount: 10000 },
    ])
    await copyBudgetFromPreviousMonth(budgets, categories, '2026-06', '2026-05')

    const target = await budgets.listByMonth('2026-06')
    expect(target).toHaveLength(1)
    expect(target[0].amount).toBe(50000)
  })

  it('복사할 예산이 없으면 false를 반환한다', async () => {
    const budgets = createInMemoryBudgetRepository()
    expect(await copyBudgetFromPreviousMonth(budgets, categories, '2026-06', '2026-05')).toBe(false)
  })
})
