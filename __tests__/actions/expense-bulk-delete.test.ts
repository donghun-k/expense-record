/**
 * @jest-environment node
 */
import { countPastExpenses } from '@/lib/actions/expense'
import { notion } from '@/lib/notion'

jest.mock('@/lib/notion', () => ({
  notion: {
    databases: { query: jest.fn() },
    pages: { update: jest.fn() },
  },
  DB: { EXPENSE: 'EXPENSE_DB', ACCOUNT: 'A', CATEGORY: 'C', BUDGET: 'B' },
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('@/lib/utils/date-range', () => {
  const actual = jest.requireActual('@/lib/utils/date-range')
  return {
    ...actual,
    getCurrentYearMonth: jest.fn(() => '2026-05'),
  }
})

const mockedQuery = notion.databases.query as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

describe('countPastExpenses', () => {
  it('현재 기간 시작일 이전 지출 수를 반환한다', async () => {
    mockedQuery.mockResolvedValueOnce({
      results: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
      has_more: false,
      next_cursor: null,
    })

    const count = await countPastExpenses()

    expect(count).toBe(3)
    expect(mockedQuery).toHaveBeenCalledWith({
      database_id: 'EXPENSE_DB',
      filter: { property: '날짜', date: { before: '2026-05-25' } },
      start_cursor: undefined,
      page_size: 100,
    })
  })

  it('페이지네이션을 처리한다 (has_more=true)', async () => {
    mockedQuery
      .mockResolvedValueOnce({
        results: new Array(100).fill(0).map((_, i) => ({ id: `p${i}` })),
        has_more: true,
        next_cursor: 'cursor-1',
      })
      .mockResolvedValueOnce({
        results: [{ id: 'p100' }, { id: 'p101' }],
        has_more: false,
        next_cursor: null,
      })

    const count = await countPastExpenses()

    expect(count).toBe(102)
    expect(mockedQuery).toHaveBeenCalledTimes(2)
    expect(mockedQuery).toHaveBeenNthCalledWith(2, expect.objectContaining({
      start_cursor: 'cursor-1',
    }))
  })

  it('데이터가 없으면 0을 반환한다', async () => {
    mockedQuery.mockResolvedValueOnce({
      results: [],
      has_more: false,
      next_cursor: null,
    })

    const count = await countPastExpenses()

    expect(count).toBe(0)
  })
})
