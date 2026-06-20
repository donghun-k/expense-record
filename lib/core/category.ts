import type { CategoryRepository } from '@/lib/repositories/category'
import type { ExpenseRepository } from '@/lib/repositories/expense'
import type { BudgetRepository } from '@/lib/repositories/budget'

/**
 * 카테고리 삭제 참조 무결성 가드 + 예산 cascade(순수, repository 주입).
 * 참조 지출이 있으면 거부하고, 없으면 연결된 예산을 먼저 cascade 삭제한 뒤
 * 카테고리를 삭제한다. cascade가 실패하면 카테고리는 남겨 두고 거부 메시지를 반환한다.
 * 검사 순서·한글 메시지는 동작 계약이다.
 */
export async function deleteCategory(
  categoryRepo: CategoryRepository,
  expenseRepo: ExpenseRepository,
  budgetRepo: BudgetRepository,
  id: string
): Promise<{ success: boolean; message?: string }> {
  if (await expenseRepo.existsByCategory(id)) {
    return { success: false, message: '이 카테고리를 사용하는 지출 기록이 있어 삭제할 수 없습니다.' }
  }

  try {
    await budgetRepo.softDeleteByCategory(id)
  } catch {
    return { success: false, message: '연결된 예산 삭제 중 오류가 발생했습니다. 다시 시도해주세요.' }
  }

  await categoryRepo.softDelete(id)
  return { success: true }
}
