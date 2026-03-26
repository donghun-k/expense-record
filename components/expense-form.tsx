'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'
import { m } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { createExpense } from '@/lib/actions/expense'
import { useLoadingAction } from '@/components/loading-provider'
import type { Account, Category } from '@/lib/types'

interface Props {
  accounts: Account[]
  categories: Category[]
}

export function ExpenseForm({ accounts, categories }: Props) {
  const [date, setDate] = useState<Date>(new Date())
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const { execute, isPending } = useLoadingAction()

  const filteredCategories = categories.filter((c) => c.accountId === accountId)

  const handleAccountChange = (value: string | null) => {
    setAccountId(value ?? '')
    setCategoryId('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedAmount = parseInt(amount, 10)
    if (!title.trim() || !accountId || !categoryId) {
      toast.error('모든 필드를 입력해주세요')
      return
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('올바른 금액을 입력해주세요')
      return
    }

    execute(async () => {
      try {
        await createExpense({
          title,
          amount: parsedAmount,
          date: format(date, 'yyyy-MM-dd'),
          accountId,
          categoryId,
        })
        setTitle('')
        setAmount('')
        setAccountId('')
        setCategoryId('')
        setDate(new Date())
        toast.success('지출이 기록됐습니다')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : '지출 기록에 실패했습니다')
      }
    })
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
    <Card>
      <CardHeader><CardTitle>지출 입력</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>날짜</Label>
            <Popover>
              <PopoverTrigger
                className={cn(
                  'flex h-9 w-full items-center justify-start rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'yyyy년 MM월 dd일', { locale: ko }) : '날짜 선택'}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  locale={ko}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <Label>사용처</Label>
            <Input placeholder="예: 스타벅스" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>금액 (원)</Label>
            <Input type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" />
          </div>

          <div className="space-y-1">
            <Label>계좌</Label>
            <Select value={accountId} onValueChange={handleAccountChange}>
              <SelectTrigger>
                <SelectValue
                  placeholder="계좌 선택"
                  label={accounts.find((a) => a.id === accountId)?.name}
                />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>카테고리</Label>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? '')} disabled={!accountId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={accountId ? '카테고리 선택' : '계좌를 먼저 선택하세요'}
                  label={filteredCategories.find((c) => c.id === categoryId)?.name}
                />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.length === 0 && accountId ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">등록된 카테고리가 없습니다</div>
                ) : (
                  filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            지출 기록
          </Button>
        </form>
      </CardContent>
    </Card>
    </m.div>
  )
}
