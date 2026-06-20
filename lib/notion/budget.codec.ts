import type { Budget } from '@/lib/types'

/**
 * 예산(Budget) codec — Notion 페이지 ↔ Budget 양방향 변환.
 * write는 신규 페이지용 full properties만 책임진다.
 * 예산금액만 바꾸는 부분 update는 upsert 고유 로직이라 action에 남는다.
 */
export const budgetCodec = {
  /** decode: Notion 페이지 → Budget */
  read(page: any): Budget {
    return {
      id: page.id,
      yearMonth: page.properties['연월'].rich_text[0]?.plain_text ?? '',
      amount: page.properties['예산금액'].number ?? 0,
      categoryId: page.properties['카테고리'].relation[0]?.id ?? '',
    }
  },

  /** encode: 입력 → Notion properties (create용 full) */
  write(input: { yearMonth: string; categoryId: string; amount: number; categoryName: string }) {
    return {
      '이름': { title: [{ text: { content: `${input.yearMonth} ${input.categoryName}` } }] },
      '연월': { rich_text: [{ text: { content: input.yearMonth } }] },
      '예산금액': { number: input.amount },
      '카테고리': { relation: [{ id: input.categoryId }] },
    }
  },

  /** encode: 예산금액만 갱신하는 부분 properties (upsert의 update 경로용) */
  writeAmount(amount: number) {
    return {
      '예산금액': { number: amount },
    }
  },
}
