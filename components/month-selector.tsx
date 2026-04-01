'use client'

import { useRouter } from 'next/navigation'
import { format, addMonths, subMonths } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigationProgress } from '@/components/navigation-progress'
import { getMonthDateRange } from '@/lib/utils/date-range'

export function MonthSelector({ currentMonth }: { currentMonth: string }) {
  const router = useRouter()
  const navigationProgress = useNavigationProgress()
  const [y, m] = currentMonth.split('-').map(Number)
  const current = new Date(y, m - 1, 1)
  const { start, end } = getMonthDateRange(currentMonth)

  const go = (date: Date) => {
    navigationProgress?.start()
    router.push(`/history?month=${format(date, 'yyyy-MM')}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => go(subMonths(current, 1))}>
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <div className="text-center">
        <span className="text-sm font-medium">{currentMonth}</span>
        <p className="text-xs text-muted-foreground">
          {start.slice(5)} ~ {end.slice(5)}
        </p>
      </div>
      <Button variant="outline" size="icon" onClick={() => go(addMonths(current, 1))}>
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}
