'use server'

import { revalidatePath } from 'next/cache'
import { categoryRepo } from '@/lib/repositories/category'
import { expenseRepo } from '@/lib/repositories/expense'
import { budgetRepo } from '@/lib/repositories/budget'
import { deleteCategory as deleteCategoryCore } from '@/lib/core/category'
import type { Category } from '@/lib/types'

export async function getCategories(accountId?: string): Promise<Category[]> {
  return categoryRepo.list(accountId)
}

export async function createCategory(name: string, accountId: string, isFixed: boolean = false): Promise<void> {
  if (!name.trim()) throw new Error('카테고리명을 입력해주세요')
  if (!accountId) throw new Error('계좌를 선택해주세요')

  await categoryRepo.create({ name, accountId, isFixed })
  revalidatePath('/settings')
  revalidatePath('/')
}

export async function updateCategory(id: string, name: string, accountId: string, isFixed: boolean = false): Promise<void> {
  if (!name.trim()) throw new Error('카테고리명을 입력해주세요')

  await categoryRepo.update(id, { name, accountId, isFixed })
  revalidatePath('/settings')
  revalidatePath('/')
}

export async function deleteCategory(id: string): Promise<{ success: boolean; message?: string }> {
  const result = await deleteCategoryCore(categoryRepo, expenseRepo, budgetRepo, id)
  if (result.success) {
    revalidatePath('/settings')
    revalidatePath('/')
  }
  return result
}
