/**
 * @jest-environment node
 */
import { createNotionBudgetRepository } from '@/lib/repositories/budget'

function mockClient() {
  return {
    databases: { query: jest.fn() },
    pages: { create: jest.fn(), update: jest.fn() },
  }
}

const budgetPage = {
  id: 'bud-1',
  properties: {
    '연월': { rich_text: [{ plain_text: '2026-06' }] },
    '예산금액': { number: 50000 },
    '카테고리': { relation: [{ id: 'cat-1' }] },
  },
}

describe('NotionBudgetRepository (adapter 배선)', () => {
  it('listByMonth는 연월 filter로 조회하고 codec.read로 매핑한다', async () => {
    const client = mockClient()
    client.databases.query.mockResolvedValueOnce({ results: [budgetPage] })
    const repo = createNotionBudgetRepository(client as any, 'BUDGET_DB')

    expect(await repo.listByMonth('2026-06')).toEqual([
      { id: 'bud-1', yearMonth: '2026-06', amount: 50000, categoryId: 'cat-1' },
    ])
    expect(client.databases.query).toHaveBeenCalledWith({
      database_id: 'BUDGET_DB',
      filter: { property: '연월', rich_text: { equals: '2026-06' } },
    })
  })

  it('findByMonthAndCategory는 결과가 없으면 null', async () => {
    const client = mockClient()
    client.databases.query.mockResolvedValueOnce({ results: [] })
    const repo = createNotionBudgetRepository(client as any, 'BUDGET_DB')

    expect(await repo.findByMonthAndCategory('2026-06', 'cat-1')).toBeNull()
  })

  it('findByMonthAndCategory는 첫 결과를 Budget으로 반환한다', async () => {
    const client = mockClient()
    client.databases.query.mockResolvedValueOnce({ results: [budgetPage] })
    const repo = createNotionBudgetRepository(client as any, 'BUDGET_DB')

    expect(await repo.findByMonthAndCategory('2026-06', 'cat-1')).toMatchObject({ id: 'bud-1', amount: 50000 })
  })

  it('updateAmount는 예산금액 부분 properties로 갱신한다', async () => {
    const client = mockClient()
    const repo = createNotionBudgetRepository(client as any, 'BUDGET_DB')

    await repo.updateAmount('bud-1', 70000)
    expect(client.pages.update).toHaveBeenCalledWith({
      page_id: 'bud-1',
      properties: { '예산금액': { number: 70000 } },
    })
  })
})
