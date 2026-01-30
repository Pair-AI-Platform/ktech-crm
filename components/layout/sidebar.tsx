"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  ChevronLeft,
  LogOut,
  Menu,
  X,
  BarChart3,
  MessageSquare,
  Activity,
  HelpCircle,
  Phone,
  Sparkles,
  Megaphone,
  Trash2,
  GraduationCap,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useSidebar } from "@/components/layout/dashboard-shell"
import type { Profile } from "@/types"

interface SidebarProps {
  user: Profile | null
}

type NavItem = {
  name: string
  href: string
  icon: React.ElementType
  description: string
  badge?: string
}

interface NavLinkProps {
  item: NavItem
  index: number
  pathname: string
  isCollapsed: boolean
  onNavigate: () => void
}

function NavLink({ item, index, pathname, isCollapsed, onNavigate }: NavLinkProps) {
  const searchParams = useSearchParams()
  const itemHasQuery = item.href.includes("?")
  let isActive: boolean

  if (itemHasQuery) {
    const [itemPath, itemQuery] = item.href.split("?")
    const itemParams = new URLSearchParams(itemQuery)
    isActive = pathname === itemPath && Array.from(itemParams.entries()).every(
      ([key, value]) => searchParams.get(key) === value
    )
  } else {
    const matchesPath = pathname === item.href || pathname.startsWith(item.href + "/")
    // Avoid matching "Leads" when a query-param nav item (like PUC SRJ) is active
    const hasQueryNavSibling = navigation.some(
      (nav) => nav.href.startsWith(item.href + "?")
    )
    if (hasQueryNavSibling && matchesPath) {
      const siblingParams = navigation
        .filter((nav) => nav.href.startsWith(item.href + "?"))
        .map((nav) => new URLSearchParams(nav.href.split("?")[1]))
      const anySiblingActive = siblingParams.some((params) =>
        Array.from(params.entries()).every(([key, value]) => searchParams.get(key) === value)
      )
      isActive = matchesPath && !anySiblingActive
    } else {
      isActive = matchesPath
    }
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
        isActive
          ? "active bg-gradient-to-r from-[var(--primary-muted)] to-[var(--primary-muted)]/60 text-[var(--primary)] shadow-sm border border-[var(--primary)]/10"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
      )}
      onClick={onNavigate}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Active indicator bar */}
      {isActive && (
        <motion.span
          layoutId="activeNavIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--primary)] rounded-full"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <span className={cn(
        "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 shrink-0",
        isActive
          ? "bg-[var(--primary)] text-white shadow-sm"
          : "bg-[var(--bg-sunken)] text-[var(--text-tertiary)] group-hover:bg-[var(--bg-hover)] group-hover:text-[var(--text-primary)]"
      )}>
        <item.icon className="w-4 h-4" />
      </span>
      {!isCollapsed && (
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <span className="truncate">{item.name}</span>
          {item.badge && (
            <Badge variant="accent" size="xs" shape="pill" className="ml-2 shrink-0">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              {item.badge}
            </Badge>
          )}
        </div>
      )}
      {isCollapsed && (
        <div className="absolute left-full ml-3 px-3 py-2 bg-[var(--bg-elevated)] text-[var(--text-primary)] text-sm font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span>{item.name}</span>
            {item.badge && (
              <Badge variant="accent" size="xs" shape="pill">
                {item.badge}
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{item.description}</p>
        </div>
      )}
    </Link>
  )
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Overview & stats" },
  { name: "Leads", href: "/leads", icon: Users, description: "Manage prospects" },
  { name: "PUC SRJ", href: "/leads?funding_type=puc", icon: GraduationCap, description: "PUC submissions" },
  { name: "Calendar", href: "/calendar", icon: Calendar, description: "Schedule & appointments" },
  { name: "Voice", href: "/voice", icon: Phone, description: "Kadi AI & calls" },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone, description: "Outreach automation" },
  { name: "Inbox", href: "/inbox", icon: MessageSquare, badge: "Soon", description: "Messages" },
  { name: "Reports", href: "/reports", icon: BarChart3, description: "Analytics & insights" },
  { name: "Activity", href: "/activity", icon: Activity, description: "Recent activity" },
]

const secondaryNavigation = [
  { name: "Settings", href: "/settings", icon: Settings, description: "Preferences" },
  { name: "Help", href: "/help", icon: HelpCircle, description: "Support & docs" },
]

const emptySubscribe = () => () => {}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const { collapsed, setCollapsed } = useSidebar()
  const [mobileOpen, setMobileOpen] = useState(false)
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)


  // On mobile, always show expanded sidebar with names
  const isCollapsed = collapsed && !mobileOpen

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const handleNavigate = () => setMobileOpen(false)

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="flex items-center p-4 pb-3">
        <button
          onClick={() => {
            if (mobileOpen) {
              setMobileOpen(false)
            } else {
              setCollapsed(!collapsed)
            }
          }}
          className="relative w-11 h-11 rounded-xl flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer overflow-hidden shadow-sm ring-2 ring-[var(--border)] hover:ring-[var(--primary)]/30"
        >
          <img
            src="/ktech-logo.jpeg"
            alt="ktech"
            className="w-full h-full object-cover"
          />
        </button>
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-3 ml-3 group">
            <div className="overflow-hidden">
              <h1 className="font-display text-lg font-semibold text-[var(--text-primary)] leading-none tracking-tight group-hover:text-[var(--primary)] transition-colors">ktech</h1>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-1 font-medium tracking-wide uppercase">Enrollment AI</p>
            </div>
          </Link>
        )}
      </div>

      {/* Divider with gradient */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 p-3 pt-4 space-y-1 overflow-y-auto hide-scrollbar">
        {!isCollapsed && (
          <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Main Menu
          </p>
        )}
        <div className="space-y-1">
          {navigation.map((item, index) => (
            <NavLink key={item.name} item={item} index={index} pathname={pathname} isCollapsed={isCollapsed} onNavigate={handleNavigate} />
          ))}
        </div>

        <div className="pt-5 mt-5 space-y-1">
          {/* Section divider with label */}
          <div className="relative mb-3">
            <div className="absolute inset-0 flex items-center px-3">
              <div className="w-full h-px bg-gradient-to-r from-[var(--border)] via-[var(--border)] to-transparent" />
            </div>
            {!isCollapsed && (
              <div className="relative flex justify-start px-3">
                <span className="bg-[var(--bg-surface)] pr-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  System
                </span>
              </div>
            )}
          </div>
          {secondaryNavigation.map((item, index) => (
            <NavLink key={item.name} item={item} index={navigation.length + index} pathname={pathname} isCollapsed={isCollapsed} onNavigate={handleNavigate} />
          ))}
        </div>

        {/* Admin-only section */}
        {user?.role === 'admin' && (
          <div className="pt-5 mt-5 space-y-1">
            {/* Section divider with label */}
            <div className="relative mb-3">
              <div className="absolute inset-0 flex items-center px-3">
                <div className="w-full h-px bg-gradient-to-r from-red-500/30 via-red-500/30 to-transparent" />
              </div>
              {!isCollapsed && (
                <div className="relative flex justify-start px-3">
                  <span className="bg-[var(--bg-surface)] pr-3 text-[10px] font-bold uppercase tracking-widest text-red-500">
                    Admin
                  </span>
                </div>
              )}
            </div>
            <NavLink
              item={{ name: "Deleted Leads", href: "/deleted-leads", icon: Trash2, description: "Restore deleted leads" }}
              index={navigation.length + secondaryNavigation.length}
              pathname={pathname}
              isCollapsed={isCollapsed}
              onNavigate={handleNavigate}
            />
          </div>
        )}
      </nav>

      {/* Theme Toggle & User Section */}
      <div className="p-3 space-y-3">
        {/* Gradient divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mb-3" />

        {/* Theme Toggle */}
        {!isCollapsed ? (
          <ThemeToggle variant="full" className="w-full" />
        ) : (
          <div className="flex justify-center">
            <ThemeToggle variant="icon" />
          </div>
        )}

        {/* User Card */}
        <div className={cn(
          "group flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
          "bg-gradient-to-br from-[var(--bg-sunken)] to-[var(--bg-surface)]",
          "border border-[var(--border)] hover:border-[var(--primary)]/30",
          "hover:shadow-[0_4px_20px_-4px_rgba(var(--primary-rgb),0.15)]",
          isCollapsed && "justify-center p-2.5"
        )}>
          <div className="relative">
            <Avatar size="sm" status="online">
              <AvatarImage src={user?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white font-semibold">
                {mounted ? (user?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U") : "U"}
              </AvatarFallback>
            </Avatar>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{mounted ? (user?.full_name || "User") : "User"}</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                <p className="text-[11px] text-[var(--text-secondary)] truncate capitalize">{mounted ? (user?.role || "Agent") : "Agent"}</p>
              </div>
            </div>
          )}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleSignOut}
              className="text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] opacity-0 group-hover:opacity-100 transition-opacity"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  // Same content for mobile and desktop
  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-[var(--bg-surface)]/90 backdrop-blur-md border border-[var(--border)] shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[var(--text-primary)]/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0.5 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed inset-y-0 left-0 z-50 w-[280px] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] backdrop-saturate-[var(--glass-saturate)] border-r border-[var(--glass-border)] lg:hidden shadow-2xl"
          >
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              onClick={() => setMobileOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 left-0 z-30",
          "bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] backdrop-saturate-[var(--glass-saturate)]",
          "border-r border-[var(--glass-border)]",
          "sidebar-transition",
          // Subtle inner shadow for depth
          "shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.02)]",
          isCollapsed ? "w-[76px]" : "w-[264px]"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
