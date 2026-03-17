'use client'

import { useRouter } from 'next/navigation'
import { format, addMonths, subMonths } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MonthSelector({ currentMonth }: { currentMonth: string }) {
  const router = useRouter()
  const current = new Date(`${currentMonth}-01`)

  const go = (date: Date) => {
    router.push(`/history?month=${format(date, 'yyyy-MM')}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => go(subMonths(current, 1))}>
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium w-24 text-center">{currentMonth}</span>
      <Button variant="outline" size="icon" onClick={() => go(addMonths(current, 1))}>
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}
