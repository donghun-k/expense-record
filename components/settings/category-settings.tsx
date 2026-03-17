'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createCategory, updateCategory, deleteCategory } from '@/lib/actions/category'
import type { Account, Category } from '@/lib/types'

export function CategorySettings({ accounts, categories }: { accounts: Account[]; categories: Category[] }) {
  const [newName, setNewName] = useState('')
  const [newAccountId, setNewAccountId] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingAccountId, setEditingAccountId] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleCreate = () => {
    if (!newName.trim() || !newAccountId) return
    startTransition(async () => {
      try {
        await createCategory(newName, newAccountId)
        setNewName('')
        setNewAccountId('')
        toast.success('카테고리가 추가됐습니다')
      } catch {
        toast.error('카테고리 추가에 실패했습니다')
      }
    })
  }

  const handleUpdate = (id: string) => {
    startTransition(async () => {
      try {
        await updateCategory(id, editingName, editingAccountId)
        setEditingId(null)
        toast.success('카테고리가 수정됐습니다')
      } catch {
        toast.error('카테고리 수정에 실패했습니다')
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        const result = await deleteCategory(id)
        if (result.success) {
          toast.success('카테고리가 삭제됐습니다')
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
      <CardHeader><CardTitle>카테고리 관리</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="카테고리명"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
          />
          <Select value={newAccountId} onValueChange={(v) => setNewAccountId(v ?? '')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="계좌 선택" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleCreate} disabled={isPending || !newName.trim() || !newAccountId}>추가</Button>
        </div>
        <div className="space-y-2">
          {categories.map((category) => {
            const accountName = accounts.find((a) => a.id === category.accountId)?.name ?? ''
            return (
              <div key={category.id} className="flex items-center gap-2">
                {editingId === category.id ? (
                  <>
                    <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="flex-1" />
                    <Select value={editingAccountId} onValueChange={(v) => setEditingAccountId(v ?? '')}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => handleUpdate(category.id)} disabled={isPending}>저장</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>취소</Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{category.name}</span>
                    <span className="text-sm text-muted-foreground">{accountName}</span>
                    <Button size="sm" variant="outline" onClick={() => { setEditingId(category.id); setEditingName(category.name); setEditingAccountId(category.accountId) }}>수정</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(category.id)} disabled={isPending}>삭제</Button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
