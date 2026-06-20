import { expenseCodec } from '@/lib/notion/expense.codec'

/** 지출 페이지 fixture */
function expensePage(opts: {
  title?: string
  amount?: number | null
  date?: string | null
  accountId?: string
  categoryId?: string
}) {
  const { title = '스타벅스', amount = 5500, date = '2026-06-20', accountId = 'acc-1', categoryId = 'cat-1' } = opts
  return {
    id: 'exp-1',
    properties: {
      '사용처': { title: title === '' ? [] : [{ plain_text: title }] },
      '금액': { number: amount },
      '날짜': { date: date === null ? null : { start: date } },
      '계좌': { relation: accountId === '' ? [] : [{ id: accountId }] },
      '카테고리': { relation: categoryId === '' ? [] : [{ id: categoryId }] },
    },
  }
}

describe('expenseCodec.read', () => {
  it('Notion 페이지에서 ExpenseRow를 뽑는다 (이름 제외)', () => {
    expect(expenseCodec.read(expensePage({}))).toEqual({
      id: 'exp-1',
      title: '스타벅스',
      amount: 5500,
      date: '2026-06-20',
      accountId: 'acc-1',
      categoryId: 'cat-1',
    })
  })
  it('금액 null → 0, 날짜 null → 빈 문자열', () => {
    const row = expenseCodec.read(expensePage({ amount: null, date: null }))
    expect(row.amount).toBe(0)
    expect(row.date).toBe('')
  })
  it('title/relation이 비면 빈 문자열', () => {
    const row = expenseCodec.read(expensePage({ title: '', accountId: '', categoryId: '' }))
    expect(row.title).toBe('')
    expect(row.accountId).toBe('')
    expect(row.categoryId).toBe('')
  })
})

describe('expenseCodec.write', () => {
  it('입력을 Notion properties로 변환한다', () => {
    expect(
      expenseCodec.write({ title: '  스타벅스  ', amount: 5500, date: '2026-06-20', accountId: 'acc-1', categoryId: 'cat-1' })
    ).toEqual({
      '사용처': { title: [{ text: { content: '스타벅스' } }] },
      '금액': { number: 5500 },
      '날짜': { date: { start: '2026-06-20' } },
      '계좌': { relation: [{ id: 'acc-1' }] },
      '카테고리': { relation: [{ id: 'cat-1' }] },
    })
  })
})
