import type { BudgetRepository } from '@/lib/repositories/budget'
import type { CategoryRepository } from '@/lib/repositories/category'

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

/**
 * 이전 달 예산을 대상 달로 복사한다. 카테고리명은 categoryRepo로 한 번에 조회
 * (기존 per-category retrieve N+1 제거). 복사할 예산이 없으면 false.
 */
export async function copyBudgetFromPreviousMonth(
  budgetRepo: BudgetRepository,
  categoryRepo: CategoryRepository,
  targetYearMonth: string,
  sourceYearMonth: string
): Promise<boolean> {
  const sourceBudgets = await budgetRepo.listByMonth(sourceYearMonth)
  if (sourceBudgets.length === 0) return false

  const nameById = new Map((await categoryRepo.list()).map((c) => [c.id, c.name]))

  await Promise.all(
    sourceBudgets.map((b) =>
      upsertBudget(budgetRepo, {
        yearMonth: targetYearMonth,
        categoryId: b.categoryId,
        amount: b.amount,
        categoryName: nameById.get(b.categoryId) ?? '',
      })
    )
  )

  return true
}
