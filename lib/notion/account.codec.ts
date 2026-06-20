import type { Account } from '@/lib/types'

/**
 * 계좌(Account) codec — Notion 페이지 형태와 도메인 객체 사이의 양방향 변환.
 * 한글 property 이름과 Notion 형태(.title[0]?.plain_text 등)를 아는 유일한 곳.
 */
export const accountCodec = {
  /** decode: Notion 페이지 → Account */
  read(page: any): Account {
    return {
      id: page.id,
      name: page.properties['계좌명'].title[0]?.plain_text ?? '',
    }
  },

  /** encode: 입력 → Notion properties (create/update 공용) */
  write(input: { name: string }) {
    return {
      '계좌명': { title: [{ text: { content: input.name.trim() } }] },
    }
  },
}
