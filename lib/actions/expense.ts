'use server'

import { revalidatePath } from 'next/cache'
import { notion, DB } from '@/lib/notion'
import { expenseCodec } from '@/lib/notion/expense.codec'
import { accountCodec } from '@/lib/notion/account.codec'
import { categoryCodec } from '@/lib/notion/category.codec'
import { getMonthDateRange } from '@/lib/utils/date-range'
import { expenseRepo, PartialDeletionError } from '@/lib/repositories/expense'
import {
  countPastExpenses as countPastExpensesCore,
  deletePastExpenses as deletePastExpensesCore,
} from '@/lib/core/expense'
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

  await expenseRepo.create(data)
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

  await expenseRepo.update(id, data)
  revalidatePath('/history')
  revalidatePath('/')
}

export async function deleteExpense(id: string): Promise<void> {
  if (!id) throw new Error('항목을 찾을 수 없습니다')
  await expenseRepo.softDelete(id)
  revalidatePath('/history')
  revalidatePath('/')
}

export async function countPastExpenses(): Promise<number> {
  return countPastExpensesCore(expenseRepo, new Date())
}

export async function deletePastExpenses(): Promise<{ deletedCount: number }> {
  try {
    return await deletePastExpensesCore(expenseRepo, new Date())
  } catch (e) {
    const count = e instanceof PartialDeletionError ? e.deletedCount : 0
    throw new Error(`${count}건 삭제 후 오류가 발생했습니다. 다시 시도해주세요.`)
  } finally {
    revalidatePath('/')
    revalidatePath('/history')
  }
}
