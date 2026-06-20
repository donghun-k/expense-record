/**
 * @jest-environment node
 */
import { createNotionAccountRepository } from '@/lib/repositories/account'
import { createInMemoryAccountRepository } from '../fakes/account-repo'

describe('InMemoryAccountRepository (도메인 계약)', () => {
  it('create 후 list에 trim된 이름으로 나타난다', async () => {
    const repo = createInMemoryAccountRepository()
    await repo.create({ name: '  신한  ' })
    const accounts = await repo.list()
    expect(accounts).toHaveLength(1)
    expect(accounts[0].name).toBe('신한')
  })

  it('list는 이름 오름차순으로 정렬한다', async () => {
    const repo = createInMemoryAccountRepository([
      { id: 'a', name: '국민' },
      { id: 'b', name: '가나' },
    ])
    const names = (await repo.list()).map((a) => a.name)
    expect(names).toEqual(['가나', '국민'])
  })

  it('update는 해당 계좌의 이름을 바꾼다', async () => {
    const repo = createInMemoryAccountRepository([{ id: 'a', name: '구이름' }])
    await repo.update('a', { name: '새이름' })
    expect(repo.store[0].name).toBe('새이름')
  })
})

describe('NotionAccountRepository (adapter 배선)', () => {
  function mockClient() {
    return {
      databases: { query: jest.fn() },
      pages: { create: jest.fn(), update: jest.fn() },
    }
  }

  it('list는 query 결과를 codec.read로 매핑한다', async () => {
    const client = mockClient()
    client.databases.query.mockResolvedValueOnce({
      results: [{ id: 'acc-1', properties: { '계좌명': { title: [{ plain_text: '신한' }] } } }],
    })
    const repo = createNotionAccountRepository(client as any, 'ACCOUNT_DB')

    expect(await repo.list()).toEqual([{ id: 'acc-1', name: '신한' }])
    expect(client.databases.query).toHaveBeenCalledWith({
      database_id: 'ACCOUNT_DB',
      sorts: [{ property: '계좌명', direction: 'ascending' }],
    })
  })

  it('create는 codec.write properties로 페이지를 만든다', async () => {
    const client = mockClient()
    const repo = createNotionAccountRepository(client as any, 'ACCOUNT_DB')

    await repo.create({ name: '  신한  ' })
    expect(client.pages.create).toHaveBeenCalledWith({
      parent: { database_id: 'ACCOUNT_DB' },
      properties: { '계좌명': { title: [{ text: { content: '신한' } }] } },
    })
  })

  it('update는 codec.write properties로 페이지를 갱신한다', async () => {
    const client = mockClient()
    const repo = createNotionAccountRepository(client as any, 'ACCOUNT_DB')

    await repo.update('acc-1', { name: '신한' })
    expect(client.pages.update).toHaveBeenCalledWith({
      page_id: 'acc-1',
      properties: { '계좌명': { title: [{ text: { content: '신한' } }] } },
    })
  })
})
