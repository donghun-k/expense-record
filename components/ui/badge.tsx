import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 h-[22px] text-[11px] font-semibold tracking-tight whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--surface-subtle)] text-foreground border-[var(--surface-subtle-border)] backdrop-blur-[12px]",
        fixed:
          "bg-[var(--surface-subtle)] text-muted-foreground border-[var(--surface-subtle-border)] backdrop-blur-[12px]",
        ok:
          "bg-[var(--signal-pos)]/10 text-[var(--signal-pos)] border-[var(--signal-pos)]/20",
        warn:
          "bg-[var(--signal-neg)]/10 text-[var(--signal-neg)] border-[var(--signal-neg)]/20",
        outline:
          "bg-transparent text-foreground border-[var(--surface-border)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
