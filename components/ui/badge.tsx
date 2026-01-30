"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)] select-none whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary-muted)] text-[var(--primary)] hover:bg-[var(--primary-subtle)]",
        secondary:
          "bg-[var(--bg-sunken)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--border-emphasis)]",
        destructive:
          "bg-[var(--error-bg)] text-[var(--error)] hover:bg-[var(--error-muted)]",
        outline:
          "bg-transparent text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-emphasis)]",
        success:
          "bg-[var(--success-bg)] text-[var(--success)] hover:bg-[var(--success-muted)]",
        warning:
          "bg-[var(--warning-bg)] text-[var(--warning)] hover:bg-[var(--warning-muted)]",
        error:
          "bg-[var(--error-bg)] text-[var(--error)] hover:bg-[var(--error-muted)]",
        info:
          "bg-[var(--info-bg)] text-[var(--info)] hover:bg-[var(--info-muted)]",
        accent:
          "bg-[var(--accent-muted)] text-[var(--accent)] hover:bg-[var(--accent-subtle)]",
        // Solid variants for higher emphasis
        "solid-primary":
          "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm hover:bg-[var(--primary-hover)]",
        "solid-success":
          "bg-[var(--success)] text-white shadow-sm hover:opacity-90",
        "solid-warning":
          "bg-[var(--warning)] text-[var(--text-inverse)] shadow-sm hover:opacity-90",
        "solid-error":
          "bg-[var(--error)] text-white shadow-sm hover:opacity-90",
        // Gradient variant
        gradient:
          "bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white shadow-sm",
        // Pipeline stage variants - using CSS variables for theme consistency
        new:
          "bg-gradient-to-r from-[rgba(99,102,241,0.15)] to-[rgba(99,102,241,0.08)] text-[var(--stage-new)] border border-[rgba(99,102,241,0.25)]",
        contacted:
          "bg-gradient-to-r from-[rgba(139,92,246,0.15)] to-[rgba(139,92,246,0.08)] text-[var(--stage-contacted)] border border-[rgba(139,92,246,0.25)]",
        appointment:
          "bg-gradient-to-r from-[rgba(168,85,247,0.15)] to-[rgba(168,85,247,0.08)] text-[var(--stage-appointment)] border border-[rgba(168,85,247,0.25)]",
        visit:
          "bg-gradient-to-r from-[rgba(217,70,239,0.15)] to-[rgba(217,70,239,0.08)] text-[var(--stage-visit)] border border-[rgba(217,70,239,0.25)]",
        test:
          "bg-gradient-to-r from-[rgba(244,63,94,0.15)] to-[rgba(244,63,94,0.08)] text-[var(--stage-tested)] border border-[rgba(244,63,94,0.25)]",
        application:
          "bg-gradient-to-r from-[rgba(249,115,22,0.15)] to-[rgba(249,115,22,0.08)] text-[var(--stage-application)] border border-[rgba(249,115,22,0.25)]",
        applicant:
          "bg-gradient-to-r from-[rgba(99,102,241,0.15)] to-[rgba(99,102,241,0.08)] text-indigo-600 dark:text-indigo-400 border border-[rgba(99,102,241,0.25)]",
        payment:
          "bg-gradient-to-r from-[rgba(16,185,129,0.15)] to-[rgba(16,185,129,0.08)] text-[var(--stage-payment)] border border-[rgba(16,185,129,0.25)]",
        enrolled:
          "bg-gradient-to-r from-[rgba(5,150,105,0.15)] to-[rgba(5,150,105,0.08)] text-[var(--stage-enrolled)] border border-[rgba(5,150,105,0.25)]",
        withdraw:
          "bg-gradient-to-r from-[rgba(239,68,68,0.15)] to-[rgba(239,68,68,0.08)] text-red-600 dark:text-red-400 border border-[rgba(239,68,68,0.25)]",
        lost:
          "bg-gradient-to-r from-[rgba(113,113,122,0.15)] to-[rgba(113,113,122,0.08)] text-[var(--stage-lost)] border border-[rgba(113,113,122,0.25)]",
      },
      size: {
        xs: "h-5 px-1.5 text-[10px] rounded-md",
        sm: "h-6 px-2 text-[11px] rounded-lg",
        default: "h-7 px-2.5 text-xs rounded-lg",
        lg: "h-8 px-3 text-sm rounded-xl",
      },
      shape: {
        default: "",
        pill: "rounded-full",
        square: "rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  pulse?: boolean
  dot?: boolean
  dotColor?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  removable?: boolean
  onRemove?: () => void
  interactive?: boolean
}

