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
  LogOut,
  Menu,
  X,
  BarChart3,
  Activity,
  HelpCircle,
  Phone,
  Sparkles,
  Trash2,
  GraduationCap,
  Search,
  Ban,
  UserMinus,
  Wallet,
  ChevronRight,
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
  children?: NavItem[]
  roles?: ("admin" | "agent")[]
}

interface NavLinkProps {
  item: NavItem
  index: number
  pathname: string
  isCollapsed: boolean
  onNavigate: () => void
}

// Collect all nav hrefs including children for sibling detection
function getAllNavHrefs(items: NavItem[]): string[] {
  return items.flatMap(item => [item.href, ...(item.children?.map(c => c.href) || [])])
}

function useIsNavActive(item: NavItem) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const itemHasQuery = item.href.includes("?")

  if (itemHasQuery) {
    const [itemPath, itemQuery] = item.href.split("?")
    const itemParams = new URLSearchParams(itemQuery)
    return pathname === itemPath && Array.from(itemParams.entries()).every(
      ([key, value]) => searchParams.get(key) === value
    )
  }

  const matchesPath = pathname === item.href || pathname.startsWith(item.href + "/")
  // Collect all query-param siblings (top-level and children)
  const allHrefs = getAllNavHrefs(navigation)
  const queryParamSiblings = allHrefs.filter(href => href.startsWith(item.href + "?"))

  if (queryParamSiblings.length > 0 && matchesPath) {
    const siblingParams = queryParamSiblings.map(href => new URLSearchParams(href.split("?")[1]))
    const anySiblingActive = siblingParams.some((params) =>
      Array.from(params.entries()).every(([key, value]) => searchParams.get(key) === value)
    )
    return matchesPath && !anySiblingActive
  }

  return matchesPath
}

