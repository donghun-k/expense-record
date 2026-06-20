'use server'

import { revalidatePath } from 'next/cache'
import { budgetRepo } from '@/lib/repositories/budget'
import { categoryRepo } from '@/lib/repositories/category'
import {
  upsertBudget as upsertBudgetCore,
  copyBudgetFromPreviousMonth as copyBudgetCore,
} from '@/lib/core/budget'
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
  const copied = await copyBudgetCore(budgetRepo, categoryRepo, targetYearMonth, sourceYearMonth)
  if (copied) {
    revalidatePath('/settings')
    revalidatePath('/')
  }
  return copied
}
