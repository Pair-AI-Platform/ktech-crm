"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'suffix'> {
  error?: boolean | string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  suffix?: React.ReactNode
  prefix?: React.ReactNode
  variant?: 'default' | 'filled' | 'ghost' | 'glass'
  inputSize?: 'sm' | 'default' | 'lg'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon, iconPosition = 'left', suffix, prefix, variant = 'default', inputSize = 'default', ...props }, ref) => {
    const hasError = Boolean(error)

    // Taller line-height fills the fixed-height box so Arabic descenders aren't clipped
    const sizeClasses = {
      sm: "h-9 px-3 text-xs rounded-md leading-5",
      default: "h-11 px-4 text-sm rounded-lg leading-6",
      lg: "h-12 px-5 text-base rounded-lg leading-7"
    }

    const variantClasses = {
      default: cn(
        "bg-[var(--bg-surface)] border",
        hasError
          ? "border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error-muted)]"
          : "border-[var(--border)] hover:border-[var(--border-emphasis)] focus:border-[var(--primary)] focus:ring-[var(--primary-muted)]"
      ),
      filled: cn(
        "bg-[var(--bg-sunken)] border border-transparent",
        hasError
          ? "bg-[var(--error-bg)] focus:ring-[var(--error-muted)]"
          : "hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-surface)] focus:border-[var(--primary)] focus:ring-[var(--primary-muted)]"
      ),
      ghost: cn(
        "bg-transparent border-0",
        hasError
          ? "focus:ring-[var(--error-muted)]"
          : "hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-sunken)] focus:ring-[var(--primary-muted)]"
      ),
      glass: cn(
        "bg-[var(--bg-surface)] border",
        hasError
          ? "border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error-muted)]"
          : "border-[var(--border)] hover:border-[var(--border-emphasis)] focus:border-[var(--primary)] focus:ring-[var(--primary-muted)]"
      )
    }

    const inputClasses = cn(
      "flex w-full py-2 text-[var(--text-primary)] transition-all duration-200",
      sizeClasses[inputSize],
      variantClasses[variant],
      "placeholder:text-[var(--text-muted)]",
      "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-offset-[var(--bg-base)]",
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--bg-sunken)]",
      "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--primary)]",
      icon && iconPosition === 'left' && (inputSize === 'sm' ? "pl-9" : inputSize === 'lg' ? "pl-12" : "pl-11"),
      icon && iconPosition === 'right' && (inputSize === 'sm' ? "pr-9" : inputSize === 'lg' ? "pr-12" : "pr-11"),
      prefix && (inputSize === 'sm' ? "pl-9" : inputSize === 'lg' ? "pl-12" : "pl-11"),
      suffix && (inputSize === 'sm' ? "pr-9" : inputSize === 'lg' ? "pr-12" : "pr-11"),
      className
    )

    const iconWrapperClasses = cn(
      "absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors duration-200 pointer-events-none",
      "group-focus-within:text-[var(--primary)]",
      hasError && "text-[var(--error)] group-focus-within:text-[var(--error)]"
    )

    const iconSize = inputSize === 'sm' ? "w-4 h-4" : inputSize === 'lg' ? "w-5 h-5" : "w-4.5 h-4.5"

    if (icon || prefix || suffix) {
      return (
        <div className="relative group">
          {(icon && iconPosition === 'left') && (
            <div className={cn(iconWrapperClasses, inputSize === 'sm' ? "left-3" : inputSize === 'lg' ? "left-4" : "left-3.5")}>
              <span className={iconSize}>{icon}</span>
            </div>
          )}
          {prefix && (
            <div className={cn(iconWrapperClasses, inputSize === 'sm' ? "left-3" : inputSize === 'lg' ? "left-4" : "left-3.5")}>
              {prefix}
            </div>
          )}
          <input
            type={type}
            className={inputClasses}
            ref={ref}
            {...props}
          />
          {(icon && iconPosition === 'right') && (
            <div className={cn(iconWrapperClasses, inputSize === 'sm' ? "right-3" : inputSize === 'lg' ? "right-4" : "right-3.5")}>
              <span className={iconSize}>{icon}</span>
            </div>
          )}
          {suffix && (
            <div className={cn(iconWrapperClasses.replace('pointer-events-none', ''), inputSize === 'sm' ? "right-3" : inputSize === 'lg' ? "right-4" : "right-3.5")}>
              {suffix}
            </div>
          )}
        </div>
      )
    }

    return (
      <input
        type={type}
        className={inputClasses}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

// Search Input with clear button
export interface SearchInputProps extends Omit<InputProps, 'icon' | 'suffix' | 'prefix'> {
  onClear?: () => void
  searchSize?: 'sm' | 'default' | 'lg'
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onClear, searchSize = 'default', ...props }, ref) => {
    const sizeClasses = {
      sm: "h-9 pl-9 pr-9 text-xs rounded-md",
      default: "h-10 pl-11 pr-10 text-sm rounded-lg",
      lg: "h-12 pl-12 pr-11 text-base rounded-lg"
    }

    const iconLeftClasses = {
      sm: "left-3 w-3.5 h-3.5",
      default: "left-3.5 w-4 h-4",
      lg: "left-4 w-5 h-5"
    }

    const iconRightClasses = {
      sm: "right-2.5 w-3.5 h-3.5 p-0.5",
      default: "right-3 w-4 h-4 p-0.5",
      lg: "right-3.5 w-5 h-5 p-0.5"
    }

    return (
      <div className="relative group">
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors duration-200 group-focus-within:text-[var(--primary)]",
          iconLeftClasses[searchSize]
        )}>
          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={value}
          className={cn(
            "flex w-full border bg-[var(--bg-sunken)] py-2 text-[var(--text-primary)] transition-all duration-200",
            sizeClasses[searchSize],
            "placeholder:text-[var(--text-muted)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--primary-muted)] focus:ring-offset-0 focus:bg-[var(--bg-surface)]",
            "border-transparent hover:bg-[var(--bg-hover)] focus:border-[var(--primary)]",
            className
          )}
          ref={ref}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full transition-all duration-200",
              iconRightClasses[searchSize]
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
)
SearchInput.displayName = "SearchInput"

