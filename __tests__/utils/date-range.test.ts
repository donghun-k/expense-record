import { getMonthDateRange, getCurrentYearMonth } from '@/lib/utils/date-range'

describe('getMonthDateRange', () => {
  it('기본 케이스: 4월 → 04-25 ~ 05-24', () => {
    const result = getMonthDateRange('2026-04')
    expect(result).toEqual({ start: '2026-04-25', end: '2026-05-24' })
  })

  it('12월 → 연도 넘김: 12-25 ~ 01-24', () => {
    const result = getMonthDateRange('2026-12')
    expect(result).toEqual({ start: '2026-12-25', end: '2027-01-24' })
  })

  it('1월 → 01-25 ~ 02-24', () => {
    const result = getMonthDateRange('2026-01')
    expect(result).toEqual({ start: '2026-01-25', end: '2026-02-24' })
  })

  it('잘못된 형식이면 에러', () => {
    expect(() => getMonthDateRange('2026-4')).toThrow('잘못된 연월 형식입니다')
    expect(() => getMonthDateRange('202604')).toThrow('잘못된 연월 형식입니다')
  })
})

describe('getCurrentYearMonth', () => {
  it('25일 이후면 해당 월 반환', () => {
    // 4월 25일 → "2026-04" (4/25~5/24 기간)
    expect(getCurrentYearMonth(new Date(2026, 3, 25))).toBe('2026-04')
    expect(getCurrentYearMonth(new Date(2026, 3, 30))).toBe('2026-04')
  })

  it('24일 이전이면 이전 월 반환', () => {
    // 4월 24일 → "2026-03" (3/25~4/24 기간)
    expect(getCurrentYearMonth(new Date(2026, 3, 24))).toBe('2026-03')
    expect(getCurrentYearMonth(new Date(2026, 3, 1))).toBe('2026-03')
  })

  it('1월 24일 이전이면 전년 12월 반환', () => {
    // 1월 10일 → "2025-12" (12/25~1/24 기간)
    expect(getCurrentYearMonth(new Date(2026, 0, 10))).toBe('2025-12')
  })

  it('12월 25일 이후면 12월 반환', () => {
    expect(getCurrentYearMonth(new Date(2026, 11, 25))).toBe('2026-12')
  })
})
