'use client'

import { useEffect, useRef } from 'react'
import { useMotionValue, useTransform, animate, m } from 'motion/react'

interface Props {
  value: number
  className?: string
}

export function AnimatedNumber({ value, className }: Props) {
  const motionValue = useMotionValue(0)
  const displayed = useTransform(motionValue, (v) => Math.round(v).toLocaleString())
  const prevValue = useRef(0)

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.8,
      ease: 'easeOut',
    })
    prevValue.current = value
    return () => controls.stop()
  }, [value, motionValue])

  return <m.span className={className}>{displayed}</m.span>
}