// Textarea
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string
  variant?: 'default' | 'filled' | 'ghost'
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, variant = 'default', ...props }, ref) => {
    const hasError = Boolean(error)

    const variantClasses = {
      default: cn(
        "bg-[var(--bg-surface)] border",
        hasError
          ? "border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error-muted)]"
          : "border-[var(--border)] hover:border-[var(--border-emphasis)] focus:border-[var(--primary)] focus:ring-[var(--primary-muted)]"
      ),
      filled: cn(
        "bg-[var(--bg-sunken)] border border-transparent",
        hasError
          ? "bg-[var(--error-bg)] focus:ring-[var(--error-muted)]"
          : "hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-surface)] focus:border-[var(--primary)] focus:ring-[var(--primary-muted)]"
      ),
      ghost: cn(
        "bg-transparent border-0",
        hasError
          ? "focus:ring-[var(--error-muted)]"
          : "hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-sunken)] focus:ring-[var(--primary-muted)]"
      )
    }

    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] transition-all duration-200 resize-none",
          variantClasses[variant],
          "placeholder:text-[var(--text-muted)]",
          "focus:outline-none focus:ring-2 focus:ring-offset-0",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--bg-sunken)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

// Form Label
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

const FormLabel = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label
        className={cn(
          "text-sm font-medium text-[var(--text-primary)] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
        {required && <span className="text-[var(--error)] ml-0.5">*</span>}
      </label>
    )
  }
)
FormLabel.displayName = "FormLabel"

// Helper text
export interface HelperTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  error?: boolean
}

const HelperText = React.forwardRef<HTMLParagraphElement, HelperTextProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <p
        className={cn(
          "text-xs mt-1.5",
          error ? "text-[var(--error)]" : "text-[var(--text-muted)]",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </p>
    )
  }
)
HelperText.displayName = "HelperText"

export { Input, SearchInput, Textarea, FormLabel, HelperText }
