"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-[rgba(31,29,26,0.5)]",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: "sm" | "md" | "lg" | "xl" | "full"
  showClose?: boolean
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, size = "md", showClose = true, ...props }, ref) => {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw] max-h-[95vh]",
  }

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 w-full translate-x-[-50%] translate-y-[-50%]",
          "bg-white dark:bg-[#111525]",
          "border border-[var(--border)] rounded-xl shadow-2xl",
          "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sunken)] transition-all opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 p-6 pb-4 border-b border-[var(--border)]",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end gap-3 p-6 pt-4 border-t border-[var(--border)]",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-[var(--text-primary)]",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-[var(--text-secondary)]", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

const DialogBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("p-6 overflow-y-auto max-h-[60vh]", className)}
    {...props}
  />
)
DialogBody.displayName = "DialogBody"

// Confirm Dialog Component
interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  onConfirm: () => void | Promise<void>
  loading?: boolean
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  loading,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" showClose={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sunken)] rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || isLoading}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-all",
              variant === "destructive"
                ? "bg-[var(--error)] text-white hover:bg-red-500"
                : "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]",
              (loading || isLoading) && "opacity-50 cursor-not-allowed"
            )}
          >
            {(loading || isLoading) ? "Loading..." : confirmText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogBody,
  ConfirmDialog,
}
