import { notion, DB } from '@/lib/notion'
import { categoryCodec } from '@/lib/notion/category.codec'
import type { Category } from '@/lib/types'

/**
 * 카테고리 저장/조회 port. 계좌 filter·정렬·codec 호출을 흡수한다.
 */
export interface CategoryRepository {
  list(accountId?: string): Promise<Category[]>
  create(input: { name: string; accountId: string; isFixed: boolean }): Promise<void>
  update(id: string, input: { name: string; accountId: string; isFixed: boolean }): Promise<void>
  /** 계좌 삭제 가드(core/account): 이 계좌를 참조하는 카테고리가 하나라도 있나? */
  existsByAccount(accountId: string): Promise<boolean>
}

export function createNotionCategoryRepository(
  client: typeof notion = notion,
  dbId: string = DB.CATEGORY
): CategoryRepository {
  return {
    async list(accountId) {
      const filter = accountId
        ? { property: '계좌', relation: { contains: accountId } }
        : undefined
      const res = await client.databases.query({
        database_id: dbId,
        ...(filter ? { filter } : {}),
        sorts: [{ property: '카테고리명', direction: 'ascending' }],
      })
      return res.results.map((page: any) => categoryCodec.read(page))
    },
    async create(input) {
      await client.pages.create({
        parent: { database_id: dbId },
        properties: categoryCodec.write(input),
      })
    },
    async update(id, input) {
      await client.pages.update({ page_id: id, properties: categoryCodec.write(input) })
    },
    async existsByAccount(accountId) {
      const res = await client.databases.query({
        database_id: dbId,
        filter: { property: '계좌', relation: { contains: accountId } },
        page_size: 1,
      })
      return res.results.length > 0
    },
  }
}

export const categoryRepo = createNotionCategoryRepository()
