/**
 * @jest-environment node
 */
import { createNotionExpenseRepository, PartialDeletionError } from '@/lib/repositories/expense'

function mockClient() {
  return {
    databases: { query: jest.fn() },
    pages: { create: jest.fn(), update: jest.fn() },
  }
}

beforeEach(() => {
  // rate-limit sleep을 즉시 실행되도록 대체
  jest.spyOn(global, 'setTimeout').mockImplementation((fn: TimerHandler) => {
    if (typeof fn === 'function') fn()
    return 0 as unknown as ReturnType<typeof setTimeout>
  })
})

afterEach(() => jest.restoreAllMocks())

describe('NotionExpenseRepository.countBefore', () => {
  it('시작일 이전 건수를 반환한다', async () => {
    const client = mockClient()
    client.databases.query.mockResolvedValueOnce({
      results: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
      has_more: false,
      next_cursor: null,
    })
    const repo = createNotionExpenseRepository(client as any, 'EXPENSE_DB')

    expect(await repo.countBefore('2026-05-25')).toBe(3)
    expect(client.databases.query).toHaveBeenCalledWith({
      database_id: 'EXPENSE_DB',
      filter: { property: '날짜', date: { before: '2026-05-25' } },
      start_cursor: undefined,
      page_size: 100,
    })
  })

  it('페이지네이션을 처리한다 (has_more=true)', async () => {
    const client = mockClient()
    client.databases.query
      .mockResolvedValueOnce({ results: new Array(100).fill(0).map((_, i) => ({ id: `p${i}` })), has_more: true, next_cursor: 'c1' })
      .mockResolvedValueOnce({ results: [{ id: 'p100' }, { id: 'p101' }], has_more: false, next_cursor: null })
    const repo = createNotionExpenseRepository(client as any, 'EXPENSE_DB')

    expect(await repo.countBefore('2026-05-25')).toBe(102)
    expect(client.databases.query).toHaveBeenNthCalledWith(2, expect.objectContaining({ start_cursor: 'c1' }))
  })
})

describe('NotionExpenseRepository.softDeleteBefore', () => {
  it('대상 페이지를 모두 in_trash 처리하고 카운트를 반환한다', async () => {
    const client = mockClient()
    client.databases.query.mockResolvedValueOnce({
      results: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
      has_more: false,
      next_cursor: null,
    })
    client.pages.update.mockResolvedValue({})
    const repo = createNotionExpenseRepository(client as any, 'EXPENSE_DB')

    expect(await repo.softDeleteBefore('2026-05-25')).toEqual({ deletedCount: 3 })
    expect(client.pages.update).toHaveBeenNthCalledWith(1, { page_id: 'p1', in_trash: true })
    expect(client.pages.update).toHaveBeenCalledTimes(3)
  })

  it('페이지네이션으로 모든 ID를 수집 후 삭제한다', async () => {
    const client = mockClient()
    client.databases.query
      .mockResolvedValueOnce({ results: new Array(100).fill(0).map((_, i) => ({ id: `p${i}` })), has_more: true, next_cursor: 'c1' })
      .mockResolvedValueOnce({ results: [{ id: 'p100' }], has_more: false, next_cursor: null })
    client.pages.update.mockResolvedValue({})
    const repo = createNotionExpenseRepository(client as any, 'EXPENSE_DB')

    expect(await repo.softDeleteBefore('2026-05-25')).toEqual({ deletedCount: 101 })
    expect(client.pages.update).toHaveBeenCalledTimes(101)
  })

  it('삭제 중 실패하면 진행 카운트를 담아 PartialDeletionError를 던진다', async () => {
    const client = mockClient()
    client.databases.query.mockResolvedValueOnce({
      results: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
      has_more: false,
      next_cursor: null,
    })
    client.pages.update.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('rate limit'))
    const repo = createNotionExpenseRepository(client as any, 'EXPENSE_DB')

    await expect(repo.softDeleteBefore('2026-05-25')).rejects.toMatchObject({
      name: 'PartialDeletionError',
      deletedCount: 1,
    })
  })
})

describe('NotionExpenseRepository CRUD 배선', () => {
  it('create는 codec.write properties로 만든다', async () => {
    const client = mockClient()
    const repo = createNotionExpenseRepository(client as any, 'EXPENSE_DB')
    await repo.create({ title: '스타벅스', amount: 5500, date: '2026-06-20', accountId: 'a', categoryId: 'c' })
    expect(client.pages.create).toHaveBeenCalledWith({
      parent: { database_id: 'EXPENSE_DB' },
      properties: expect.objectContaining({ '사용처': { title: [{ text: { content: '스타벅스' } }] } }),
    })
  })

  it('softDelete는 in_trash로 갱신한다', async () => {
    const client = mockClient()
    const repo = createNotionExpenseRepository(client as any, 'EXPENSE_DB')
    await repo.softDelete('exp-1')
    expect(client.pages.update).toHaveBeenCalledWith({ page_id: 'exp-1', in_trash: true })
  })
})

// PartialDeletionError 자체 계약
describe('PartialDeletionError', () => {
  it('deletedCount를 노출한다', () => {
    expect(new PartialDeletionError(2).deletedCount).toBe(2)
  })
})
