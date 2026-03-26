'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { updateExpense, deleteExpense } from '@/lib/actions/expense'
import type { Account, Category, Expense } from '@/lib/types'

interface Props {
  expenses: Expense[]
  accounts: Account[]
  categories: Category[]
}

export function ExpenseList({ expenses, accounts, categories }: Props) {
  const [filterAccountId, setFilterAccountId] = useState('')
  const [filterCategoryId, setFilterCategoryId] = useState('')
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editDate, setEditDate] = useState<Date>(new Date())
  const [editTitle, setEditTitle] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editAccountId, setEditAccountId] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [isUpdating, startUpdateTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense)
    // UTC 파싱 버그 방지: "YYYY-MM-DD" 문자열을 로컬 날짜로 파싱
    const [y, m, d] = expense.date.split('-').map(Number)
    setEditDate(new Date(y, m - 1, d))
    setEditTitle(expense.title)
    setEditAmount(String(expense.amount))
    setEditAccountId(expense.accountId)
    setEditCategoryId(expense.categoryId)
  }

  const handleUpdate = () => {
    if (!editingExpense) return
    const parsedAmount = parseInt(editAmount, 10)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('올바른 금액을 입력해주세요')
      return
    }
    startUpdateTransition(async () => {
      try {
        await updateExpense(editingExpense.id, {
          title: editTitle,
          amount: parsedAmount,
          date: format(editDate, 'yyyy-MM-dd'),
          accountId: editAccountId,
          categoryId: editCategoryId,
        })
        setEditingExpense(null)
        toast.success('지출이 수정됐습니다')
      } catch {
        toast.error('지출 수정에 실패했습니다')
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('이 지출 기록을 삭제하시겠습니까?')) return
    startDeleteTransition(async () => {
      try {
        await deleteExpense(id)
        toast.success('지출이 삭제됐습니다')
      } catch {
        toast.error('지출 삭제에 실패했습니다')
      }
    })
  }

  const filteredCategories = categories.filter((c) => c.accountId === editAccountId && !c.isFixed)

  const filteredExpenses = expenses.filter((e) => {
    if (filterAccountId && e.accountId !== filterAccountId) return false
    if (filterCategoryId && e.categoryId !== filterCategoryId) return false
    return true
  })
  const filteredTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">계좌</span>
          <Select value={filterAccountId} onValueChange={(v) => { setFilterAccountId(v ?? ''); setFilterCategoryId('') }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="전체" label={filterAccountId ? accounts.find((a) => a.id === filterAccountId)?.name : undefined} />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filterAccountId && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterAccountId(''); setFilterCategoryId('') }}>
              초기화
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">카테고리</span>
          <Select value={filterCategoryId} onValueChange={(v) => setFilterCategoryId(v ?? '')}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="전체" label={filterCategoryId ? categories.find((c) => c.id === filterCategoryId)?.name : undefined} />
            </SelectTrigger>
            <SelectContent>
              {(filterAccountId ? categories.filter((c) => c.accountId === filterAccountId) : categories).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filterCategoryId && (
            <Button variant="ghost" size="sm" onClick={() => setFilterCategoryId('')}>
              초기화
            </Button>
          )}
        </div>
      </div>
      <div className="text-sm text-muted-foreground mb-4">
        {(filterAccountId || filterCategoryId)
          ? `필터 결과: ${filteredExpenses.length}건 · ${filteredTotal.toLocaleString()}원 (전체 ${expenses.length}건 · ${expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}원)`
          : `총 ${filteredExpenses.length}건 · ${filteredTotal.toLocaleString()}원`
        }
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>날짜</TableHead>
            <TableHead>사용처</TableHead>
            <TableHead className="text-right">금액</TableHead>
            <TableHead>계좌</TableHead>
            <TableHead>카테고리</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredExpenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                {(filterAccountId || filterCategoryId) ? '필터 조건에 맞는 기록이 없습니다' : '지출 기록이 없습니다'}
              </TableCell>
            </TableRow>
          ) : (
            filteredExpenses.map((expense) => {
              // UTC 파싱 버그 방지: "YYYY-MM-DD" 문자열을 로컬 날짜로 파싱
              const [ey, em, ed] = expense.date.split('-').map(Number)
              const displayDate = format(new Date(ey, em - 1, ed), 'MM/dd', { locale: ko })
              return (
              <TableRow key={expense.id}>
                <TableCell>{displayDate}</TableCell>
                <TableCell>{expense.title}</TableCell>
                <TableCell className="text-right">{expense.amount.toLocaleString()}원</TableCell>
                <TableCell>{expense.accountName}</TableCell>
                <TableCell>{expense.categoryName}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => openEdit(expense)}>수정</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(expense.id)} disabled={isDeleting}>삭제</Button>
                  </div>
                </TableCell>
              </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>지출 수정</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>날짜</Label>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    'flex h-9 w-full items-center justify-start rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(editDate, 'yyyy년 MM월 dd일', { locale: ko })}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={editDate} onSelect={(d) => d && setEditDate(d)} locale={ko} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label>사용처</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>금액 (원)</Label>
              <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} min="1" />
            </div>
            <div className="space-y-1">
              <Label>계좌</Label>
              <Select value={editAccountId} onValueChange={(v) => { setEditAccountId(v ?? ''); setEditCategoryId('') }}>
                <SelectTrigger>
                  <SelectValue
                    placeholder="계좌 선택"
                    label={accounts.find((a) => a.id === editAccountId)?.name}
                  />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>카테고리</Label>
              <Select value={editCategoryId} onValueChange={(v) => setEditCategoryId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue
                    placeholder="카테고리 선택"
                    label={filteredCategories.find((c) => c.id === editCategoryId)?.name}
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingExpense(null)}>취소</Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