function NavLink({ item, index, pathname, isCollapsed, onNavigate }: NavLinkProps) {
  const isActive = useIsNavActive(item)
  const hasChildren = item.children && item.children.length > 0
  const isAnyChildActive = item.children?.some(child => pathname === child.href.split("?")[0] && child.href.includes("?"))
  const [childrenOpen, setChildrenOpen] = useState(isAnyChildActive ?? false)

  // Don't show parent as active when children are expanded (child handles its own active state)
  const showActive = isActive && !(hasChildren && childrenOpen)

  return (
    <>
      <Link
        href={item.href}
        className={cn(
          "nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
          showActive
            ? "active bg-[var(--bg-hover)] text-[var(--text-primary)]"
            : hasChildren && childrenOpen
              ? "text-[var(--text-primary)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        )}
        onClick={(e) => {
          if (hasChildren) {
            e.preventDefault()
            setChildrenOpen(prev => !prev)
          } else {
            onNavigate()
          }
        }}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Active indicator bar */}
        {showActive && (
          <motion.span
            layoutId="activeNavIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[var(--primary)] rounded-full"
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          />
        )}
        <span className={cn(
          "flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 shrink-0",
          isActive
            ? "text-[var(--text-primary)]"
            : "text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]"
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
            {hasChildren && (
              <ChevronRight className={cn(
                "w-3.5 h-3.5 text-[var(--text-tertiary)] transition-transform duration-200 ml-1 shrink-0",
                childrenOpen && "rotate-90"
              )} />
            )}
          </div>
        )}
        {isCollapsed && (
          <div className="absolute left-full ml-3 px-3 py-2 bg-[var(--bg-elevated)] text-[var(--text-primary)] text-sm font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-[var(--border)]">
            <div className="flex items-center gap-2">
              <span>{item.name}</span>
              {item.badge && (
                <Badge variant="secondary" size="xs" shape="pill">
                  {item.badge}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{item.description}</p>
          </div>
        )}
      </Link>
      {/* Sub-items - toggle on click */}
      <AnimatePresence>
        {hasChildren && childrenOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={cn("overflow-hidden space-y-0.5", !isCollapsed && "ml-8 mt-0.5")}
          >
            {/* Link to parent page */}
            <SubNavLink item={{ ...item, name: `All ${item.name}` }} index={index} isCollapsed={isCollapsed} onNavigate={onNavigate} />
            {item.children!.map((child, childIndex) => (
              <SubNavLink key={child.name} item={child} index={index + childIndex + 1} isCollapsed={isCollapsed} onNavigate={onNavigate} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function SubNavLink({ item, index, isCollapsed, onNavigate }: Omit<NavLinkProps, 'pathname'>) {
  const isActive = useIsNavActive(item)

  return (
    <Link
      href={item.href}
      className={cn(
        "nav-item flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 group relative",
        isCollapsed ? "px-3 py-2.5" : "px-3 py-1.5",
        isActive
          ? "text-[var(--text-primary)]"
          : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
      )}
      onClick={onNavigate}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {isActive && (
        <motion.span
          layoutId="activeSubNavIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[var(--primary)] rounded-full"
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        />
      )}
      <span className={cn(
        "flex items-center justify-center w-6 h-6 rounded-md transition-all duration-200 shrink-0",
        isActive
          ? "text-[var(--text-primary)]"
          : "text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]"
      )}>
        <item.icon className={cn(isCollapsed ? "w-4 h-4" : "w-3.5 h-3.5")} />
      </span>
      {!isCollapsed && (
        <span className="truncate text-[13px]">{item.name}</span>
      )}
      {isCollapsed && (
        <div className="absolute left-full ml-3 px-3 py-2 bg-[var(--bg-elevated)] text-[var(--text-primary)] text-sm font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-[var(--border)]">
          <span>{item.name}</span>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{item.description}</p>
        </div>
      )}
    </Link>
  )
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Overview & stats" },
  { name: "Contacts", href: "/leads", icon: Users, description: "Manage prospects", roles: ["admin", "agent"], children: [
    { name: "Lost", href: "/leads?stage=lost", icon: Ban, description: "Lost leads" },
  ]},
  { name: "PUC", href: "/puc-srj", icon: GraduationCap, description: "PUC submissions", roles: ["admin", "agent"] },
  { name: "Self Funded", href: "/puc-srj?tab=sf_srj", icon: Wallet, description: "Self-funded submissions", roles: ["admin", "agent"] },
  { name: "Calendar", href: "/calendar", icon: Calendar, description: "Schedule & appointments" },
  // { name: "Voice", href: "/voice", icon: Phone, description: "Kadi AI & calls" },
  { name: "Reports", href: "/reports", icon: BarChart3, description: "Analytics & insights", roles: ["admin", "agent"] },
  { name: "Activity", href: "/activity", icon: Activity, description: "Recent activity", roles: ["admin", "agent"] },
]

const secondaryNavigation = [
  { name: "Settings", href: "/settings", icon: Settings, description: "Preferences" },
  { name: "Help", href: "/help", icon: HelpCircle, description: "Support & docs" },
]

const emptySubscribe = () => () => {}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { collapsed, setCollapsed, openQuickFind } = useSidebar()
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

  const userRole = user?.role || "agent"
  const filteredNavigation = navigation.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  )

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
          className="relative w-10 h-10 rounded-lg flex items-center justify-center shrink-0 active:scale-[0.98] transition-all cursor-pointer overflow-hidden shadow-[var(--shadow-sm)] ring-1 ring-[var(--border)] hover:ring-[var(--border-emphasis)]"
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

      {/* Divider */}
      <div className="mx-4 h-px bg-[var(--border)]" />

      {/* Quick Find Button */}
      {!isCollapsed && (
        <div className="px-3 pt-3">
          <button
            onClick={openQuickFind}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors group"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-md text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors">
              <Search className="w-4 h-4" />
            </span>
            <span className="flex-1 text-left">Quick Find</span>
            <kbd className="text-[10px] font-medium text-[var(--text-tertiary)] bg-[var(--bg-sunken)] px-1.5 py-0.5 rounded border border-[var(--border)]">
              ⌘K
            </kbd>
          </button>
        </div>
      )}
      {isCollapsed && (
        <div className="px-3 pt-3 flex justify-center">
          <button
            onClick={openQuickFind}
            className="relative p-2.5 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors group"
            title="Quick Find (⌘K)"
          >
            <Search className="w-4 h-4" />
            <div className="absolute left-full ml-3 px-3 py-2 bg-[var(--bg-elevated)] text-[var(--text-primary)] text-sm font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span>Quick Find</span>
                <kbd className="text-[10px] bg-[var(--bg-sunken)] px-1 py-0.5 rounded">⌘K</kbd>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 pt-4 space-y-1 overflow-y-auto hide-scrollbar">
        {!isCollapsed && (
          <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Main Menu
          </p>
        )}
        <div className="space-y-1">
          {filteredNavigation.map((item, index) => (
            <NavLink key={item.name} item={item} index={index} pathname={pathname} isCollapsed={isCollapsed} onNavigate={handleNavigate} />
          ))}
        </div>

        <div className="pt-5 mt-5 space-y-1">
          {/* Section divider with label */}
          <div className="relative mb-3">
            <div className="absolute inset-0 flex items-center px-3">
              <div className="w-full h-px bg-[var(--border)]" />
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
                <div className="w-full h-px bg-[var(--error)]/20" />
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
        {/* Divider */}
        <div className="h-px bg-[var(--border)] mb-3" />

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
          "group flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
          "bg-[var(--bg-sunken)]",
          "border border-[var(--border)] hover:border-[var(--border-emphasis)]",
          isCollapsed && "justify-center p-2.5"
        )}>
          <div className="relative">
            <Avatar size="sm" status="online">
              <AvatarImage src={user?.avatar_url || undefined} />
              <AvatarFallback className="bg-[#2D347D] text-white font-semibold">
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
        className="fixed top-4 left-4 z-50 lg:hidden bg-[var(--bg-surface)] border border-[var(--border)] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] active:scale-[0.98] transition-all"
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
            className="fixed inset-0 bg-[rgba(31,29,26,0.4)] z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-y-0 left-0 z-50 w-[280px] bg-[var(--bg-surface)] border-r border-[var(--border)] lg:hidden shadow-[var(--shadow-xl)]"
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
          "bg-[var(--bg-surface)]",
          "border-r border-[var(--border)]",
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
