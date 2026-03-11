import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--bg-elevated)]",
        className
      )}
    />
  )
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-2xl border border-[var(--border)] p-5", className)}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  )
}

export function SkeletonTableRow({ columns = 7 }: { columns?: number }) {
  return (
    <tr className="border-b border-[var(--border)]">
      <td className="px-3 py-3">
        <Skeleton className="w-4 h-4 rounded" />
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div>
            <Skeleton className="h-3.5 w-28 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <Skeleton className="h-3.5 w-20" />
      </td>
      {Array.from({ length: columns - 3 }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <Skeleton className="h-5 w-16 rounded-full" />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonTable({ rows = 10, columns = 7 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-sunken)] px-3 py-2">
        <div className="flex gap-6">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-16" />
          ))}
        </div>
      </div>
      {/* Rows */}
      <table className="w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      {/* Pipeline */}
      <div className="rounded-2xl border border-[var(--border)] p-5">
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 flex-1 rounded-lg" />
          ))}
        </div>
      </div>
      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-[var(--border)] p-5">
            <Skeleton className="h-4 w-40 mb-4" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--border)] p-5">
            <Skeleton className="h-4 w-28 mb-4" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonReport() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex gap-4 items-center">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-[var(--border)] p-5">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
