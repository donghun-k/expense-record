import { getMonthDateRange } from '@/lib/utils/date-range'

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
