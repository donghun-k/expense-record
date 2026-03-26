export interface Account {
  id: string
  name: string
}

export interface Category {
  id: string
  name: string
  accountId: string
}

export interface Budget {
  id: string
  yearMonth: string // "YYYY-MM"
  amount: number
  categoryId: string
}

export interface Expense {
  id: string
  title: string
  amount: number
  date: string // "YYYY-MM-DD"
  accountId: string
  accountName: string
  categoryId: string
  categoryName: string
}

export interface BudgetStatus {
  categoryId: string
  categoryName: string
  accountId: string
  accountName: string
  budget: number
  spent: number
  remaining: number
  isOver: boolean
}
