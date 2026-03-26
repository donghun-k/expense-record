'use client'

import { useEffect, useState, createContext, useContext, useCallback, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { m, AnimatePresence } from 'motion/react'

interface NavigationProgressContextType {
  start: () => void
}

const NavigationProgressContext = createContext<NavigationProgressContextType | null>(null)

export function useNavigationProgress() {
  return useContext(NavigationProgressContext)
}

export function NavigationProgressProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)
  const [progress, setProgress] = useState(0)

  const start = useCallback(() => {
    setIsNavigating(true)
    setProgress(0)
  }, [])

  // pathname 변경 감지 → 완료 처리
  useEffect(() => {
    if (isNavigating) {
      setProgress(100)
      const timer = setTimeout(() => {
        setIsNavigating(false)
        setProgress(0)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <NavigationProgressContext.Provider value={{ start }}>
      {children}
      <AnimatePresence>
        {isNavigating && (
          <m.div
            className="fixed top-0 left-0 right-0 z-[60] h-[3px]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <m.div
              className="h-full bg-white rounded-r-full"
              style={{
                boxShadow: '0 0 10px rgba(240, 147, 251, 0.8), 0 0 20px rgba(245, 87, 108, 0.4)',
              }}
              initial={{ width: '0%' }}
              animate={{ width: progress < 100 ? '80%' : '100%' }}
              transition={{ duration: progress < 100 ? 0.5 : 0.2, ease: 'easeOut' }}
            />
          </m.div>
        )}
      </AnimatePresence>
    </NavigationProgressContext.Provider>
  )
}
