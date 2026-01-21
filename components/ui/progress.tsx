"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Progress Bar Component
export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  showValue?: boolean
  size?: "sm" | "md" | "lg"
  variant?: "default" | "success" | "warning" | "error" | "gradient"
  animated?: boolean
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value, max = 100, showValue, size = "md", variant = "default", animated = true, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    const sizeClasses = {
      sm: "h-1.5",
      md: "h-2.5",
      lg: "h-4",
    }

    const variantClasses = {
      default: "bg-[var(--primary)]",
      success: "bg-[var(--success)]",
      warning: "bg-[var(--warning)]",
      error: "bg-[var(--error)]",
      gradient: "bg-gradient-to-r from-[#36D1C4] to-[#5DCCB3]",
    }

    return (
      <div className={cn("w-full", className)} ref={ref} {...props}>
        <div className={cn("w-full bg-[var(--bg-depth-4)] rounded-full overflow-hidden", sizeClasses[size])}>
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              variantClasses[variant],
              animated && "relative overflow-hidden"
            )}
            style={{ width: `${percentage}%` }}
          >
            {animated && (
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                style={{
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s linear infinite'
                }}
              />
            )}
          </div>
        </div>
        {showValue && (
          <div className="flex justify-between mt-1.5 text-xs text-[var(--text-secondary)]">
            <span>{value}</span>
            <span>{max}</span>
          </div>
        )}
      </div>
    )
  }
)
ProgressBar.displayName = "ProgressBar"

// Progress Ring Component
export interface ProgressRingProps extends React.SVGAttributes<SVGSVGElement> {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  showValue?: boolean
  variant?: "default" | "success" | "warning" | "error" | "gradient"
  label?: string
}

const ProgressRing = React.forwardRef<SVGSVGElement, ProgressRingProps>(
  ({
    className,
    value,
    max = 100,
    size = 80,
    strokeWidth = 8,
    showValue = true,
    variant = "default",
    label,
    ...props
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    const variantColors = {
      default: "var(--primary)",
      success: "var(--success)",
      warning: "var(--warning)",
      error: "var(--error)",
      gradient: "url(#progressGradient)",
    }

    return (
      <div className={cn("relative inline-flex items-center justify-center", className)}>
        <svg
          ref={ref}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
          {...props}
        >
          {variant === "gradient" && (
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="50%" stopColor="var(--secondary)" />
                <stop offset="100%" stopColor="var(--accent)" />
              </linearGradient>
            </defs>
          )}
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--bg-depth-4)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={variantColors[variant]}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {(showValue || label) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {showValue && (
              <span className="text-lg font-bold text-[var(--text-primary)]">
                {Math.round(percentage)}%
              </span>
            )}
            {label && (
              <span className="text-xs text-[var(--text-secondary)] mt-0.5">{label}</span>
            )}
          </div>
        )}
      </div>
    )
  }
)
ProgressRing.displayName = "ProgressRing"

// Stepper Component
export interface StepperProps {
  steps: { label: string; description?: string }[]
  currentStep: number
  className?: string
}

function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("stepper", className)}>
      {steps.map((step, index) => {
        const status = index < currentStep ? "completed" : index === currentStep ? "active" : "pending"
        const isLast = index === steps.length - 1

        return (
          <div key={index} className={cn("stepper-item", status)}>
            <div className="flex flex-col items-center">
              <div className="stepper-circle">
                {status === "completed" ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <p className={cn(
                  "text-sm font-medium",
                  status === "active" ? "text-[var(--primary)]" : "text-[var(--text-secondary)]"
                )}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{step.description}</p>
                )}
              </div>
            </div>
            {!isLast && <div className="stepper-line" />}
          </div>
        )
      })}
    </div>
  )
}

export { ProgressBar, ProgressRing, Stepper }
