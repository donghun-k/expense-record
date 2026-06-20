import type { ExpenseRow } from '@/lib/types'

/**
 * 지출(Expense) codec — Notion 페이지 ↔ 도메인 양방향 변환.
 * read는 페이지에 보이는 필드만(ExpenseRow) 반환한다. 계좌명/카테고리명은
 * 페이지에 없으므로 별도 이름 hydration join으로 채운다.
 */
export const expenseCodec = {
  /** decode: Notion 페이지 → ExpenseRow (이름 제외) */
  read(page: any): ExpenseRow {
    return {
      id: page.id,
      title: page.properties['사용처'].title[0]?.plain_text ?? '',
      amount: page.properties['금액'].number ?? 0,
      date: page.properties['날짜'].date?.start ?? '',
      accountId: page.properties['계좌'].relation[0]?.id ?? '',
      categoryId: page.properties['카테고리'].relation[0]?.id ?? '',
    }
  },

  /** encode: 입력 → Notion properties (create/update 공용) */
  write(input: { title: string; amount: number; date: string; accountId: string; categoryId: string }) {
    return {
      '사용처': { title: [{ text: { content: input.title.trim() } }] },
      '금액': { number: input.amount },
      '날짜': { date: { start: input.date } },
      '계좌': { relation: [{ id: input.accountId }] },
      '카테고리': { relation: [{ id: input.categoryId }] },
    }
  },
}
