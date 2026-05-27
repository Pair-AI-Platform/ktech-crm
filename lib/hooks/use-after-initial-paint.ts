"use client"

import { useEffect, useState } from "react"

export function useAfterInitialPaint() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let frame = 0
    let nestedFrame = 0

    frame = window.requestAnimationFrame(() => {
      nestedFrame = window.requestAnimationFrame(() => setReady(true))
    })

    return () => {
      window.cancelAnimationFrame(frame)
      window.cancelAnimationFrame(nestedFrame)
    }
  }, [])

  return ready
}
