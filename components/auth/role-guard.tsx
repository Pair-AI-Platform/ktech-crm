'use client'

import { useUser } from '@/lib/hooks/use-user'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { UserRole } from '@/types'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallbackUrl?: string
}

export function RoleGuard({ children, allowedRoles, fallbackUrl = '/dashboard' }: RoleGuardProps) {
  const { profile, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!profile || !allowedRoles.includes(profile.role as UserRole)) {
      router.replace(fallbackUrl)
    }
  }, [loading, profile, allowedRoles, fallbackUrl, router])

  // Fail closed: do not render gated content unless we have a profile and
  // its role is allowed. Server-side APIs are also gated, but the UI itself
  // shouldn't leak admin layouts to a client whose profile load failed.
  if (loading) return null
  if (!profile) return null
  if (!allowedRoles.includes(profile.role as UserRole)) return null

  return <>{children}</>
}
