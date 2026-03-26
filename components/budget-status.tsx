import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { BudgetStatus } from '@/lib/types'

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

  // 계좌별로 그룹핑 후 각 그룹 내에서 예산 내림차순 정렬
  const groupedByAccount = statuses.reduce<Record<string, { accountName: string; items: BudgetStatus[] }>>(
    (acc, s) => {
      if (!acc[s.accountId]) {
        acc[s.accountId] = { accountName: s.accountName, items: [] }
      }
      acc[s.accountId].items.push(s)
      return acc
    },
    {}
  )

  const accountGroups = Object.values(groupedByAccount).map((group) => ({
    ...group,
    items: [...group.items].sort((a, b) => b.budget - a.budget),
  }))

  return (
    <Card>
      <CardHeader><CardTitle>이번 달 예산 현황</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {accountGroups.map((group, groupIdx) => (
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
      </CardContent>
    </Card>
  )
}
