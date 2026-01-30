"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react"
import { Device, Call } from "@twilio/voice-sdk"
import { createClient } from "@/lib/supabase/client"
import type { Call as DbCall, Lead, Profile } from "@/types"

// Call state types
export type CallState =
  | "idle"
  | "connecting"
  | "ringing"
  | "in-progress"
  | "disconnected"

export type CallDirection = "inbound" | "outbound"

export interface ActiveCall {
  id?: string
  twilioCall: Call | null
  state: CallState
  direction: CallDirection
  phoneNumber: string
  startTime: Date | null
  duration: number
  isMuted: boolean
  isOnHold: boolean
  leadId?: string
  lead?: Lead
  agentId?: string
}

export interface IncomingCallInfo {
  callSid: string
  from: string
  to: string
  leadId?: string
  lead?: Lead
}

interface VoiceContextType {
  // Device state
  device: Device | null
  isDeviceReady: boolean
  isRegistering: boolean
  deviceError: string | null

  // Call state
  activeCall: ActiveCall | null
  incomingCall: IncomingCallInfo | null

  // Actions
  makeCall: (phoneNumber: string, leadId?: string) => Promise<void>
  acceptCall: () => void
  rejectCall: () => void
  endCall: () => void
  toggleMute: () => void
  toggleHold: () => void
  sendDigits: (digits: string) => void

  // Agent availability
  isAvailable: boolean
  setIsAvailable: (available: boolean) => void
}

const VoiceContext = createContext<VoiceContextType | null>(null)

export function useVoice() {
  const context = useContext(VoiceContext)
  if (!context) {
    throw new Error("useVoice must be used within a VoiceProvider")
  }
  return context
}

interface VoiceProviderProps {
  children: ReactNode
  agentId: string
}

