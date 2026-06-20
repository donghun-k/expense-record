/**
 * @jest-environment node
 */
import { createNotionCategoryRepository } from '@/lib/repositories/category'

function mockClient() {
  return {
    databases: { query: jest.fn() },
    pages: { create: jest.fn(), update: jest.fn() },
  }
}

const categoryPage = {
  id: 'cat-1',
  properties: {
    '카테고리명': { title: [{ plain_text: '식비' }] },
    '계좌': { relation: [{ id: 'acc-1' }] },
    '고정여부': { checkbox: false },
  },
}

describe('NotionCategoryRepository (adapter 배선)', () => {
  it('list()는 filter 없이 정렬만 적용한다', async () => {
    const client = mockClient()
    client.databases.query.mockResolvedValueOnce({ results: [categoryPage] })
    const repo = createNotionCategoryRepository(client as any, 'CATEGORY_DB')

    expect(await repo.list()).toEqual([{ id: 'cat-1', name: '식비', accountId: 'acc-1', isFixed: false }])
    expect(client.databases.query).toHaveBeenCalledWith({
      database_id: 'CATEGORY_DB',
      sorts: [{ property: '카테고리명', direction: 'ascending' }],
    })
  })

  it('list(accountId)는 계좌 relation filter를 적용한다', async () => {
    const client = mockClient()
    client.databases.query.mockResolvedValueOnce({ results: [] })
    const repo = createNotionCategoryRepository(client as any, 'CATEGORY_DB')

    await repo.list('acc-1')
    expect(client.databases.query).toHaveBeenCalledWith({
      database_id: 'CATEGORY_DB',
      filter: { property: '계좌', relation: { contains: 'acc-1' } },
      sorts: [{ property: '카테고리명', direction: 'ascending' }],
    })
  })

  it('create는 codec.write properties로 만든다', async () => {
    const client = mockClient()
    const repo = createNotionCategoryRepository(client as any, 'CATEGORY_DB')

    await repo.create({ name: '식비', accountId: 'acc-1', isFixed: true })
    expect(client.pages.create).toHaveBeenCalledWith({
      parent: { database_id: 'CATEGORY_DB' },
      properties: {
        '카테고리명': { title: [{ text: { content: '식비' } }] },
        '계좌': { relation: [{ id: 'acc-1' }] },
        '고정여부': { checkbox: true },
      },
    })
  })
})
