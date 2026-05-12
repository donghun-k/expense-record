'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface DatePickerProps {
  value: Date
  onChange: (date: Date) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = '날짜 선택',
  disabled,
  className,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          'flex h-9 w-full items-center justify-start rounded-md border border-[var(--surface-subtle-border)] bg-[var(--surface-subtle)] px-3 py-1 text-sm text-foreground backdrop-blur-[16px] transition-colors',
          'hover:bg-[var(--surface)]',
          'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:border-foreground/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !value && 'text-muted-foreground',
          className
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
        {value ? format(value, 'yyyy년 MM월 dd일', { locale: ko }) : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => d && onChange(d)}
          initialFocus
          locale={ko}
        />
      </PopoverContent>
    </Popover>
  )
}
