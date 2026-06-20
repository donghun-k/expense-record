'use server'

import { revalidatePath } from 'next/cache'
import { notion, DB } from '@/lib/notion'
import { expenseCodec } from '@/lib/notion/expense.codec'
import { accountCodec } from '@/lib/notion/account.codec'
import { categoryCodec } from '@/lib/notion/category.codec'
import { getMonthDateRange, getCurrentYearMonth } from '@/lib/utils/date-range'
import type { Expense } from '@/lib/types'

export async function createExpense(data: {
  title: string
  amount: number
  date: string
  accountId: string
  categoryId: string
}): Promise<void> {
  if (!data.title.trim()) throw new Error('사용처를 입력해주세요')
  if (data.amount <= 0) throw new Error('금액을 입력해주세요')
  if (!data.accountId) throw new Error('계좌를 선택해주세요')
  if (!data.categoryId) throw new Error('카테고리를 선택해주세요')

  await notion.pages.create({
    parent: { database_id: DB.EXPENSE },
    properties: expenseCodec.write(data),
  })
  revalidatePath('/')
  revalidatePath('/history')
}

export async function getExpensesByMonth(yearMonth: string): Promise<Expense[]> {
  const { start: startDate, end: endDate } = getMonthDateRange(yearMonth)

  const response = await notion.databases.query({
    database_id: DB.EXPENSE,
    filter: {
      and: [
        { property: '날짜', date: { on_or_after: startDate } },
        { property: '날짜', date: { on_or_before: endDate } },
      ],
    },
    sorts: [{ property: '날짜', direction: 'descending' }],
  })

  const rows = response.results.map((page: any) => expenseCodec.read(page))

  // 계좌/카테고리명 hydration을 위해 별도 fetch (후보 5에서 N+1 제거 예정)
  const accountIds = [...new Set(rows.map((r) => r.accountId).filter(Boolean))]
  const categoryIds = [...new Set(rows.map((r) => r.categoryId).filter(Boolean))]

  const [accountPages, categoryPages] = await Promise.all([
    Promise.all(accountIds.map((id) => notion.pages.retrieve({ page_id: id }))),
    Promise.all(categoryIds.map((id) => notion.pages.retrieve({ page_id: id }))),
  ])

  const accountMap = Object.fromEntries(accountPages.map((p) => [p.id, accountCodec.read(p).name]))
  const categoryMap = Object.fromEntries(categoryPages.map((p) => [p.id, categoryCodec.read(p).name]))

  return rows.map((row) => ({
    ...row,
    accountName: accountMap[row.accountId] ?? '',
    categoryName: categoryMap[row.categoryId] ?? '',
  }))
}

export async function updateExpense(
  id: string,
  data: { title: string; amount: number; date: string; accountId: string; categoryId: string }
): Promise<void> {
  if (!id) throw new Error('항목을 찾을 수 없습니다')
  if (!data.title.trim()) throw new Error('사용처를 입력해주세요')
  if (data.amount <= 0) throw new Error('금액을 입력해주세요')
  if (!data.accountId) throw new Error('계좌를 선택해주세요')
  if (!data.categoryId) throw new Error('카테고리를 선택해주세요')

  await notion.pages.update({
    page_id: id,
    properties: expenseCodec.write(data),
  })
  revalidatePath('/history')
  revalidatePath('/')
}

export async function deleteExpense(id: string): Promise<void> {
  if (!id) throw new Error('항목을 찾을 수 없습니다')
  await notion.pages.update({ page_id: id, in_trash: true })
  revalidatePath('/history')
  revalidatePath('/')
}

export async function countPastExpenses(): Promise<number> {
  const yearMonth = getCurrentYearMonth()
  const { start } = getMonthDateRange(yearMonth)

  let count = 0
  let cursor: string | undefined = undefined
  do {
    const res: any = await notion.databases.query({
      database_id: DB.EXPENSE,
      filter: { property: '날짜', date: { before: start } },
      start_cursor: cursor,
      page_size: 100,
    })
    count += res.results.length
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined
  } while (cursor)

  return count
}

export async function deletePastExpenses(): Promise<{ deletedCount: number }> {
  const yearMonth = getCurrentYearMonth()
  const { start } = getMonthDateRange(yearMonth)

  const ids: string[] = []
  let cursor: string | undefined = undefined
  do {
    const res: any = await notion.databases.query({
      database_id: DB.EXPENSE,
      filter: { property: '날짜', date: { before: start } },
      start_cursor: cursor,
      page_size: 100,
    })
    ids.push(...res.results.map((p: any) => p.id))
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined
  } while (cursor)

  let deletedCount = 0
  try {
    for (const id of ids) {
      await notion.pages.update({ page_id: id, in_trash: true })
      deletedCount++
      // Notion rate limit 방지 (~3 req/s)
      if (deletedCount < ids.length) await new Promise((r) => setTimeout(r, 350))
    }
  } catch (e) {
    revalidatePath('/')
    revalidatePath('/history')
    throw new Error(`${deletedCount}건 삭제 후 오류가 발생했습니다. 다시 시도해주세요.`)
  }

  revalidatePath('/')
  revalidatePath('/history')
  return { deletedCount }
}
