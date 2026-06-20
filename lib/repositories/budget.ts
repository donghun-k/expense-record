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
  }
}

export const budgetRepo = createNotionBudgetRepository()
