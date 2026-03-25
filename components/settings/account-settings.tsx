'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createAccount, updateAccount, deleteAccount } from '@/lib/actions/account'
import type { Account } from '@/lib/types'

export function AccountSettings({ accounts }: { accounts: Account[] }) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleCreate = () => {
    if (!newName.trim()) return
    startTransition(async () => {
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
    startTransition(async () => {
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
    startTransition(async () => {
      try {
        const result = await deleteAccount(id)
        if (result.success) {
          toast.success('계좌가 삭제됐습니다')
        } else {
          toast.error(result.message)
        }
      } catch {
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
        <div className="space-y-2">
          {accounts.map((account) => (
            <div key={account.id} className="flex items-center gap-2">
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
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
