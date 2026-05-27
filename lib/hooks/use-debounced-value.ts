"use client"

import { useEffect, useState } from "react"

// Returns a value that only updates after `delay` ms of no further changes.
// Used to prevent text-input changes from firing a network/db request per keystroke.
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])

  return debounced
}
