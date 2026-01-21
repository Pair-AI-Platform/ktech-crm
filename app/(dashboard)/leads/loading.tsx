export default function LeadsLoading() {
  return (
    <div className="min-h-screen p-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-[var(--bg-hover)] rounded-lg mb-2" />
          <div className="h-4 w-48 bg-[var(--bg-hover)] rounded" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-[var(--bg-hover)] rounded-lg" />
          <div className="h-10 w-28 bg-[var(--bg-hover)] rounded-full" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
            <div className="h-3 w-16 bg-[var(--bg-hover)] rounded mb-2" />
            <div className="h-6 w-12 bg-[var(--bg-hover)] rounded" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="h-10 w-64 bg-[var(--bg-hover)] rounded-lg" />
        <div className="h-10 w-32 bg-[var(--bg-hover)] rounded-lg" />
        <div className="h-10 w-32 bg-[var(--bg-hover)] rounded-lg" />
      </div>

      {/* Table */}
      <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-[var(--border)] bg-[var(--bg-sunken)]">
          <div className="w-8" />
          <div className="h-4 w-32 bg-[var(--bg-hover)] rounded" />
          <div className="h-4 w-24 bg-[var(--bg-hover)] rounded" />
          <div className="h-4 w-28 bg-[var(--bg-hover)] rounded" />
          <div className="h-4 w-20 bg-[var(--bg-hover)] rounded" />
          <div className="h-4 w-24 bg-[var(--bg-hover)] rounded" />
        </div>
        {/* Rows */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-[var(--border)] last:border-0">
            <div className="h-8 w-8 bg-[var(--bg-hover)] rounded-full" />
            <div className="h-4 w-36 bg-[var(--bg-hover)] rounded" />
            <div className="h-4 w-28 bg-[var(--bg-hover)] rounded" />
            <div className="h-6 w-20 bg-[var(--bg-hover)] rounded-full" />
            <div className="h-4 w-24 bg-[var(--bg-hover)] rounded" />
            <div className="h-4 w-20 bg-[var(--bg-hover)] rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
