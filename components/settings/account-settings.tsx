'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { m, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createAccount, updateAccount, deleteAccount } from '@/lib/actions/account'
import { useLoadingAction } from '@/components/loading-provider'
import type { Account } from '@/lib/types'

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.25 } },
}

export function AccountSettings({ accounts }: { accounts: Account[] }) {
  const [localAccounts, setLocalAccounts] = useState(accounts)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const { execute, isPending } = useLoadingAction()

  useEffect(() => {
    setLocalAccounts(accounts)
  }, [accounts])

  const handleCreate = () => {
    if (!newName.trim()) return
    execute(async () => {
      try {
        await createAccount(newName)
        setNewName('')
        toast.success('계좌가 추가됐습니다')
      } catch {
        toast.error('계좌 추가에 실패했습니다')
      }
    })
  }

  const handleUpdate = (id: string) => {
    execute(async () => {
      try {
        await updateAccount(id, editingName)
        setEditingId(null)
        toast.success('계좌가 수정됐습니다')
      } catch {
        toast.error('계좌 수정에 실패했습니다')
      }
    })
  }

  const handleDelete = (id: string) => {
    const backup = localAccounts
    setLocalAccounts((prev) => prev.filter((a) => a.id !== id))
    execute(async () => {
      try {
        const result = await deleteAccount(id)
        if (result.success) {
          toast.success('계좌가 삭제됐습니다')
        } else {
          setLocalAccounts(backup)
          toast.error(result.message)
        }
      } catch {
        setLocalAccounts(backup)
        toast.error('삭제 중 오류가 발생했습니다')
      }
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>계좌 관리</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="계좌명 입력"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); handleCreate() } }}
          />
          <Button onClick={handleCreate} disabled={isPending}>추가</Button>
        </div>
        <m.div
          className="space-y-2"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {localAccounts.map((account) => (
              <m.div key={account.id} className="flex items-center gap-2" variants={itemVariants} exit="exit">
                {editingId === account.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={() => handleUpdate(account.id)} disabled={isPending}>저장</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>취소</Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{account.name}</span>
                    <Button size="sm" variant="outline" onClick={() => { setEditingId(account.id); setEditingName(account.name) }}>수정</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(account.id)} disabled={isPending}>삭제</Button>
                  </>
                )}
              </m.div>
            ))}
          </AnimatePresence>
        </m.div>
      </CardContent>
    </Card>
  )
}
