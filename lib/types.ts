export interface Account {
  id: string
  name: string
}

export interface Category {
  id: string
  name: string
  accountId: string
  isFixed: boolean
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

/**
 * 지출 페이지에 실제로 보이는 필드만 담은 타입(expenseCodec.read의 반환값).
 * 계좌명/카테고리명은 페이지에 없으므로 별도 join(이름 hydration)으로 채워 Expense가 된다.
 */
export type ExpenseRow = Omit<Expense, 'accountName' | 'categoryName'>

export interface BudgetStatus {
  categoryId: string
  categoryName: string
  accountId: string
  accountName: string
  budget: number
  spent: number
  remaining: number
  isOver: boolean
  isFixed: boolean
}
