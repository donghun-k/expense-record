'use server'

import { revalidatePath } from 'next/cache'
import { format, addMonths } from 'date-fns'
import { notion, DB } from '@/lib/notion'
import type { Expense } from '@/lib/types'

export async function createExpense(data: {
  title: string
  amount: number
  date: string
  accountId: string
  categoryId: string
}): Promise<void> {
  if (!data.title.trim()) throw new Error('사용처를 입력해주세요')
  if (data.amount <= 0) throw new Error('금액을 입력해주세요')
  if (!data.accountId) throw new Error('계좌를 선택해주세요')
  if (!data.categoryId) throw new Error('카테고리를 선택해주세요')

  await notion.pages.create({
    parent: { database_id: DB.EXPENSE },
    properties: {
      '사용처': { title: [{ text: { content: data.title.trim() } }] },
      '금액': { number: data.amount },
      '날짜': { date: { start: data.date } },
      '계좌': { relation: [{ id: data.accountId }] },
      '카테고리': { relation: [{ id: data.categoryId }] },
    },
  })
  revalidatePath('/')
  revalidatePath('/history')
}

export async function getExpensesByMonth(yearMonth: string): Promise<Expense[]> {
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) throw new Error('잘못된 연월 형식입니다')
  const [year, month] = yearMonth.split('-').map(Number)
  const startDate = `${yearMonth}-01`
  // toISOString() 타임존 버그 방지: date-fns로 직접 포맷
  const endDate = format(addMonths(new Date(year, month - 1, 1), 1), 'yyyy-MM-dd')

  const response = await notion.databases.query({
    database_id: DB.EXPENSE,
    filter: {
      and: [
        { property: '날짜', date: { on_or_after: startDate } },
        { property: '날짜', date: { before: endDate } },
      ],
    },
    sorts: [{ property: '날짜', direction: 'descending' }],
  })

  // 계좌/카테고리명 조회를 위해 accounts, categories를 별도 fetch
  const accountIds = [...new Set(response.results.map((p: any) => p.properties['계좌'].relation[0]?.id).filter(Boolean))]
  const categoryIds = [...new Set(response.results.map((p: any) => p.properties['카테고리'].relation[0]?.id).filter(Boolean))]

  const [accountPages, categoryPages] = await Promise.all([
    Promise.all(accountIds.map((id) => notion.pages.retrieve({ page_id: id as string }) as any)),
    Promise.all(categoryIds.map((id) => notion.pages.retrieve({ page_id: id as string }) as any)),
  ])

  const accountMap = Object.fromEntries(
    accountPages.map((p: any) => [p.id, p.properties['계좌명'].title[0]?.plain_text ?? ''])
  )
  const categoryMap = Object.fromEntries(
    categoryPages.map((p: any) => [p.id, p.properties['카테고리명'].title[0]?.plain_text ?? ''])
  )

  return response.results.map((page: any) => {
    const accountId = page.properties['계좌'].relation[0]?.id ?? ''
    const categoryId = page.properties['카테고리'].relation[0]?.id ?? ''
    return {
      id: page.id,
      title: page.properties['사용처'].title[0]?.plain_text ?? '',
      amount: page.properties['금액'].number ?? 0,
      date: page.properties['날짜'].date?.start ?? '',
      accountId,
      accountName: accountMap[accountId] ?? '',
      categoryId,
      categoryName: categoryMap[categoryId] ?? '',
    }
  })
}

export async function updateExpense(
  id: string,
  data: { title: string; amount: number; date: string; accountId: string; categoryId: string }
): Promise<void> {
  if (!id) throw new Error('항목을 찾을 수 없습니다')
  if (!data.title.trim()) throw new Error('사용처를 입력해주세요')
  if (data.amount <= 0) throw new Error('금액을 입력해주세요')
  if (!data.accountId) throw new Error('계좌를 선택해주세요')
  if (!data.categoryId) throw new Error('카테고리를 선택해주세요')

  await notion.pages.update({
    page_id: id,
    properties: {
      '사용처': { title: [{ text: { content: data.title.trim() } }] },
      '금액': { number: data.amount },
      '날짜': { date: { start: data.date } },
      '계좌': { relation: [{ id: data.accountId }] },
      '카테고리': { relation: [{ id: data.categoryId }] },
    },
  })
  revalidatePath('/history')
  revalidatePath('/')
}

export async function deleteExpense(id: string): Promise<void> {
  if (!id) throw new Error('항목을 찾을 수 없습니다')
  await notion.pages.update({ page_id: id, in_trash: true })
  revalidatePath('/history')
  revalidatePath('/')
}
