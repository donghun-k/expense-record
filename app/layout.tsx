import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import './globals.css'
import { Nav } from '@/components/nav'
import { Toaster } from '@/components/ui/sonner'
import { MotionProvider } from '@/components/motion-provider'
import { LoadingProvider } from '@/components/loading-provider'
import { NavigationProgressProvider } from '@/components/navigation-progress'
import { PageTransition } from '@/components/page-transition'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '지출 기록',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <MotionProvider>
            <LoadingProvider>
              <NavigationProgressProvider>
                <Nav />
                <main className="container mx-auto px-4 py-6">
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
