'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { useNavigationProgress } from '@/components/navigation-progress'

const links = [
  { href: '/', label: '지출 입력' },
  { href: '/history', label: '지출 내역' },
  { href: '/settings', label: '설정' },
]

export function Nav() {
  const pathname = usePathname()
  const navigationProgress = useNavigationProgress()
  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--surface-elevated-border)] bg-[var(--surface-elevated)] backdrop-blur-[24px]">
      <div className="container mx-auto max-w-3xl flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <span className="text-base font-bold tracking-tight">지출 기록</span>
          <div className="flex gap-4">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => pathname !== href && navigationProgress?.start()}
                className={cn(
                  'text-sm font-medium transition-colors',
                  pathname === href
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <ThemeToggle />
      </div>
    </nav>
  )
}
