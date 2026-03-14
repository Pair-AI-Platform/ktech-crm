"use client"

import { createContext, useContext } from "react"
import { useHeartbeat, type ManualStatus } from "@/lib/hooks/use-heartbeat"
import { useUser } from "@/lib/hooks/use-user"

interface HeartbeatContextValue {
  manualStatus: ManualStatus
  setManualStatus: (status: ManualStatus) => Promise<void>
}

const HeartbeatContext = createContext<HeartbeatContextValue>({
  manualStatus: null,
  setManualStatus: async () => {},
})

export function useAgentStatus() {
  return useContext(HeartbeatContext)
}

export function HeartbeatProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useUser()
  const { manualStatus, setManualStatus } = useHeartbeat(profile?.id)

  return (
    <HeartbeatContext.Provider value={{ manualStatus, setManualStatus }}>
      {children}
    </HeartbeatContext.Provider>
  )
}
