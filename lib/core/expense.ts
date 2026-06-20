import { getMonthDateRange, getCurrentYearMonth } from '@/lib/utils/date-range'
import type { ExpenseRepository } from '@/lib/repositories/expense'

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
