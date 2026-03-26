'use client'

import { m } from 'motion/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AnimatedNumber } from '@/components/animated-number'
import type { BudgetStatus } from '@/lib/types'

function groupByAccount(statuses: BudgetStatus[]) {
  const grouped = statuses.reduce<Record<string, { accountName: string; items: BudgetStatus[] }>>(
    (acc, s) => {
      if (!acc[s.accountId]) {
        acc[s.accountId] = { accountName: s.accountName, items: [] }
      }
      acc[s.accountId].items.push(s)
      return acc
    },
    {}
  )
  return Object.values(grouped).map((group) => ({
    ...group,
    items: [...group.items].sort((a, b) => b.budget - a.budget),
  }))
}

export function BudgetStatusCard({ statuses }: { statuses: BudgetStatus[] }) {
  if (statuses.length === 0) {
    return (
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
      >
        <Card>
          <CardHeader><CardTitle>이번 달 예산 현황</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">설정에서 예산을 추가해주세요.</p>
          </CardContent>
        </Card>
      </m.div>
    )
  }

  const normalStatuses = statuses.filter((s) => !s.isFixed)
  const fixedStatuses = statuses.filter((s) => s.isFixed)
  const normalGroups = groupByAccount(normalStatuses)
  const fixedGroups = groupByAccount(fixedStatuses)
  const fixedTotal = fixedStatuses.reduce((sum, s) => sum + s.budget, 0)

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
    >
      <Card>
        <CardHeader><CardTitle>이번 달 예산 현황</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* 일반 지출 섹션 */}
          {normalGroups.map((group, groupIdx) => (
            <div key={group.items[0].accountId}>
              {groupIdx > 0 && <Separator className="mb-4" />}
              <p className="text-xs font-semibold text-muted-foreground mb-2">{group.accountName}</p>
              <div className="space-y-3">
                {group.items.map((s) => (
                  <div key={s.categoryId} className="flex items-center justify-between">
                    <span className="font-medium">{s.categoryName}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">예산 <AnimatedNumber value={s.budget} />원</span>
                      <span className="text-muted-foreground">사용 <AnimatedNumber value={s.spent} />원</span>
                      <Badge variant={s.isOver ? 'destructive' : 'secondary'}>
                        {s.remaining > 0 ? '+' : ''}<AnimatedNumber value={s.remaining} />원
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 고정 지출 섹션 */}
          {fixedStatuses.length > 0 && (
            <>
              {normalStatuses.length > 0 && <Separator />}
              {fixedGroups.map((group, groupIdx) => (
                <div key={group.items[0].accountId}>
                  {groupIdx > 0 && <Separator className="mb-4" />}
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-semibold text-muted-foreground">{group.accountName}</p>
                    <Badge variant="outline" className="text-xs">고정 지출</Badge>
                  </div>
                  <div className="space-y-3">
                    {group.items.map((s) => (
                      <div key={s.categoryId} className="flex items-center justify-between">
                        <span className="font-medium">{s.categoryName}</span>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-muted-foreground"><AnimatedNumber value={s.budget} />원</span>
                          <Badge variant="outline">고정</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <Separator className="border-dashed" />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">고정 지출 합계</span>
                <span className="font-semibold"><AnimatedNumber value={fixedTotal} />원</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </m.div>
  )
}
