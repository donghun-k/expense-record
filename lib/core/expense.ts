import { getMonthDateRange, getCurrentYearMonth } from '@/lib/utils/date-range'
import type { ExpenseRepository } from '@/lib/repositories/expense'
import type { AccountRepository } from '@/lib/repositories/account'
import type { CategoryRepository } from '@/lib/repositories/category'
import type { Expense } from '@/lib/types'

/**
 * 현재 기준월(25일~익월 24일) 시작일 이전의 "지난" 지출 개념을 다루는 오케스트레이션.
 * 기준월 경계 계산이 도메인 로직이고, 실제 조회/삭제는 repository가 흡수한다.
 */
function pastBoundary(now: Date): string {
  const yearMonth = getCurrentYearMonth(now)
  return getMonthDateRange(yearMonth).start
}

export async function countPastExpenses(repo: ExpenseRepository, now: Date): Promise<number> {
  return repo.countBefore(pastBoundary(now))
}

export async function deletePastExpenses(
  repo: ExpenseRepository,
  now: Date
): Promise<{ deletedCount: number }> {
  return repo.softDeleteBefore(pastBoundary(now))
}

/**
 * 기준월 지출을 계좌명/카테고리명까지 채워(hydration) 반환하는 오케스트레이션.
 * 지출(이름 제외)·계좌·카테고리를 각 1회 조회한 뒤 메모리에서 id→name으로 join한다.
 * (기존 per-page pages.retrieve N+1 제거. 정렬은 expenseRepo가 흡수.)
 */
export async function listExpensesByMonth(
  expenseRepo: ExpenseRepository,
  accountRepo: AccountRepository,
  categoryRepo: CategoryRepository,
  yearMonth: string
): Promise<Expense[]> {
  const { start, end } = getMonthDateRange(yearMonth)

  const [rows, accounts, categories] = await Promise.all([
    expenseRepo.listByDateRange(start, end),
    accountRepo.list(),
    categoryRepo.list(),
  ])

  const accountNameById = new Map(accounts.map((a) => [a.id, a.name]))
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]))

  return rows.map((row) => ({
    ...row,
    accountName: accountNameById.get(row.accountId) ?? '',
    categoryName: categoryNameById.get(row.categoryId) ?? '',
  }))
}
