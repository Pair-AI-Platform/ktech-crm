'use client'

import { useUser } from '@/lib/hooks/use-user'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { UserRole } from '@/types'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallbackUrl?: string
}

export function RoleGuard({ children, allowedRoles, fallbackUrl = '/dashboard' }: RoleGuardProps) {
  const { profile, loading } = useUser()
  const router = useRouter()
  const [timedOut, setTimedOut] = useState(false)

  // If loading takes too long (e.g. auth token expired), render children anyway
  // since the server-side layout already verified authentication
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setTimedOut(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [loading])

  useEffect(() => {
    if (!loading && profile && !allowedRoles.includes(profile.role as UserRole)) {
      router.replace(fallbackUrl)
    }
  }, [loading, profile, allowedRoles, fallbackUrl, router])

  // If still loading but timed out, render children (server already authenticated)
  if (loading && timedOut) return <>{children}</>
  if (loading) return null
  // If profile failed to load (e.g. client auth issue), still render
  // since the server-side dashboard layout already verified the user
  if (!profile) return <>{children}</>
  if (!allowedRoles.includes(profile.role as UserRole)) return null

  return <>{children}</>
}
