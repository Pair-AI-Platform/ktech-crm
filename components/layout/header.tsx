"use client"

import { Bell, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CounterBadge } from "@/components/ui/badge"
import Link from "next/link"
import type { Profile } from "@/lib/hooks/use-user"

interface HeaderProps {
  user: Profile | null
  title?: string
  subtitle?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
    icon?: React.ReactNode
  }
  breadcrumbs?: { label: string; href?: string }[]
  hideSearch?: boolean
}

export function Header({ user, title, subtitle, action, breadcrumbs }: HeaderProps) {
  const notificationCount = 3 // This would come from real data

  return (
    <header className="sticky top-0 z-20 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] backdrop-saturate-[var(--glass-saturate)] border-b border-[var(--glass-border)]">
      <div className="flex items-center justify-between min-h-[4.5rem] md:min-h-[4rem] py-3 md:py-2 px-4 md:px-6">
        {/* Left Section - Title & Breadcrumbs */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="lg:hidden w-10 shrink-0" /> {/* Spacer for mobile menu button */}
          <div className="space-y-0.5">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className={`flex items-center gap-1.5 text-sm ${title ? 'mb-1' : ''}`}>
                {breadcrumbs.map((crumb, index) => (
                  <span key={index} className="flex items-center gap-1.5">
                    {index > 0 && <span className="text-[var(--text-muted)]">/</span>}
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-[var(--text-muted)]">{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
            {title && (
              <h1 className="text-lg md:text-xl font-semibold text-[var(--text-primary)] tracking-tight leading-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-snug">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <div className="absolute -top-0.5 -right-0.5">
                <CounterBadge count={notificationCount} />
              </div>
            )}
          </Button>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-[var(--border)]" />

          {/* Primary Action */}
          {action && (
            action.href ? (
              <Link href={action.href}>
                <Button className="hidden sm:flex shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/40">
                  {action.icon || <Plus className="w-4 h-4" />}
                  {action.label}
                </Button>
              </Link>
            ) : (
              <Button
                onClick={action.onClick}
                className="hidden sm:flex shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/40"
              >
                {action.icon || <Plus className="w-4 h-4" />}
                {action.label}
              </Button>
            )
          )}

          {/* Mobile Action */}
          {action && (
            action.href ? (
              <Link href={action.href} className="sm:hidden">
                <Button size="icon" className="shadow-lg shadow-[var(--primary)]/20">
                  {action.icon || <Plus className="w-4 h-4" />}
                </Button>
              </Link>
            ) : (
              <Button
                size="icon"
                onClick={action.onClick}
                className="sm:hidden shadow-lg shadow-[var(--primary)]/20"
              >
                {action.icon || <Plus className="w-4 h-4" />}
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  )
}
