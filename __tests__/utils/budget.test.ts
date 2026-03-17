import { calculateBudgetStatus, groupExpensesByCategory } from '@/lib/utils/budget'

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
