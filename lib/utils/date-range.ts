/**
 * 기준월(YYYY-MM)을 받아 해당 기간의 시작일/종료일을 반환한다.
 * "2026-04" → { start: "2026-04-25", end: "2026-05-24" }
 *
 * 기간 정의: 해당 월 25일 ~ 익월 24일
 */
export function getMonthDateRange(yearMonth: string): { start: string; end: string } {
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) throw new Error('잘못된 연월 형식입니다')

  const [year, month] = yearMonth.split('-').map(Number)

  // 시작일: 해당 월 25일
  const startDay = 25
  const startStr = `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`

  // 종료일: 익월 24일
  const endMonth = month === 12 ? 1 : month + 1
  const endYear = month === 12 ? year + 1 : year
  const endDay = 24
  const endStr = `${endYear}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`

  return { start: startStr, end: endStr }
}
