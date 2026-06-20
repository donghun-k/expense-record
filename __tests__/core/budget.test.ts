/**
 * @jest-environment node
 */
import { upsertBudget } from '@/lib/core/budget'
import { createInMemoryBudgetRepository } from '../fakes/budget-repo'

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
