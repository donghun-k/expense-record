'use server'

import { revalidatePath } from 'next/cache'
import { accountRepo } from '@/lib/repositories/account'
import { categoryRepo } from '@/lib/repositories/category'
import { expenseRepo } from '@/lib/repositories/expense'
import { deleteAccount as deleteAccountCore } from '@/lib/core/account'
import type { Account } from '@/lib/types'

export async function getAccounts(): Promise<Account[]> {
  return accountRepo.list()
}

export async function createAccount(name: string): Promise<void> {
  if (!name.trim()) throw new Error('계좌명을 입력해주세요')

  await accountRepo.create({ name })
  revalidatePath('/settings')
}

export async function updateAccount(id: string, name: string): Promise<void> {
  if (!name.trim()) throw new Error('계좌명을 입력해주세요')

  await accountRepo.update(id, { name })
  revalidatePath('/settings')
}

export async function deleteAccount(id: string): Promise<{ success: boolean; message?: string }> {
  const result = await deleteAccountCore(accountRepo, categoryRepo, expenseRepo, id)
  if (result.success) revalidatePath('/settings')
  return result
}
