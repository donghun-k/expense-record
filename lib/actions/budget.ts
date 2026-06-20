'use server'

import { revalidatePath } from 'next/cache'
import { notion } from '@/lib/notion'
import { categoryCodec } from '@/lib/notion/category.codec'
import { budgetRepo } from '@/lib/repositories/budget'
import { upsertBudget as upsertBudgetCore } from '@/lib/core/budget'
import type { Budget } from '@/lib/types'

export async function getBudgetsByMonth(yearMonth: string): Promise<Budget[]> {
  return budgetRepo.listByMonth(yearMonth)
}

export async function upsertBudget(
  yearMonth: string,
  categoryId: string,
  amount: number,
  categoryName: string
): Promise<void> {
  await upsertBudgetCore(budgetRepo, { yearMonth, categoryId, amount, categoryName })
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
