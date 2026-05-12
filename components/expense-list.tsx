'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ReceiptIcon } from 'lucide-react'
import { toast } from 'sonner'
import { m, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DatePicker } from '@/components/ui/date-picker'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { updateExpense, deleteExpense } from '@/lib/actions/expense'
import { useLoadingAction } from '@/components/loading-provider'
import type { Account, Category, Expense } from '@/lib/types'

interface Props {
  expenses: Expense[]
  accounts: Account[]
  categories: Category[]
}

const listVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
}

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
}

export function ExpenseList({ expenses, accounts, categories }: Props) {
  const [localExpenses, setLocalExpenses] = useState(expenses)
  const [filterAccountId, setFilterAccountId] = useState('')
  const [filterCategoryId, setFilterCategoryId] = useState('')
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editDate, setEditDate] = useState<Date>(new Date())
  const [editTitle, setEditTitle] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editAccountId, setEditAccountId] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
  const { execute: executeUpdate, isPending: isUpdating } = useLoadingAction()
  const { execute: executeDelete, isPending: isDeleting } = useLoadingAction()

  // 서버 props 갱신 시 로컬 상태 동기화
  useEffect(() => {
    setLocalExpenses(expenses)
  }, [expenses])

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
    executeUpdate(async () => {
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

  const requestDelete = (expense: Expense) => setDeleteTarget(expense)

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    const target = deleteTarget
    const backup = localExpenses
    setLocalExpenses((prev) => prev.filter((e) => e.id !== target.id))
    executeDelete(async () => {
      try {
        await deleteExpense(target.id)
        toast.success('지출이 삭제됐습니다')
        setDeleteTarget(null)
      } catch {
        setLocalExpenses(backup)
        toast.error('지출 삭제에 실패했습니다')
        setDeleteTarget(null)
      }
    })
  }

  const filteredCategories = categories.filter((c) => c.accountId === editAccountId && !c.isFixed)

  const filteredExpenses = localExpenses.filter((e) => {
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
          ? `필터 결과: ${filteredExpenses.length}건 · ${filteredTotal.toLocaleString()}원 (전체 ${localExpenses.length}건 · ${localExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}원)`
          : `총 ${filteredExpenses.length}건 · ${filteredTotal.toLocaleString()}원`
        }
      </div>
      {filteredExpenses.length === 0 ? (
        <EmptyState
          icon={<ReceiptIcon className="size-5" />}
          title={(filterAccountId || filterCategoryId) ? '필터 조건에 맞는 기록이 없습니다' : '지출 기록이 없습니다'}
          description={(filterAccountId || filterCategoryId) ? '필터를 조정해 보세요.' : '이번 달엔 아직 기록된 지출이 없어요.'}
        />
      ) : (
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
            <m.tr
              key={`stagger-${filterAccountId}-${filterCategoryId}`}
              variants={listVariants}
              initial="hidden"
              animate="visible"
              style={{ display: 'contents' }}
            >
              <AnimatePresence mode="popLayout">
                {filteredExpenses.map((expense) => {
                  // UTC 파싱 버그 방지: "YYYY-MM-DD" 문자열을 로컬 날짜로 파싱
                  const [ey, em, ed] = expense.date.split('-').map(Number)
                  const displayDate = format(new Date(ey, em - 1, ed), 'MM/dd', { locale: ko })
                  return (
                    <m.tr
                      key={expense.id}
                      variants={rowVariants}
                      exit="exit"
                    >
                      <TableCell>{displayDate}</TableCell>
                      <TableCell>{expense.title}</TableCell>
                      <TableCell className="text-right">{expense.amount.toLocaleString()}원</TableCell>
                      <TableCell>{expense.accountName}</TableCell>
                      <TableCell>{expense.categoryName}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => openEdit(expense)}>수정</Button>
                          <Button size="sm" variant="destructive" onClick={() => requestDelete(expense)}>삭제</Button>
                        </div>
                      </TableCell>
                    </m.tr>
                  )
                })}
              </AnimatePresence>
            </m.tr>
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>지출 수정</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>날짜</Label>
              <DatePicker value={editDate} onChange={setEditDate} />
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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="지출 기록을 삭제할까요?"
        description={deleteTarget ? `${deleteTarget.title} · ${deleteTarget.amount.toLocaleString()}원` : undefined}
        confirmLabel="삭제"
        destructive
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
