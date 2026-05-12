import * as React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  caption?: string
  title: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ caption, title, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'mb-5 flex items-end justify-between gap-4 border-b border-[var(--surface-subtle-border)] pb-4',
        className
      )}
    >
      <div className="flex flex-col gap-1">
        {caption && (
          <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{caption}</p>
        )}
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-foreground">
          {title}
        </h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
