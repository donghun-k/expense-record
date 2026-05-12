import { formatNumber, parseNumber } from '@/lib/utils/number'

describe('formatNumber', () => {
  it('숫자 문자열을 쉼표 포맷으로 변환한다', () => {
    expect(formatNumber('1234567')).toBe('1,234,567')
  })
  it('이미 쉼표가 있는 값도 올바르게 재포맷한다', () => {
    expect(formatNumber('1,234,567')).toBe('1,234,567')
  })
  it('빈 문자열이면 빈 문자열을 반환한다', () => {
    expect(formatNumber('')).toBe('')
  })
  it('숫자가 아닌 문자를 모두 제거한다', () => {
    expect(formatNumber('1a2b3')).toBe('123')
  })
  it('1000 미만은 쉼표 없이 반환한다', () => {
    expect(formatNumber('999')).toBe('999')
  })
})

describe('parseNumber', () => {
  it('쉼표를 제거하고 숫자 문자열을 반환한다', () => {
    expect(parseNumber('1,234,567')).toBe('1234567')
  })
  it('쉼표가 없는 문자열은 그대로 반환한다', () => {
    expect(parseNumber('1234')).toBe('1234')
  })
  it('빈 문자열이면 빈 문자열을 반환한다', () => {
    expect(parseNumber('')).toBe('')
  })
})

describe('formatNumber + parseNumber round-trip', () => {
  it('포맷 후 파싱하면 원래 숫자 문자열로 복원된다', () => {
    expect(parseNumber(formatNumber('1234567'))).toBe('1234567')
  })
})
