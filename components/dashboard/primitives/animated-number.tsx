"use client"

import { useEffect, useRef, useState } from "react"

interface AnimatedNumberProps {
  value: number
  duration?: number
  className?: string
  formatter?: (value: number) => string
}

export function AnimatedNumber({
  value,
  duration = 800,
  className,
  formatter = (v) => Math.round(v).toLocaleString(),
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0)
  const previousValue = useRef(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const start = previousValue.current
    const diff = value - start
    const startTime = performance.now()

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = start + diff * eased
      setDisplay(current)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        previousValue.current = value
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  return <span className={className}>{formatter(display)}</span>
}
