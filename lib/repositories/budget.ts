import { notion, DB } from '@/lib/notion'
import { budgetCodec } from '@/lib/notion/budget.codec'
import type { Budget } from '@/lib/types'

/**
 * 예산 저장/조회 port. filter(연월/카테고리)와 codec 호출을 흡수한다.
 */
export interface BudgetRepository {
  listByMonth(yearMonth: string): Promise<Budget[]>
  findByMonthAndCategory(yearMonth: string, categoryId: string): Promise<Budget | null>
  create(input: { yearMonth: string; categoryId: string; amount: number; categoryName: string }): Promise<void>
  updateAmount(id: string, amount: number): Promise<void>
  /**
   * 카테고리 삭제 cascade(core/category): 이 카테고리를 참조하는 예산을 전부 삭제한다.
   * pagination으로 전체 수집 후 병렬 삭제. 하나라도 실패하면 throw(core가 catch).
   */
  softDeleteByCategory(categoryId: string): Promise<void>
}

export function createNotionBudgetRepository(
  client: typeof notion = notion,
  dbId: string = DB.BUDGET
): BudgetRepository {
  return {
    async listByMonth(yearMonth) {
      const res = await client.databases.query({
        database_id: dbId,
        filter: { property: '연월', rich_text: { equals: yearMonth } },
      })
      return res.results.map((page: any) => budgetCodec.read(page))
    },
    async findByMonthAndCategory(yearMonth, categoryId) {
      const res = await client.databases.query({
        database_id: dbId,
        filter: {
          and: [
            { property: '연월', rich_text: { equals: yearMonth } },
            { property: '카테고리', relation: { contains: categoryId } },
          ],
        },
      })
      const page = res.results[0]
      return page ? budgetCodec.read(page) : null
    },
    async create(input) {
      await client.pages.create({
        parent: { database_id: dbId },
        properties: budgetCodec.write(input),
      })
    },
    async updateAmount(id, amount) {
      await client.pages.update({
        page_id: id,
        properties: budgetCodec.writeAmount(amount),
      })
    },
    async softDeleteByCategory(categoryId) {
      const ids: string[] = []
      let cursor: string | undefined = undefined
      do {
        const res: any = await client.databases.query({
          database_id: dbId,
          filter: { property: '카테고리', relation: { contains: categoryId } },
          start_cursor: cursor,
          page_size: 100,
        })
        ids.push(...res.results.map((b: any) => b.id))
        cursor = res.has_more ? res.next_cursor ?? undefined : undefined
      } while (cursor)

      await Promise.all(ids.map((id) => client.pages.update({ page_id: id, in_trash: true })))
    },
  }
}

export const budgetRepo = createNotionBudgetRepository()
