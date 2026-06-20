'use server'

import { revalidatePath } from 'next/cache'
import { notion, DB } from '@/lib/notion'
import { budgetCodec } from '@/lib/notion/budget.codec'
import { categoryCodec } from '@/lib/notion/category.codec'
import type { Budget } from '@/lib/types'

export async function getBudgetsByMonth(yearMonth: string): Promise<Budget[]> {
  const response = await notion.databases.query({
    database_id: DB.BUDGET,
    filter: {
      property: '연월',
      rich_text: { equals: yearMonth },
    },
  })

  return response.results.map((page: any) => budgetCodec.read(page))
}

export async function upsertBudget(
  yearMonth: string,
  categoryId: string,
  amount: number,
  categoryName: string
): Promise<void> {
  if (isNaN(amount) || amount < 0) throw new Error('올바른 예산 금액을 입력해주세요')

  const existing = await notion.databases.query({
    database_id: DB.BUDGET,
    filter: {
      and: [
        { property: '연월', rich_text: { equals: yearMonth } },
        { property: '카테고리', relation: { contains: categoryId } },
      ],
    },
  })

  if (existing.results.length > 0) {
    await notion.pages.update({
      page_id: existing.results[0].id,
      properties: {
        '예산금액': { number: amount },
      },
    })
  } else {
    await notion.pages.create({
      parent: { database_id: DB.BUDGET },
      properties: budgetCodec.write({ yearMonth, categoryId, amount, categoryName }),
    })
  }

  revalidatePath('/settings')
  revalidatePath('/')
}

export async function copyBudgetFromPreviousMonth(
  targetYearMonth: string,
  sourceYearMonth: string
): Promise<boolean> {
  const sourceBudgets = await getBudgetsByMonth(sourceYearMonth)
  if (sourceBudgets.length === 0) return false

  await Promise.all(
    sourceBudgets.map(async (b) => {
      const categoryPage = await notion.pages.retrieve({ page_id: b.categoryId })
      const categoryName = categoryCodec.read(categoryPage).name
      await upsertBudget(targetYearMonth, b.categoryId, b.amount, categoryName)
    })
  )

  return true
}
