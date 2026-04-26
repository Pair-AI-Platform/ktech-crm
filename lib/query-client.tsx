"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

function isDemoMode() {
  if (typeof window === "undefined") return false
  return window.localStorage?.getItem("ktech-demo-mode") === "true"
}

function makeQueryClient() {
  const demo = isDemoMode()
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: demo ? Infinity : 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: demo ? false : 1,
        refetchOnWindowFocus: !demo && process.env.NODE_ENV === "production",
        refetchOnReconnect: !demo,
      },
      mutations: {
        retry: demo ? false : 0,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: reuse the same query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(getQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
