import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

  return (
    <Card>
      <CardHeader><CardTitle>이번 달 예산 현황</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {statuses.map((s) => (
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
      </CardContent>
    </Card>
  )
}
