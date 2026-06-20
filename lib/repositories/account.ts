import { notion, DB } from '@/lib/notion'
import { accountCodec } from '@/lib/notion/account.codec'
import type { Account } from '@/lib/types'

/**
 * 계좌 저장/조회 port. NotionAccountRepository(prod)와
 * InMemoryAccountRepository(test, __tests__/fakes/)가 구현한다.
 * 메서드는 실제 호출자가 있는 것만 둔다 — softDelete(삭제 가드)는 후보 3.
 */
export interface AccountRepository {
  list(): Promise<Account[]>
  create(input: { name: string }): Promise<void>
  update(id: string, input: { name: string }): Promise<void>
}

/** Notion adapter. codec을 내부 호출한다. client는 adapter 테스트용으로 주입 가능. */
export function createNotionAccountRepository(
  client: typeof notion = notion,
  dbId: string = DB.ACCOUNT
): AccountRepository {
  return {
    async list() {
      const res = await client.databases.query({
        database_id: dbId,
        sorts: [{ property: '계좌명', direction: 'ascending' }],
      })
      return res.results.map((page: any) => accountCodec.read(page))
    },
    async create(input) {
      await client.pages.create({
        parent: { database_id: dbId },
        properties: accountCodec.write(input),
      })
    },
    async update(id, input) {
      await client.pages.update({
        page_id: id,
        properties: accountCodec.write(input),
      })
    },
  }
}

/** prod 싱글턴 — action이 core/직접 호출에 주입한다. */
export const accountRepo = createNotionAccountRepository()
