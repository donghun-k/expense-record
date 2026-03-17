'use client'

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <p className="text-sm text-muted-foreground">{error.message || '오류가 발생했습니다'}</p>
      <button onClick={reset} className="text-sm underline">다시 시도</button>
    </div>
  )
}
