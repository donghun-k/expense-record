import type { AccountRepository } from '@/lib/repositories/account'
import type { CategoryRepository } from '@/lib/repositories/category'
import type { ExpenseRepository } from '@/lib/repositories/expense'

/**
 * 계좌 삭제 참조 무결성 가드(순수, repository 주입).
 * 이 계좌를 참조하는 카테고리·지출이 하나라도 있으면 거부한다.
 * 검사 순서(카테고리 → 지출)와 한글 거부 메시지는 동작 계약이다.
 */
export async function deleteAccount(
  accountRepo: AccountRepository,
  categoryRepo: CategoryRepository,
  expenseRepo: ExpenseRepository,
  id: string
): Promise<{ success: boolean; message?: string }> {
  if (await categoryRepo.existsByAccount(id)) {
    return { success: false, message: '이 계좌를 사용하는 카테고리가 있어 삭제할 수 없습니다.' }
  }
  if (await expenseRepo.existsByAccount(id)) {
    return { success: false, message: '이 계좌를 사용하는 지출 기록이 있어 삭제할 수 없습니다.' }
  }

  await accountRepo.softDelete(id)
  return { success: true }
}