export function VoiceProvider({ children, agentId }: VoiceProviderProps) {
  const supabase = createClient()

  // Device state
  const [device, setDevice] = useState<Device | null>(null)
  const [isDeviceReady, setIsDeviceReady] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [deviceError, setDeviceError] = useState<string | null>(null)

  // Call state
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null)
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null)

  // Agent availability
  const [isAvailable, setIsAvailable] = useState(true)

  // Refs for cleanup
  const deviceRef = useRef<Device | null>(null)
  const callRef = useRef<Call | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch access token from API
  const fetchAccessToken = useCallback(async (): Promise<string> => {
    const response = await fetch("/api/voice/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId }),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch access token")
    }

    const data = await response.json()
    return data.token
  }, [agentId])

  // Cleanup call state - defined first as it's used by setupCallEventHandlers
  const cleanup = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }
    callRef.current = null
    setActiveCall(null)
    setIncomingCall(null)
  }, [])

  // Set up call event handlers - defined before initializeDevice since it's used there
  const setupCallEventHandlers = useCallback((call: Call, direction: CallDirection) => {
    call.on("accept", () => {
      console.log("[Voice] Call accepted")
      setActiveCall(prev => prev ? {
        ...prev,
        state: "in-progress",
        startTime: new Date(),
      } : null)

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setActiveCall(prev => prev ? {
          ...prev,
          duration: prev.duration + 1,
        } : null)
      }, 1000)
    })

    call.on("ringing", () => {
      console.log("[Voice] Call ringing")
      setActiveCall(prev => prev ? { ...prev, state: "ringing" } : null)
    })

    call.on("disconnect", () => {
      console.log("[Voice] Call disconnected")
      cleanup()
    })

    call.on("cancel", () => {
      console.log("[Voice] Call cancelled")
      cleanup()
    })

    call.on("reject", () => {
      console.log("[Voice] Call rejected")
      cleanup()
    })

    call.on("error", (error) => {
      console.error("[Voice] Call error:", error)
      cleanup()
    })
  }, [cleanup])

  // Initialize Twilio Device
  const initializeDevice = useCallback(async () => {
    try {
      setIsRegistering(true)
      setDeviceError(null)

      const token = await fetchAccessToken()

      const newDevice = new Device(token, {
        codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
        logLevel: 1,
      })

      // Device events
      newDevice.on("registered", () => {
        console.log("[Voice] Device registered")
        setIsDeviceReady(true)
        setIsRegistering(false)
      })

      newDevice.on("unregistered", () => {
        console.log("[Voice] Device unregistered")
        setIsDeviceReady(false)
      })

      newDevice.on("error", (error) => {
        console.error("[Voice] Device error:", error)
        setDeviceError(error.message)
        setIsDeviceReady(false)
      })

      newDevice.on("tokenWillExpire", async () => {
        console.log("[Voice] Token will expire, refreshing...")
        try {
          const newToken = await fetchAccessToken()
          newDevice.updateToken(newToken)
        } catch (err) {
          console.error("[Voice] Failed to refresh token:", err)
        }
      })

      // Incoming call
      newDevice.on("incoming", (call: Call) => {
        console.log("[Voice] Incoming call from:", call.parameters.From)

        const callInfo: IncomingCallInfo = {
          callSid: call.parameters.CallSid,
          from: call.parameters.From,
          to: call.parameters.To,
        }

        setIncomingCall(callInfo)
        callRef.current = call

        // Set up call event handlers
        setupCallEventHandlers(call, "inbound")
      })

      // Register device
      await newDevice.register()

      deviceRef.current = newDevice
      setDevice(newDevice)
    } catch (err) {
      console.error("[Voice] Failed to initialize device:", err)
      setDeviceError(err instanceof Error ? err.message : "Failed to initialize")
      setIsRegistering(false)
    }
  }, [fetchAccessToken, setupCallEventHandlers])

  // Make outbound call
  const makeCall = useCallback(async (phoneNumber: string, leadId?: string) => {
    if (!device || !isDeviceReady) {
      throw new Error("Device not ready")
    }

    try {
      // Format number for Kuwait (+965)
      const formattedNumber = phoneNumber.startsWith("+965")
        ? phoneNumber
        : `+965${phoneNumber.replace(/\D/g, "")}`

      console.log("[Voice] Making call to:", formattedNumber)

      const call = await device.connect({
        params: {
          To: formattedNumber,
          LeadId: leadId || "",
          AgentId: agentId,
        },
      })

      callRef.current = call

      setActiveCall({
        twilioCall: call,
        state: "connecting",
        direction: "outbound",
        phoneNumber: formattedNumber,
        startTime: null,
        duration: 0,
        isMuted: false,
        isOnHold: false,
        leadId,
      })

      setupCallEventHandlers(call, "outbound")
    } catch (err) {
      console.error("[Voice] Failed to make call:", err)
      throw err
    }
  }, [device, isDeviceReady, agentId, setupCallEventHandlers])

  // Accept incoming call
  const acceptCall = useCallback(() => {
    const call = callRef.current
    if (!call || !incomingCall) return

    console.log("[Voice] Accepting call")
    call.accept()

    setActiveCall({
      twilioCall: call,
      state: "connecting",
      direction: "inbound",
      phoneNumber: incomingCall.from,
      startTime: null,
      duration: 0,
      isMuted: false,
      isOnHold: false,
      leadId: incomingCall.leadId,
      lead: incomingCall.lead,
    })

    setIncomingCall(null)
  }, [incomingCall])

  // Reject incoming call
  const rejectCall = useCallback(() => {
    const call = callRef.current
    if (!call) return

    console.log("[Voice] Rejecting call")
    call.reject()
    setIncomingCall(null)
  }, [])

  // End active call
  const endCall = useCallback(() => {
    const call = callRef.current
    if (!call) return

    console.log("[Voice] Ending call")
    call.disconnect()
  }, [])

  // Toggle mute
  const toggleMute = useCallback(() => {
    const call = callRef.current
    if (!call || !activeCall) return

    const newMuted = !activeCall.isMuted
    call.mute(newMuted)
    setActiveCall(prev => prev ? { ...prev, isMuted: newMuted } : null)
  }, [activeCall])

  // Toggle hold (using mute as workaround - true hold requires server-side)
  const toggleHold = useCallback(() => {
    const call = callRef.current
    if (!call || !activeCall) return

    const newHold = !activeCall.isOnHold
    // For true hold, we'd need server-side implementation
    // This is a simple mute-based "hold"
    call.mute(newHold)
    setActiveCall(prev => prev ? { ...prev, isOnHold: newHold, isMuted: newHold } : null)
  }, [activeCall])

  // Send DTMF digits
  const sendDigits = useCallback((digits: string) => {
    const call = callRef.current
    if (!call) return

    call.sendDigits(digits)
  }, [])

  // Initialize device on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    initializeDevice()

    return () => {
      // Cleanup on unmount
      if (deviceRef.current) {
        deviceRef.current.destroy()
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [initializeDevice])

  // Update agent availability in database
  useEffect(() => {
    const updateAvailability = async () => {
      await supabase
        .from("agent_voice_settings")
        .upsert({
          agent_id: agentId,
          is_available: isAvailable,
          last_heartbeat: new Date().toISOString(),
        }, {
          onConflict: "agent_id",
        })
    }

    updateAvailability()

    // Heartbeat every 30 seconds
    const heartbeat = setInterval(updateAvailability, 30000)
    return () => clearInterval(heartbeat)
  }, [agentId, isAvailable, supabase])

  const value: VoiceContextType = {
    device,
    isDeviceReady,
    isRegistering,
    deviceError,
    activeCall,
    incomingCall,
    makeCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleHold,
    sendDigits,
    isAvailable,
    setIsAvailable,
  }

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  )
}
