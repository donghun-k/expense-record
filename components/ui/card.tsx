import * as React from "react"

import { cn } from "@/lib/utils"

type Surface = "subtle" | "default" | "elevated"

const SURFACE_CLASS: Record<Surface, string> = {
  subtle:
    "bg-[var(--surface-subtle)] ring-[var(--surface-subtle-border)] backdrop-blur-[16px]",
  default:
    "bg-[var(--surface)] ring-[var(--surface-border)] backdrop-blur-[20px]",
  elevated:
    "bg-[var(--surface-elevated)] ring-[var(--surface-elevated-border)] backdrop-blur-[24px] shadow-[0_8px_32px_rgba(0,0,0,.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,.4)]",
}

function Card({
  className,
  size = "default",
  surface = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm"; surface?: Surface }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-surface={surface}
      className={cn(
        "group/card flex flex-col gap-4 overflow-hidden rounded-xl py-4 text-sm text-card-foreground ring-1 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        SURFACE_CLASS[surface],
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-base leading-snug font-semibold tracking-[-0.005em] group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-4 group-data-[size=sm]/card:px-3", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t border-[var(--surface-border)] bg-[var(--surface-subtle)] p-4 group-data-[size=sm]/card:p-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
