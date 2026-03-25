import { format } from 'date-fns'
import { getAccounts } from '@/lib/actions/account'
import { getCategories } from '@/lib/actions/category'
import { getExpensesByMonth } from '@/lib/actions/expense'
import { ExpenseList } from '@/components/expense-list'
import { MonthSelector } from '@/components/month-selector'

interface Props {
  searchParams: Promise<{ month?: string }>
}

export default async function HistoryPage({ searchParams }: Props) {
  const { month } = await searchParams
  const yearMonth = month ?? format(new Date(), 'yyyy-MM')

  const [accounts, categories, expenses] = await Promise.all([
    getAccounts(),
    getCategories(),
    getExpensesByMonth(yearMonth),
  ])

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">지출 내역</h1>
        <MonthSelector currentMonth={yearMonth} />
      </div>
      <ExpenseList expenses={expenses} accounts={accounts} categories={categories} />
    </div>
  )
}
