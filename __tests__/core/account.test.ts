/**
 * @jest-environment node
 */
import { deleteAccount } from '@/lib/core/account'
import { createInMemoryAccountRepository } from '../fakes/account-repo'
import { createInMemoryCategoryRepository } from '../fakes/category-repo'
import { createInMemoryExpenseRepository } from '../fakes/expense-repo'

describe('deleteAccount (core, mock 0개)', () => {
  it('참조하는 카테고리가 있으면 거부하고 삭제하지 않는다', async () => {
    const accounts = createInMemoryAccountRepository([{ id: 'acc-1', name: '신한' }])
    const categories = createInMemoryCategoryRepository([
      { id: 'cat-1', name: '식비', accountId: 'acc-1', isFixed: false },
    ])
    const expenses = createInMemoryExpenseRepository()

    const res = await deleteAccount(accounts, categories, expenses, 'acc-1')

    expect(res).toEqual({ success: false, message: '이 계좌를 사용하는 카테고리가 있어 삭제할 수 없습니다.' })
    expect(accounts.store).toHaveLength(1)
  })

  it('참조하는 지출이 있으면 거부하고 삭제하지 않는다', async () => {
    const accounts = createInMemoryAccountRepository([{ id: 'acc-1', name: '신한' }])
    const categories = createInMemoryCategoryRepository()
    const expenses = createInMemoryExpenseRepository([
      { id: 'exp-1', title: '점심', amount: 9000, date: '2026-06-01', accountId: 'acc-1', categoryId: 'cat-x' },
    ])

    const res = await deleteAccount(accounts, categories, expenses, 'acc-1')

    expect(res).toEqual({ success: false, message: '이 계좌를 사용하는 지출 기록이 있어 삭제할 수 없습니다.' })
    expect(accounts.store).toHaveLength(1)
  })

  it('카테고리가 우선 검사된다(둘 다 참조 시 카테고리 메시지)', async () => {
    const accounts = createInMemoryAccountRepository([{ id: 'acc-1', name: '신한' }])
    const categories = createInMemoryCategoryRepository([
      { id: 'cat-1', name: '식비', accountId: 'acc-1', isFixed: false },
    ])
    const expenses = createInMemoryExpenseRepository([
      { id: 'exp-1', title: '점심', amount: 9000, date: '2026-06-01', accountId: 'acc-1', categoryId: 'cat-1' },
    ])

    const res = await deleteAccount(accounts, categories, expenses, 'acc-1')

    expect(res.message).toBe('이 계좌를 사용하는 카테고리가 있어 삭제할 수 없습니다.')
  })

  it('참조가 없으면 삭제하고 success를 반환한다', async () => {
    const accounts = createInMemoryAccountRepository([{ id: 'acc-1', name: '신한' }])
    const categories = createInMemoryCategoryRepository([
      { id: 'cat-2', name: '식비', accountId: 'acc-2', isFixed: false },
    ])
    const expenses = createInMemoryExpenseRepository([
      { id: 'exp-1', title: '점심', amount: 9000, date: '2026-06-01', accountId: 'acc-2', categoryId: 'cat-2' },
    ])

    const res = await deleteAccount(accounts, categories, expenses, 'acc-1')

    expect(res).toEqual({ success: true })
    expect(accounts.store).toHaveLength(0)
  })
})
