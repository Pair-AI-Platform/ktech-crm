"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    size?: "xs" | "sm" | "md" | "lg" | "xl"
    status?: "online" | "offline" | "busy" | "away"
  }
>(({ className, size = "md", status, children, ...props }, ref) => {
  const sizeClasses = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  }

  const statusColors = {
    online: "bg-[var(--success)]",
    offline: "bg-[var(--text-muted)]",
    busy: "bg-[var(--error)]",
    away: "bg-[var(--warning)]",
  }

  return (
    <div className="relative inline-block">
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full border-2 border-[var(--border)] bg-[var(--bg-sunken)]",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </AvatarPrimitive.Root>
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-[var(--bg-surface)]",
            statusColors[status],
            size === "xs" && "h-1.5 w-1.5",
            size === "sm" && "h-2 w-2",
            size === "md" && "h-2.5 w-2.5",
            size === "lg" && "h-3 w-3",
            size === "xl" && "h-4 w-4"
          )}
        />
      )}
    </div>
  )
})
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-[var(--primary)] font-medium text-[var(--primary-foreground)]",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// Avatar Group Component
interface AvatarGroupProps {
  avatars: { src?: string; name: string }[]
  max?: number
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

function AvatarGroup({ avatars, max = 4, size = "md", className }: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max)
  const remainingCount = avatars.length - max

  const sizeClasses = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  }

  const overlapClasses = {
    xs: "-ml-2",
    sm: "-ml-2.5",
    md: "-ml-3",
    lg: "-ml-4",
  }

  return (
    <div className={cn("flex items-center", className)}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          size={size}
          className={cn(
            index > 0 && overlapClasses[size],
            "ring-2 ring-[var(--bg-surface)]"
          )}
        >
          {avatar.src ? (
            <AvatarImage src={avatar.src} alt={avatar.name} />
          ) : null}
          <AvatarFallback>
            {avatar.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-[var(--bg-sunken)] border-2 border-[var(--bg-surface)] font-semibold text-[var(--text-secondary)]",
            sizeClasses[size],
            overlapClasses[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}

// User Avatar with name
interface UserAvatarProps {
  user: { name: string; email?: string; avatar?: string }
  size?: "sm" | "md" | "lg"
  showEmail?: boolean
  className?: string
}

function UserAvatar({ user, size = "md", showEmail, className }: UserAvatarProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Avatar size={size}>
        {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
        <AvatarFallback>
          {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user.name}</p>
        {showEmail && user.email && (
          <p className="text-xs text-[var(--text-secondary)] truncate">{user.email}</p>
        )}
      </div>
    </div>
  )
}

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup, UserAvatar }
