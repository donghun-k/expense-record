'use server'

import { revalidatePath } from 'next/cache'
import { notion, DB } from '@/lib/notion'
import type { Budget } from '@/lib/types'

export async function getBudgetsByMonth(yearMonth: string): Promise<Budget[]> {
  const response = await (notion.databases as any).query({
    database_id: DB.BUDGET,
    filter: {
      property: '연월',
      rich_text: { equals: yearMonth },
    },
  })

  return response.results.map((page: any) => ({
    id: page.id,
    yearMonth: page.properties['연월'].rich_text[0]?.plain_text ?? '',
    amount: page.properties['예산금액'].number ?? 0,
    categoryId: page.properties['카테고리'].relation[0]?.id ?? '',
  }))
}

export async function upsertBudget(
  yearMonth: string,
  categoryId: string,
  amount: number,
  categoryName: string
): Promise<void> {
  if (isNaN(amount) || amount < 0) throw new Error('올바른 예산 금액을 입력해주세요')

  const existing = await (notion.databases as any).query({
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
      properties: {
        '이름': { title: [{ text: { content: `${yearMonth} ${categoryName}` } }] },
        '연월': { rich_text: [{ text: { content: yearMonth } }] },
        '예산금액': { number: amount },
        '카테고리': { relation: [{ id: categoryId }] },
      },
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
      const categoryPage = await notion.pages.retrieve({ page_id: b.categoryId }) as any
      const categoryName = categoryPage.properties['카테고리명'].title[0]?.plain_text ?? ''
      await upsertBudget(targetYearMonth, b.categoryId, b.amount, categoryName)
    })
  )

  return true
}
