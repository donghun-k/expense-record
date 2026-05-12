import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { ThemeProvider } from 'next-themes'
import './globals.css'
import { Nav } from '@/components/nav'
import { Toaster } from '@/components/ui/sonner'
import { MotionProvider } from '@/components/motion-provider'
import { LoadingProvider } from '@/components/loading-provider'
import { NavigationProgressProvider } from '@/components/navigation-progress'
import { PageTransition } from '@/components/page-transition'

const pretendard = localFont({
  src: '../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2',
  variable: '--font-pretendard',
  display: 'swap',
  weight: '45 920',
})

export const metadata: Metadata = {
  title: '지출 기록',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning className={pretendard.variable}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <MotionProvider>
            <LoadingProvider>
              <NavigationProgressProvider>
                <Nav />
                <main className="container mx-auto max-w-3xl px-4 py-6">
                  <PageTransition>{children}</PageTransition>
                </main>
                <Toaster />
              </NavigationProgressProvider>
            </LoadingProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
