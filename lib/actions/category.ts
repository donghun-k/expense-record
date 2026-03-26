'use server'

import { revalidatePath } from 'next/cache'
import { notion, DB } from '@/lib/notion'
import type { Category } from '@/lib/types'

export async function getCategories(accountId?: string): Promise<Category[]> {
  const filter = accountId
    ? { property: '계좌', relation: { contains: accountId } }
    : undefined

  const response = await notion.databases.query({
    database_id: DB.CATEGORY,
    ...(filter ? { filter } : {}),
    sorts: [{ property: '카테고리명', direction: 'ascending' }],
  })

  return response.results.map((page: any) => ({
    id: page.id,
    name: page.properties['카테고리명'].title[0]?.plain_text ?? '',
    accountId: page.properties['계좌'].relation[0]?.id ?? '',
    isFixed: page.properties['고정여부']?.checkbox ?? false,
  }))
}

export async function createCategory(name: string, accountId: string, isFixed: boolean = false): Promise<void> {
  if (!name.trim()) throw new Error('카테고리명을 입력해주세요')
  if (!accountId) throw new Error('계좌를 선택해주세요')

  await notion.pages.create({
    parent: { database_id: DB.CATEGORY },
    properties: {
      '카테고리명': { title: [{ text: { content: name.trim() } }] },
      '계좌': { relation: [{ id: accountId }] },
      '고정여부': { checkbox: isFixed },
    },
  })
  revalidatePath('/settings')
  revalidatePath('/')
}

export async function updateCategory(id: string, name: string, accountId: string, isFixed: boolean = false): Promise<void> {
  if (!name.trim()) throw new Error('카테고리명을 입력해주세요')

  await notion.pages.update({
    page_id: id,
    properties: {
      '카테고리명': { title: [{ text: { content: name.trim() } }] },
      '계좌': { relation: [{ id: accountId }] },
      '고정여부': { checkbox: isFixed },
    },
  })
  revalidatePath('/settings')
  revalidatePath('/')
}

export async function deleteCategory(id: string): Promise<{ success: boolean; message?: string }> {
  // 참조 지출기록 확인
  const expenses = await notion.databases.query({
    database_id: DB.EXPENSE,
    filter: { property: '카테고리', relation: { contains: id } },
  })
  if (expenses.results.length > 0) {
    return { success: false, message: '이 카테고리를 사용하는 지출 기록이 있어 삭제할 수 없습니다.' }
  }

  // 참조 예산 확인
  const budgets = await notion.databases.query({
    database_id: DB.BUDGET,
    filter: { property: '카테고리', relation: { contains: id } },
  })
  if (budgets.results.length > 0) {
    return { success: false, message: '이 카테고리를 사용하는 예산이 있어 삭제할 수 없습니다.' }
  }

  await notion.pages.update({ page_id: id, in_trash: true })
  revalidatePath('/settings')
  return { success: true }
}
