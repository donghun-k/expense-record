import { notion, DB } from '@/lib/notion'
import { expenseCodec } from '@/lib/notion/expense.codec'
import type { ExpenseRow } from '@/lib/types'

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
 * 지출 저장/조회 port. pagination·rate-limit·정렬을 메서드 뒤로 흡수한다.
 * 이름(계좌명/카테고리명)은 페이지에 없으므로 repo는 ExpenseRow까지만 — hydration은 core.
 */
export interface ExpenseRepository {
  create(input: ExpenseInput): Promise<void>
  update(id: string, input: ExpenseInput): Promise<void>
  softDelete(id: string): Promise<void>
  /** 기간 내 지출을 날짜 내림차순으로 조회한다(이름 제외). 이름 join은 core/expense. */
  listByDateRange(start: string, end: string): Promise<ExpenseRow[]>
  countBefore(date: string): Promise<number>
  softDeleteBefore(date: string): Promise<{ deletedCount: number }>
  /** 계좌 삭제 가드(core/account): 이 계좌를 참조하는 지출이 하나라도 있나? */
  existsByAccount(accountId: string): Promise<boolean>
  /** 카테고리 삭제 가드(core/category): 이 카테고리를 참조하는 지출이 하나라도 있나? */
  existsByCategory(categoryId: string): Promise<boolean>
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
    async listByDateRange(start, end) {
      const res = await client.databases.query({
        database_id: dbId,
        filter: {
          and: [
            { property: '날짜', date: { on_or_after: start } },
            { property: '날짜', date: { on_or_before: end } },
          ],
        },
        sorts: [{ property: '날짜', direction: 'descending' }],
      })
      return res.results.map((page: any) => expenseCodec.read(page))
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
    async existsByAccount(accountId) {
      const res = await client.databases.query({
        database_id: dbId,
        filter: { property: '계좌', relation: { contains: accountId } },
        page_size: 1,
      })
      return res.results.length > 0
    },
    async existsByCategory(categoryId) {
      const res = await client.databases.query({
        database_id: dbId,
        filter: { property: '카테고리', relation: { contains: categoryId } },
        page_size: 1,
      })
      return res.results.length > 0
    },
  }
}

export const expenseRepo = createNotionExpenseRepository()
