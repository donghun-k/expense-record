import { notion, DB } from '@/lib/notion'
import { expenseCodec } from '@/lib/notion/expense.codec'

type ExpenseInput = {
  title: string
  amount: number
  date: string
  accountId: string
  categoryId: string
}

/** softDeleteBefore 도중 일부만 삭제되고 실패했을 때, 진행 카운트를 실어 던지는 에러. */
export class PartialDeletionError extends Error {
  constructor(public readonly deletedCount: number) {
    super(`partial deletion failed after ${deletedCount}`)
    this.name = 'PartialDeletionError'
  }
}

/**
 * 지출 저장/조회 port. pagination·rate-limit을 메서드 뒤로 흡수한다.
 * (listByDateRange/이름 hydration은 후보 5.)
 */
export interface ExpenseRepository {
  create(input: ExpenseInput): Promise<void>
  update(id: string, input: ExpenseInput): Promise<void>
  softDelete(id: string): Promise<void>
  countBefore(date: string): Promise<number>
  softDeleteBefore(date: string): Promise<{ deletedCount: number }>
}

export function createNotionExpenseRepository(
  client: typeof notion = notion,
  dbId: string = DB.EXPENSE
): ExpenseRepository {
  return {
    async create(input) {
      await client.pages.create({
        parent: { database_id: dbId },
        properties: expenseCodec.write(input),
      })
    },
    async update(id, input) {
      await client.pages.update({ page_id: id, properties: expenseCodec.write(input) })
    },
    async softDelete(id) {
      await client.pages.update({ page_id: id, in_trash: true })
    },
    async countBefore(date) {
      let count = 0
      let cursor: string | undefined = undefined
      do {
        const res: any = await client.databases.query({
          database_id: dbId,
          filter: { property: '날짜', date: { before: date } },
          start_cursor: cursor,
          page_size: 100,
        })
        count += res.results.length
        cursor = res.has_more ? res.next_cursor ?? undefined : undefined
      } while (cursor)
      return count
    },
    async softDeleteBefore(date) {
      const ids: string[] = []
      let cursor: string | undefined = undefined
      do {
        const res: any = await client.databases.query({
          database_id: dbId,
          filter: { property: '날짜', date: { before: date } },
          start_cursor: cursor,
          page_size: 100,
        })
        ids.push(...res.results.map((p: any) => p.id))
        cursor = res.has_more ? res.next_cursor ?? undefined : undefined
      } while (cursor)

      let deletedCount = 0
      try {
        for (const id of ids) {
          await client.pages.update({ page_id: id, in_trash: true })
          deletedCount++
          // Notion rate limit 방지 (~3 req/s)
          if (deletedCount < ids.length) await new Promise((r) => setTimeout(r, 350))
        }
      } catch {
        throw new PartialDeletionError(deletedCount)
      }
      return { deletedCount }
    },
  }
}

export const expenseRepo = createNotionExpenseRepository()
