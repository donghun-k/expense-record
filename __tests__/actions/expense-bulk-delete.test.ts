/**
 * @jest-environment node
 */
import { countPastExpenses, deletePastExpenses } from '@/lib/actions/expense'
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
const mockedUpdate = notion.pages.update as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  // rate-limit sleep을 즉시 실행되도록 대체
  jest.spyOn(global, 'setTimeout').mockImplementation((fn: TimerHandler) => {
    if (typeof fn === 'function') fn()
    return 0 as unknown as ReturnType<typeof setTimeout>
  })
})

afterEach(() => {
  jest.restoreAllMocks()
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

describe('deletePastExpenses', () => {
  it('대상 페이지를 모두 in_trash 처리하고 삭제 건수를 반환한다', async () => {
    mockedQuery.mockResolvedValueOnce({
      results: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
      has_more: false,
      next_cursor: null,
    })
    mockedUpdate.mockResolvedValue({})

    const result = await deletePastExpenses()

    expect(result).toEqual({ deletedCount: 3 })
    expect(mockedUpdate).toHaveBeenCalledTimes(3)
    expect(mockedUpdate).toHaveBeenNthCalledWith(1, { page_id: 'p1', in_trash: true })
    expect(mockedUpdate).toHaveBeenNthCalledWith(2, { page_id: 'p2', in_trash: true })
    expect(mockedUpdate).toHaveBeenNthCalledWith(3, { page_id: 'p3', in_trash: true })
  })

  it('성공 시 / 와 /history 캐시를 무효화한다', async () => {
    mockedQuery.mockResolvedValueOnce({
      results: [{ id: 'p1' }],
      has_more: false,
      next_cursor: null,
    })
    mockedUpdate.mockResolvedValue({})

    await deletePastExpenses()

    const { revalidatePath } = await import('next/cache')
    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(revalidatePath).toHaveBeenCalledWith('/history')
  })

  it('빈 결과면 0을 반환하고 update를 호출하지 않는다', async () => {
    mockedQuery.mockResolvedValueOnce({
      results: [],
      has_more: false,
      next_cursor: null,
    })

    const result = await deletePastExpenses()

    expect(result).toEqual({ deletedCount: 0 })
    expect(mockedUpdate).not.toHaveBeenCalled()
  })

  it('삭제 중 실패해도 진행 카운트를 포함한 에러를 throw하고 캐시를 무효화한다', async () => {
    mockedQuery.mockResolvedValueOnce({
      results: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
      has_more: false,
      next_cursor: null,
    })
    mockedUpdate
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('rate limit'))

    const { revalidatePath } = await import('next/cache')

    await expect(deletePastExpenses()).rejects.toThrow(/1건 삭제 후 오류가 발생했습니다/)
    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(revalidatePath).toHaveBeenCalledWith('/history')
  })

  it('페이지네이션을 처리하여 모든 ID를 수집 후 삭제한다', async () => {
    mockedQuery
      .mockResolvedValueOnce({
        results: new Array(100).fill(0).map((_, i) => ({ id: `p${i}` })),
        has_more: true,
        next_cursor: 'cursor-1',
      })
      .mockResolvedValueOnce({
        results: [{ id: 'p100' }],
        has_more: false,
        next_cursor: null,
      })
    mockedUpdate.mockResolvedValue({})

    const result = await deletePastExpenses()

    expect(result).toEqual({ deletedCount: 101 })
    expect(mockedUpdate).toHaveBeenCalledTimes(101)
  })
})
