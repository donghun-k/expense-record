import { calculateBudgetStatus, groupExpensesByCategory, buildBudgetStatuses } from '@/lib/utils/budget'
import type { Account, Budget, Category, Expense } from '@/lib/types'

describe('calculateBudgetStatus', () => {
  it('잔여금액 = 예산 - 지출', () => {
    const result = calculateBudgetStatus(500000, 30000)
    expect(result.remaining).toBe(470000)
    expect(result.isOver).toBe(false)
  })

  it('초과 지출 시 음수 반환 및 isOver=true', () => {
    const result = calculateBudgetStatus(100000, 150000)
    expect(result.remaining).toBe(-50000)
    expect(result.isOver).toBe(true)
  })

  it('예산과 지출이 같으면 remaining=0, isOver=false', () => {
    const result = calculateBudgetStatus(100000, 100000)
    expect(result.remaining).toBe(0)
    expect(result.isOver).toBe(false)
  })
})

describe('groupExpensesByCategory', () => {
  it('카테고리별 지출 합계 계산', () => {
    const expenses = [
      { categoryId: 'cat1', amount: 10000 },
      { categoryId: 'cat1', amount: 20000 },
      { categoryId: 'cat2', amount: 15000 },
    ]
    const result = groupExpensesByCategory(expenses)
    expect(result['cat1']).toBe(30000)
    expect(result['cat2']).toBe(15000)
  })

  it('지출이 없으면 빈 객체 반환', () => {
    const result = groupExpensesByCategory([])
    expect(Object.keys(result).length).toBe(0)
  })
})

describe('buildBudgetStatuses', () => {
  const accounts: Account[] = [
    { id: 'acc-1', name: '신한' },
    { id: 'acc-2', name: '국민' },
  ]
  const categories: Category[] = [
    { id: 'cat-1', name: '식비', accountId: 'acc-1', isFixed: false },
    { id: 'cat-2', name: '구독', accountId: 'acc-2', isFixed: true },
  ]
  const exp = (categoryId: string, amount: number): Expense => ({
    id: `e-${categoryId}-${amount}`,
    title: 't',
    amount,
    date: '2026-06-26',
    accountId: '',
    accountName: '',
    categoryId,
    categoryName: '',
  })

  it('일반 카테고리는 지출 합계로 예산 상태를 계산하고 계좌/카테고리명을 채운다', () => {
    const budgets: Budget[] = [{ id: 'b1', yearMonth: '2026-06', categoryId: 'cat-1', amount: 100000 }]
    const result = buildBudgetStatuses(budgets, categories, accounts, [exp('cat-1', 30000), exp('cat-1', 20000)])

    expect(result).toEqual([
      {
        categoryId: 'cat-1',
        categoryName: '식비',
        accountId: 'acc-1',
        accountName: '신한',
        budget: 100000,
        spent: 50000,
        remaining: 50000,
        isOver: false,
        isFixed: false,
      },
    ])
  })

  it('고정 카테고리는 예산금액을 곧 지출로 보고 remaining=0, isOver=false', () => {
    const budgets: Budget[] = [{ id: 'b2', yearMonth: '2026-06', categoryId: 'cat-2', amount: 9900 }]
    const result = buildBudgetStatuses(budgets, categories, accounts, [exp('cat-2', 99999)])

    expect(result[0]).toMatchObject({ budget: 9900, spent: 9900, remaining: 0, isOver: false, isFixed: true })
  })

  it('카테고리나 계좌를 찾지 못하는 예산은 제외한다', () => {
    const budgets: Budget[] = [
      { id: 'b3', yearMonth: '2026-06', categoryId: 'gone', amount: 1000 }, // 카테고리 없음
      { id: 'b4', yearMonth: '2026-06', categoryId: 'cat-1', amount: 100000 }, // 정상
    ]
    const orphanAccountCategories: Category[] = [
      ...categories,
      { id: 'cat-3', name: '미아', accountId: 'no-acc', isFixed: false },
    ]
    const withOrphan: Budget[] = [...budgets, { id: 'b5', yearMonth: '2026-06', categoryId: 'cat-3', amount: 500 }]

    const result = buildBudgetStatuses(withOrphan, orphanAccountCategories, accounts, [])

    expect(result.map((s) => s.categoryId)).toEqual(['cat-1'])
  })

  it('지출이 없으면 일반 카테고리 spent=0', () => {
    const budgets: Budget[] = [{ id: 'b6', yearMonth: '2026-06', categoryId: 'cat-1', amount: 100000 }]
    const result = buildBudgetStatuses(budgets, categories, accounts, [])

    expect(result[0]).toMatchObject({ spent: 0, remaining: 100000 })
  })
})
