import type { Category } from '@/lib/types'

/**
 * 카테고리(Category) codec — Notion 페이지 ↔ Category 양방향 변환.
 */
export const categoryCodec = {
  /** decode: Notion 페이지 → Category */
  read(page: any): Category {
    return {
      id: page.id,
      name: page.properties['카테고리명'].title[0]?.plain_text ?? '',
      accountId: page.properties['계좌'].relation[0]?.id ?? '',
      isFixed: page.properties['고정여부']?.checkbox ?? false,
    }
  },

  /** encode: 입력 → Notion properties (create/update 공용) */
  write(input: { name: string; accountId: string; isFixed: boolean }) {
    return {
      '카테고리명': { title: [{ text: { content: input.name.trim() } }] },
      '계좌': { relation: [{ id: input.accountId }] },
      '고정여부': { checkbox: input.isFixed },
    }
  },
}
