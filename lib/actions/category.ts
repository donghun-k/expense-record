'use server'

import { revalidatePath } from 'next/cache'
import { notion, DB } from '@/lib/notion'
import { categoryCodec } from '@/lib/notion/category.codec'
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

  return response.results.map((page: any) => categoryCodec.read(page))
}

export async function createCategory(name: string, accountId: string, isFixed: boolean = false): Promise<void> {
  if (!name.trim()) throw new Error('카테고리명을 입력해주세요')
  if (!accountId) throw new Error('계좌를 선택해주세요')

  await notion.pages.create({
    parent: { database_id: DB.CATEGORY },
    properties: categoryCodec.write({ name, accountId, isFixed }),
  })
  revalidatePath('/settings')
  revalidatePath('/')
}

export async function updateCategory(id: string, name: string, accountId: string, isFixed: boolean = false): Promise<void> {
  if (!name.trim()) throw new Error('카테고리명을 입력해주세요')

  await notion.pages.update({
    page_id: id,
    properties: categoryCodec.write({ name, accountId, isFixed }),
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

  // 연결된 예산 cascade 삭제 (pagination 처리)
  const budgetIds: string[] = []
  let cursor: string | undefined = undefined
  do {
    const res: any = await notion.databases.query({
      database_id: DB.BUDGET,
      filter: { property: '카테고리', relation: { contains: id } },
      start_cursor: cursor,
      page_size: 100,
    })
    budgetIds.push(...res.results.map((b: any) => b.id))
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined
  } while (cursor)

  try {
    await Promise.all(budgetIds.map((bid) => notion.pages.update({ page_id: bid, in_trash: true })))
  } catch {
    return { success: false, message: '연결된 예산 삭제 중 오류가 발생했습니다. 다시 시도해주세요.' }
  }

  await notion.pages.update({ page_id: id, in_trash: true })
  revalidatePath('/settings')
  revalidatePath('/')
  return { success: true }
}
