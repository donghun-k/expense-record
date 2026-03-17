'use client'

import { useEffect } from 'react'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <p className="text-sm text-muted-foreground">오류가 발생했습니다</p>
      {error.digest && (
        <p className="text-xs text-muted-foreground">오류 코드: {error.digest}</p>
      )}
      <button type="button" onClick={reset} className="text-sm underline">다시 시도</button>
    </div>
  )
}
