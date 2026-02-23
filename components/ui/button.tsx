"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm hover:bg-[var(--primary-hover)] hover:shadow-md active:scale-[0.98] focus-visible:ring-[var(--primary)]",
        destructive:
          "bg-[var(--error)] text-white shadow-sm hover:bg-[var(--error)]/90 hover:shadow-md active:scale-[0.98] focus-visible:ring-[var(--error)]",
        outline:
          "border border-[var(--border)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-emphasis)] active:scale-[0.98]",
        secondary:
          "bg-[var(--bg-sunken)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] active:scale-[0.98]",
        ghost:
          "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] active:scale-[0.98]",
        link:
          "text-[var(--primary)] underline-offset-4 hover:underline p-0 h-auto",
        success:
          "bg-[var(--success)] text-white shadow-sm hover:bg-[var(--success)]/90 hover:shadow-md active:scale-[0.98] focus-visible:ring-[var(--success)]",
        accent:
          "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm hover:bg-[var(--accent-hover)] hover:shadow-md active:scale-[0.98] focus-visible:ring-[var(--accent)]",
        gradient:
          "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm hover:bg-[var(--primary-hover)] hover:shadow-md active:scale-[0.98] focus-visible:ring-[var(--primary)]",
        soft:
          "bg-[var(--primary-muted)] text-[var(--primary)] hover:bg-[var(--primary-subtle)] active:scale-[0.98]",
        "soft-success":
          "bg-[var(--success-bg)] text-[var(--success)] hover:bg-[var(--success-muted)] active:scale-[0.98]",
        "soft-warning":
          "bg-[var(--warning-bg)] text-[var(--warning)] hover:bg-[var(--warning-muted)] active:scale-[0.98]",
        "soft-error":
          "bg-[var(--error-bg)] text-[var(--error)] hover:bg-[var(--error-muted)] active:scale-[0.98]",
        glass:
          "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] shadow-sm active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5 py-2 rounded-lg [&_svg]:size-4",
        xs: "h-7 px-2.5 text-xs rounded-md [&_svg]:size-3.5",
        sm: "h-8 px-4 text-xs rounded-md [&_svg]:size-4",
        lg: "h-12 px-6 text-base rounded-lg [&_svg]:size-5",
        xl: "h-14 px-8 text-lg rounded-xl [&_svg]:size-5",
        icon: "h-10 w-10 rounded-lg [&_svg]:size-[18px]",
        "icon-xs": "h-7 w-7 rounded-md [&_svg]:size-3.5",
        "icon-sm": "h-8 w-8 rounded-md [&_svg]:size-4",
        "icon-lg": "h-12 w-12 rounded-lg [&_svg]:size-5",
        pill: "h-10 px-5 py-2 rounded-full [&_svg]:size-4",
        "pill-sm": "h-8 px-4 text-xs rounded-full [&_svg]:size-4",
        "pill-lg": "h-12 px-6 text-base rounded-full [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    // When using asChild, pass children directly without wrapping in Fragment
    // The Slot component will merge props onto the child element
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          disabled={disabled || loading}
          {...props}
        >
          {children}
        </Comp>
      )
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{typeof children === 'string' ? 'Loading...' : children}</span>
          </span>
        ) : (
          <>
            {leftIcon && <span className="shrink-0 -ml-0.5">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0 -mr-0.5">{rightIcon}</span>}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
