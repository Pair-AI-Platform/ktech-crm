"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glow?: boolean
  glass?: boolean
  gradient?: boolean
  elevated?: boolean
  flat?: boolean
  interactive?: boolean
  padding?: 'none' | 'sm' | 'default' | 'lg'
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ className, hover, glow, glass, gradient, elevated, flat, interactive, padding, ...props }, ref) => {
    const paddingClasses = {
      none: "",
      sm: "p-4",
      default: "p-5",
      lg: "p-6"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] transition-all duration-200",
          !flat && "shadow-[var(--shadow-card)]",
          flat && "shadow-none",
          elevated && "shadow-[var(--shadow-lg)] border-transparent",
          hover && "hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-emphasis)] cursor-pointer",
          glow && "hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-emphasis)]",
          interactive && "cursor-pointer active:scale-[0.99]",
          padding && paddingClasses[padding],
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    compact?: boolean
    noPadding?: boolean
  }
>(({ className, compact, noPadding, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5",
      noPadding ? "" : compact ? "p-4 pb-3" : "p-6 pb-4",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & { as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' }
>(({ className, as: Comp = 'h3', ...props }, ref) => (
  <Comp
    ref={ref as React.Ref<HTMLHeadingElement>}
    className={cn(
      "text-lg font-semibold leading-tight tracking-tight text-[var(--text-primary)]",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[var(--text-secondary)] leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    compact?: boolean
    noPadding?: boolean
  }
>(({ className, compact, noPadding, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(noPadding ? "" : compact ? "p-4 pt-0" : "p-6 pt-0", className)}
    {...props}
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    compact?: boolean
    border?: boolean
  }
>(({ className, compact, border, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center",
      compact ? "p-4 pt-3" : "p-6 pt-4",
      border && "border-t border-[var(--border)] mt-auto",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Stat Card - Premium animated stat display
export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
  }
  loading?: boolean
  color?: "primary" | "success" | "warning" | "error" | "accent"
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, title, value, icon, trend, loading, color = "primary", ...props }, ref) => {
    const colorClasses = {
      primary: "text-[var(--primary)] bg-[var(--primary-muted)]",
      success: "text-[var(--success)] bg-[var(--success-bg)]",
      warning: "text-[var(--warning)] bg-[var(--warning-bg)]",
      error: "text-[var(--error)] bg-[var(--error-bg)]",
      accent: "text-[var(--accent)] bg-[var(--accent-muted)]",
    }

    return (
      <Card ref={ref} className={cn("relative overflow-hidden", className)} hover glow {...props}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
              {loading ? (
                <div className="h-8 w-20 skeleton rounded" />
              ) : (
                <p className="text-3xl font-display font-semibold tracking-tight stat-value text-[var(--text-primary)]">{value}</p>
              )}
              {trend && (
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  trend.value >= 0 ? "text-[var(--success)]" : "text-[var(--error)]"
                )}>
                  <span>{trend.value >= 0 ? "+" : ""}{trend.value}%</span>
                  <span className="text-[var(--text-muted)]">{trend.label}</span>
                </div>
              )}
            </div>
            {icon && (
              <div className={cn(
                "p-3 rounded-xl",
                colorClasses[color]
              )}>
                {icon}
              </div>
            )}
          </div>
        </CardContent>
        {/* Decorative line at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--border-emphasis)] opacity-30" />
      </Card>
    )
  }
)
StatCard.displayName = "StatCard"

// Section Header - Consistent typography for sections
export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  action?: React.ReactNode
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, title, description, action, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-start justify-between mb-4", className)}
      {...props}
    >
      <div className="space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-[var(--text-secondary)]">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
)
SectionHeader.displayName = "SectionHeader"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, StatCard, SectionHeader }
