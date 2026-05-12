export function formatNumber(value: string): string {
  const num = value.replace(/[^0-9]/g, '')
  if (!num) return ''
  return parseInt(num, 10).toLocaleString()
}

export function parseNumber(formatted: string): string {
  return formatted.replace(/,/g, '')
}
