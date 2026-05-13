"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function LegacyPucSrjRedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString())
    if (nextParams.get("tab") === "sf_srj") {
      nextParams.set("tab", "self_fund")
    }

    const query = nextParams.toString()
    router.replace(query ? `/puc-psp?${query}` : "/puc-psp")
  }, [router, searchParams])

  return null
}
