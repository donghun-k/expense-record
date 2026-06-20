'use server'

import { revalidatePath } from 'next/cache'
import { expenseRepo, PartialDeletionError } from '@/lib/repositories/expense'
import { accountRepo } from '@/lib/repositories/account'
import { categoryRepo } from '@/lib/repositories/category'
import {
  countPastExpenses as countPastExpensesCore,
  deletePastExpenses as deletePastExpensesCore,
  listExpensesByMonth as listExpensesByMonthCore,
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
  return listExpensesByMonthCore(expenseRepo, accountRepo, categoryRepo, yearMonth)
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
