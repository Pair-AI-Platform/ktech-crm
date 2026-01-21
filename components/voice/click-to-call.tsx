"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Phone, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClickToCallProps {
  phoneNumber: string
  leadId?: string
  name?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showLabel?: boolean
}

export function ClickToCall({
  phoneNumber,
  leadId,
  name,
  variant = "outline",
  size = "sm",
  className,
  showLabel = true,
}: ClickToCallProps) {
  const router = useRouter()
  const [isInitiating, setIsInitiating] = useState(false)

  const handleClick = async () => {
    setIsInitiating(true)

    // Navigate to Voice page with call parameters
    const params = new URLSearchParams({
      call: phoneNumber,
      ...(leadId && { leadId }),
      ...(name && { name }),
    })

    router.push(`/voice?${params.toString()}`)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isInitiating}
      className={cn(
        "gap-1.5 transition-all",
        isInitiating && "opacity-70",
        className
      )}
    >
      {isInitiating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Phone className="w-4 h-4" />
      )}
      {showLabel && (isInitiating ? "Connecting..." : "Call")}
    </Button>
  )
}
