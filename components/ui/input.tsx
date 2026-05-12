import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-[var(--surface-subtle-border)] bg-[var(--surface-subtle)] px-3 py-1 text-sm text-foreground backdrop-blur-[16px] transition-colors outline-none",
        "placeholder:text-muted-foreground",
        "selection:bg-foreground selection:text-background",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "hover:bg-[var(--surface)]",
        "focus-visible:border-foreground/20 focus-visible:bg-[var(--surface)] focus-visible:ring-3 focus-visible:ring-ring",
        "aria-invalid:border-destructive/50 aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
