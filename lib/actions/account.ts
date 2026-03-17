'use server'

import { revalidatePath } from 'next/cache'
import { notion, DB } from '@/lib/notion'
import type { Account } from '@/lib/types'

export async function getAccounts(): Promise<Account[]> {
  const response = await (notion.databases as any).query({
    database_id: DB.ACCOUNT,
    sorts: [{ property: '계좌명', direction: 'ascending' }],
  })

  return response.results.map((page: any) => ({
    id: page.id,
    name: page.properties['계좌명'].title[0]?.plain_text ?? '',
  }))
}

export async function createAccount(name: string): Promise<void> {
  if (!name.trim()) throw new Error('계좌명을 입력해주세요')

  await notion.pages.create({
    parent: { database_id: DB.ACCOUNT },
    properties: {
      '계좌명': { title: [{ text: { content: name.trim() } }] },
    },
  })
  revalidatePath('/settings')
}

export async function updateAccount(id: string, name: string): Promise<void> {
  if (!name.trim()) throw new Error('계좌명을 입력해주세요')

  await notion.pages.update({
    page_id: id,
    properties: {
      '계좌명': { title: [{ text: { content: name.trim() } }] },
    },
  })
  revalidatePath('/settings')
}

export async function deleteAccount(id: string): Promise<{ success: boolean; message?: string }> {
  // 참조 카테고리 확인
  const categories = await (notion.databases as any).query({
    database_id: DB.CATEGORY,
    filter: { property: '계좌', relation: { contains: id } },
  })
  if (categories.results.length > 0) {
    return { success: false, message: '이 계좌를 사용하는 카테고리가 있어 삭제할 수 없습니다.' }
  }

  // 참조 지출기록 확인
  const expenses = await (notion.databases as any).query({
    database_id: DB.EXPENSE,
    filter: { property: '계좌', relation: { contains: id } },
  })
  if (expenses.results.length > 0) {
    return { success: false, message: '이 계좌를 사용하는 지출 기록이 있어 삭제할 수 없습니다.' }
  }

  await notion.pages.update({ page_id: id, in_trash: true })
  revalidatePath('/settings')
  return { success: true }
}
