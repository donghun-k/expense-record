/**
 * @jest-environment node
 */
import { deleteCategory } from '@/lib/core/category'
import { createInMemoryCategoryRepository } from '../fakes/category-repo'
import { createInMemoryExpenseRepository } from '../fakes/expense-repo'
import { createInMemoryBudgetRepository } from '../fakes/budget-repo'

const seedCategory = () =>
  createInMemoryCategoryRepository([{ id: 'cat-1', name: '식비', accountId: 'acc-1', isFixed: false }])

describe('deleteCategory (core, mock 0개)', () => {
  it('참조하는 지출이 있으면 거부하고 삭제하지 않는다', async () => {
    const categories = seedCategory()
    const expenses = createInMemoryExpenseRepository([
      { id: 'exp-1', title: '점심', amount: 9000, date: '2026-06-01', accountId: 'acc-1', categoryId: 'cat-1' },
    ])
    const budgets = createInMemoryBudgetRepository([
      { id: 'bud-1', yearMonth: '2026-06', categoryId: 'cat-1', amount: 50000 },
    ])

    const res = await deleteCategory(categories, expenses, budgets, 'cat-1')

    expect(res).toEqual({ success: false, message: '이 카테고리를 사용하는 지출 기록이 있어 삭제할 수 없습니다.' })
    expect(categories.store).toHaveLength(1)
    expect(budgets.store).toHaveLength(1) // 가드 거부 시 cascade도 일어나지 않는다
  })

  it('참조 지출이 없으면 연결된 예산을 cascade 삭제하고 카테고리를 삭제한다', async () => {
    const categories = seedCategory()
    const expenses = createInMemoryExpenseRepository()
    const budgets = createInMemoryBudgetRepository([
      { id: 'bud-1', yearMonth: '2026-05', categoryId: 'cat-1', amount: 50000 },
      { id: 'bud-2', yearMonth: '2026-06', categoryId: 'cat-1', amount: 70000 },
      { id: 'bud-3', yearMonth: '2026-06', categoryId: 'cat-2', amount: 30000 },
    ])

    const res = await deleteCategory(categories, expenses, budgets, 'cat-1')

    expect(res).toEqual({ success: true })
    expect(categories.store).toHaveLength(0)
    expect(budgets.store.map((b) => b.id)).toEqual(['bud-3']) // cat-1 예산만 삭제
  })

  it('cascade 도중 실패하면 거부 메시지를 반환하고 카테고리를 삭제하지 않는다', async () => {
    const categories = seedCategory()
    const expenses = createInMemoryExpenseRepository()
    const budgets = {
      ...createInMemoryBudgetRepository(),
      async softDeleteByCategory() {
        throw new Error('notion down')
      },
    }

    const res = await deleteCategory(categories, expenses, budgets, 'cat-1')

    expect(res).toEqual({ success: false, message: '연결된 예산 삭제 중 오류가 발생했습니다. 다시 시도해주세요.' })
    expect(categories.store).toHaveLength(1)
  })

  it('참조 지출도 예산도 없으면 카테고리를 삭제한다', async () => {
    const categories = seedCategory()
    const expenses = createInMemoryExpenseRepository()
    const budgets = createInMemoryBudgetRepository()

    const res = await deleteCategory(categories, expenses, budgets, 'cat-1')

    expect(res).toEqual({ success: true })
    expect(categories.store).toHaveLength(0)
  })
})
