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
    if (!loading && profile && !allowedRoles.includes(profile.role as UserRole)) {
      router.replace(fallbackUrl)
    }
  }, [loading, profile, allowedRoles, fallbackUrl, router])

  if (loading) return null
  if (!profile || !allowedRoles.includes(profile.role as UserRole)) return null

  return <>{children}</>
}
