import type { BudgetRepository } from '@/lib/repositories/budget'

/**
 * 예산 upsert 오케스트레이션 (순수, repository 주입).
 * 같은 연월+카테고리가 있으면 금액만 갱신, 없으면 새로 만든다.
 */
export async function upsertBudget(
  repo: BudgetRepository,
  input: { yearMonth: string; categoryId: string; amount: number; categoryName: string }
): Promise<void> {
  if (isNaN(input.amount) || input.amount < 0) throw new Error('올바른 예산 금액을 입력해주세요')

  const existing = await repo.findByMonthAndCategory(input.yearMonth, input.categoryId)
  if (existing) {
    await repo.updateAmount(existing.id, input.amount)
  } else {
    await repo.create(input)
  }
}
