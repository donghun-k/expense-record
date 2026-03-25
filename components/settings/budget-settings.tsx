'use client'

import { useState, useTransition } from 'react'
import { format, subMonths } from 'date-fns'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { upsertBudget, copyBudgetFromPreviousMonth } from '@/lib/actions/budget'
import type { Budget, Category } from '@/lib/types'

interface Props {
  categories: Category[]
  currentYearMonth: string
  budgets: Budget[]
  hasPreviousMonthBudget: boolean
}

function formatNumber(value: string): string {
  const num = value.replace(/[^0-9]/g, '')
  if (!num) return ''
  return parseInt(num, 10).toLocaleString()
}

function parseNumber(formatted: string): string {
  return formatted.replace(/,/g, '')
}

export function BudgetSettings({ categories, currentYearMonth, budgets, hasPreviousMonthBudget }: Props) {
  const [amounts, setAmounts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    budgets.forEach((b) => { init[b.categoryId] = b.amount.toLocaleString() })
    return init
  })
  const [originalAmounts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    budgets.forEach((b) => { init[b.categoryId] = b.amount.toLocaleString() })
    return init
  })
  const [savedState, setSavedState] = useState<Record<string, 'saved' | 'dirty' | 'idle'>>({})
  const [isPending, startTransition] = useTransition()

  const handleSave = (categoryId: string, categoryName: string) => {
    const amount = parseInt(parseNumber(amounts[categoryId] ?? '0'), 10)
    if (isNaN(amount) || amount < 0) {
      toast.error('올바른 금액을 입력해주세요')
      return
    }
    startTransition(async () => {
      try {
        await upsertBudget(currentYearMonth, categoryId, amount, categoryName)
        toast.success('예산이 저장됐습니다')
        setSavedState((prev) => ({ ...prev, [categoryId]: 'saved' }))
      } catch {
        toast.error('예산 저장에 실패했습니다')
      }
    })
  }

  const handleCopyFromPrevious = () => {
    const [year, month] = currentYearMonth.split('-').map(Number)
    const prevYearMonth = format(subMonths(new Date(year, month - 1, 1), 1), 'yyyy-MM')
    startTransition(async () => {
      try {
        const copied = await copyBudgetFromPreviousMonth(currentYearMonth, prevYearMonth)
        if (copied) {
          toast.success('전월 예산을 복사했습니다')
        } else {
          toast.error('전월 예산 데이터가 없습니다')
        }
      } catch {
        toast.error('전월 예산 복사 중 오류가 발생했습니다')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{currentYearMonth} 예산 설정</CardTitle>
          {hasPreviousMonthBudget && (
            <Button variant="outline" size="sm" onClick={handleCopyFromPrevious} disabled={isPending}>
              전월에서 복사
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">카테고리를 먼저 추가해주세요.</p>
        ) : (
          categories.map((category) => {
            const state = savedState[category.id] ?? 'idle'
            return (
              <div key={category.id} className="flex items-center gap-3">
                <span className="w-32 text-sm">{category.name}</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={amounts[category.id] ?? ''}
                  onChange={(e) => {
                    const formatted = formatNumber(e.target.value)
                    setAmounts((prev) => ({ ...prev, [category.id]: formatted }))
                    setSavedState((prev) => ({
                      ...prev,
                      [category.id]: formatted === (originalAmounts[category.id] || '') ? 'idle' : 'dirty',
                    }))
                  }}
                  className="flex-1"
                />
                {state === 'saved' ? (
                  <Button size="sm" variant="outline" disabled className="text-green-600 border-green-600">
                    <Check className="h-4 w-4 mr-1" />저장됨
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant={state === 'dirty' ? 'default' : 'outline'}
                    onClick={() => handleSave(category.id, category.name)}
                    disabled={isPending || state === 'idle'}
                  >
                    저장
                  </Button>
                )}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
