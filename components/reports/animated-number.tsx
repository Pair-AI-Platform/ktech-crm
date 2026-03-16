"use client"

import { useState, useEffect, useRef, useSyncExternalStore } from "react"
import { useInView } from "framer-motion"

const emptySubscribe = () => () => {}

export function AnimatedNumber({
  value,
  duration = 1000,
  prefix = "",
  suffix = ""
}: {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
}) {
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  useEffect(() => {
    if (!isInView || !mounted) return

    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4) // easeOutQuart
      setDisplayValue(Math.floor(eased * value))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration, isInView, mounted])

  if (!mounted) {
    return <span>{prefix}{value.toLocaleString()}{suffix}</span>
  }

  return <span ref={ref}>{prefix}{displayValue.toLocaleString()}{suffix}</span>
}
