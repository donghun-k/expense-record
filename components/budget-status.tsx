import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
      <Card>
        <CardHeader><CardTitle>이번 달 예산 현황</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">설정에서 예산을 추가해주세요.</p>
        </CardContent>
      </Card>
    )
  }

  const normalStatuses = statuses.filter((s) => !s.isFixed)
  const fixedStatuses = statuses.filter((s) => s.isFixed)
  const normalGroups = groupByAccount(normalStatuses)
  const fixedGroups = groupByAccount(fixedStatuses)
  const fixedTotal = fixedStatuses.reduce((sum, s) => sum + s.budget, 0)

  return (
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
                    <span className="text-muted-foreground">예산 {s.budget.toLocaleString()}원</span>
                    <span className="text-muted-foreground">사용 {s.spent.toLocaleString()}원</span>
                    <Badge variant={s.isOver ? 'destructive' : 'secondary'}>
                      {s.remaining > 0 ? '+' : ''}{s.remaining.toLocaleString()}원
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
                        <span className="text-muted-foreground">{s.budget.toLocaleString()}원</span>
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
              <span className="font-semibold">{fixedTotal.toLocaleString()}원</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
