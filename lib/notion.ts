import { Client } from '@notionhq/client'

export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

export const DB = {
  EXPENSE: process.env.NOTION_EXPENSE_DB_ID!,
  ACCOUNT: process.env.NOTION_ACCOUNT_DB_ID!,
  CATEGORY: process.env.NOTION_CATEGORY_DB_ID!,
  BUDGET: process.env.NOTION_BUDGET_DB_ID!,
}
