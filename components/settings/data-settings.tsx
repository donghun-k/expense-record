'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { countPastExpenses, deletePastExpenses } from '@/lib/actions/expense'
import { useLoadingAction } from '@/components/loading-provider'

export function DataSettings() {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState<number | null>(null)
  const { execute, isPending } = useLoadingAction()

  const handleOpenDialog = () => {
    execute(async () => {
      try {
        const c = await countPastExpenses()
        setCount(c)
        setOpen(true)
      } catch {
        toast.error('삭제 대상 조회 중 오류가 발생했습니다')
      }
    })
  }

  const handleConfirmDelete = () => {
    execute(async () => {
      try {
        const { deletedCount } = await deletePastExpenses()
        toast.success(`${deletedCount.toLocaleString()}건의 지난 지출 기록이 삭제됐습니다`)
        setOpen(false)
      } catch (e) {
        toast.error((e as Error).message || '삭제 중 오류가 발생했습니다')
        setOpen(false)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>지난 기간 데이터</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          현재 기간 시작일 이전의 모든 지출 기록을 삭제합니다. 예산, 계좌, 카테고리는 유지됩니다.
        </p>
        <Button variant="destructive" onClick={handleOpenDialog} disabled={isPending}>
          지난 기간 지출 삭제
        </Button>

        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>지난 지출 기록을 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                {count === 0
                  ? '삭제할 지출 기록이 없습니다.'
                  : `총 ${count?.toLocaleString()}건의 지출 기록이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>
                {count === 0 ? '닫기' : '취소'}
              </AlertDialogCancel>
              {count !== 0 && (
                <AlertDialogAction
                  onClick={handleConfirmDelete}
                  disabled={isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  삭제
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