function Badge({
  className,
  variant,
  size,
  shape,
  pulse,
  dot,
  dotColor,
  icon,
  iconPosition = 'left',
  removable,
  onRemove,
  interactive,
  children,
  ...props
}: BadgeProps) {
  const sizeIconClasses = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    default: "w-4 h-4",
    lg: "w-4 h-4",
  }

  return (
    <div
      className={cn(
        badgeVariants({ variant, size, shape }),
        pulse && "animate-pulse-soft",
        interactive && "cursor-pointer active:scale-95",
        removable && "pr-1",
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            pulse && "animate-pulse",
            dotColor || "bg-current"
          )}
        />
      )}
      {icon && iconPosition === 'left' && (
        <span className={cn("shrink-0 -ml-0.5", sizeIconClasses[size || 'default'])}>
          {icon}
        </span>
      )}
      <span className="inline-flex items-center">{children}</span>
      {icon && iconPosition === 'right' && (
        <span className={cn("shrink-0 -mr-0.5", sizeIconClasses[size || 'default'])}>
          {icon}
        </span>
      )}
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className={cn(
            "ml-0.5 p-0.5 rounded-full opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all",
            sizeIconClasses[size || 'default']
          )}
        >
          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

// Status Badge with animated dot
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant' | 'dot'> {
  status: "online" | "offline" | "busy" | "away" | "pending" | "dnd"
  showLabel?: boolean
}

function StatusBadge({ status, className, showLabel = true, children, size, ...props }: StatusBadgeProps) {
  const statusConfig = {
    online: { variant: "success" as const, dotClass: "bg-[var(--success)]", label: "Online", ring: "ring-[var(--success)]/30" },
    offline: { variant: "secondary" as const, dotClass: "bg-[var(--text-muted)]", label: "Offline", ring: "" },
    busy: { variant: "error" as const, dotClass: "bg-[var(--error)]", label: "Busy", ring: "ring-[var(--error)]/30" },
    away: { variant: "warning" as const, dotClass: "bg-[var(--warning)]", label: "Away", ring: "ring-[var(--warning)]/30" },
    pending: { variant: "info" as const, dotClass: "bg-[var(--info)]", label: "Pending", ring: "ring-[var(--info)]/30" },
    dnd: { variant: "error" as const, dotClass: "bg-[var(--error)]", label: "Do Not Disturb", ring: "" },
  }

  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} size={size} shape="pill" className={className} {...props}>
      <span className={cn(
        "w-2 h-2 rounded-full shrink-0 ring-2",
        status === 'online' && "animate-pulse",
        config.dotClass,
        config.ring
      )} />
      {showLabel && <span>{children || config.label}</span>}
    </Badge>
  )
}

// Counter Badge for notifications
export interface CounterBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  count: number
  max?: number
  variant?: "primary" | "error" | "warning" | "success"
  size?: "sm" | "default" | "lg"
  pulse?: boolean
}

function CounterBadge({
  count,
  max = 99,
  variant = "error",
  size = "default",
  pulse,
  className,
  ...props
}: CounterBadgeProps) {
  const variantClasses = {
    primary: "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_2px_8px_rgba(var(--primary-rgb),0.4)]",
    error: "bg-[var(--error)] text-white shadow-[0_2px_8px_rgba(239,68,68,0.4)]",
    warning: "bg-[var(--warning)] text-[var(--text-inverse)] shadow-[0_2px_8px_rgba(245,158,11,0.4)]",
    success: "bg-[var(--success)] text-white shadow-[0_2px_8px_rgba(34,197,94,0.4)]",
  }

  const sizeClasses = {
    sm: "min-w-[16px] h-[16px] px-1 text-[9px]",
    default: "min-w-[20px] h-[20px] px-1.5 text-[10px]",
    lg: "min-w-[24px] h-[24px] px-2 text-xs",
  }

  if (count <= 0) return null

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold transition-transform",
        variantClasses[variant],
        sizeClasses[size],
        pulse && "animate-pulse",
        className
      )}
      {...props}
    >
      {count > max ? `${max}+` : count}
    </span>
  )
}

// Pipeline Stage Badge - specialized for CRM pipeline
export interface PipelineBadgeProps extends Omit<BadgeProps, 'variant'> {
  stage: "new" | "contacted" | "visit" | "appointment" | "test" | "application" | "applicant" | "enrolled" | "lost"
}

function PipelineBadge({ stage, className, children, ...props }: PipelineBadgeProps) {
  const stageLabels: Record<string, string> = {
    new: "New Lead",
    contacted: "Contacted",
    visit: "Visit",
    appointment: "Appointment",
    test: "Test",
    application: "Application",
    applicant: "Applicant",
    enrolled: "Enrolled",
    lost: "Lost",
  }

  return (
    <Badge variant={stage} shape="pill" className={className} {...props}>
      {children || stageLabels[stage]}
    </Badge>
  )
}

// Badge Group - for displaying multiple badges
export interface BadgeGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number
  size?: "sm" | "default" | "lg"
}

function BadgeGroup({ children, max = 3, size = "default", className, ...props }: BadgeGroupProps) {
  const childArray = React.Children.toArray(children)
  const visibleBadges = childArray.slice(0, max)
  const hiddenCount = childArray.length - max

  return (
    <div className={cn("inline-flex items-center gap-1", className)} {...props}>
      {visibleBadges}
      {hiddenCount > 0 && (
        <Badge variant="secondary" size={size} shape="pill">
          +{hiddenCount}
        </Badge>
      )}
    </div>
  )
}

export { Badge, badgeVariants, StatusBadge, CounterBadge, PipelineBadge, BadgeGroup }
