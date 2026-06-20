import { budgetCodec } from '@/lib/notion/budget.codec'

/** 예산 페이지 fixture */
function budgetPage(opts: { yearMonth?: string; amount?: number | null; categoryId?: string }) {
  const { yearMonth = '2026-06', amount = 50000, categoryId = 'cat-1' } = opts
  return {
    id: 'bud-1',
    properties: {
      '연월': { rich_text: yearMonth === '' ? [] : [{ plain_text: yearMonth }] },
      '예산금액': { number: amount },
      '카테고리': { relation: categoryId === '' ? [] : [{ id: categoryId }] },
    },
  }
}

describe('budgetCodec.read', () => {
  it('Notion 페이지에서 Budget을 뽑는다', () => {
    expect(budgetCodec.read(budgetPage({}))).toEqual({
      id: 'bud-1',
      yearMonth: '2026-06',
      amount: 50000,
      categoryId: 'cat-1',
    })
  })
  it('금액이 null이면 0', () => {
    expect(budgetCodec.read(budgetPage({ amount: null })).amount).toBe(0)
  })
  it('연월/카테고리가 비면 빈 문자열', () => {
    const b = budgetCodec.read(budgetPage({ yearMonth: '', categoryId: '' }))
    expect(b.yearMonth).toBe('')
    expect(b.categoryId).toBe('')
  })
})

describe('budgetCodec.write', () => {
  it('입력을 Notion properties로 변환한다 (이름은 연월+카테고리명)', () => {
    expect(budgetCodec.write({ yearMonth: '2026-06', categoryId: 'cat-1', amount: 50000, categoryName: '식비' })).toEqual({
      '이름': { title: [{ text: { content: '2026-06 식비' } }] },
      '연월': { rich_text: [{ text: { content: '2026-06' } }] },
      '예산금액': { number: 50000 },
      '카테고리': { relation: [{ id: 'cat-1' }] },
    })
  })
})
