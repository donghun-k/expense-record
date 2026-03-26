'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'

interface LoadingContextType {
  showLoading: () => void
  hideLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | null>(null)

export function useLoading() {
  const ctx = useContext(LoadingContext)
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider')
  return ctx
}

export function useLoadingAction() {
  const { showLoading, hideLoading } = useLoading()
  const [isPending, setIsPending] = useState(false)

  const execute = useCallback(async (action: () => Promise<void>) => {
    setIsPending(true)
    showLoading()
    try {
      await action()
    } finally {
      hideLoading()
      setIsPending(false)
    }
  }, [showLoading, hideLoading])

  return { execute, isPending }
}

function DotSpinner() {
  return (
    <div className="flex gap-2">
      {[0, 1, 2].map((i) => (
        <m.div
          key={i}
          className="h-3 w-3 rounded-full bg-white"
          animate={{ scale: [0.6, 1, 0.6], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.16 }}
        />
      ))}
    </div>
  )
}

function LoadingOverlay({ isVisible }: { isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          key="loading-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <DotSpinner />
        </m.div>
      )}
    </AnimatePresence>
  )
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0)

  const showLoading = useCallback(() => setCount((c) => c + 1), [])
  const hideLoading = useCallback(() => setCount((c) => Math.max(0, c - 1)), [])

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      <LoadingOverlay isVisible={count > 0} />
    </LoadingContext.Provider>
  )
}
