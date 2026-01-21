export default function DashboardLoading() {
  return (
    <div className="min-h-screen p-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-40 bg-[var(--bg-hover)] rounded-lg mb-2" />
          <div className="h-4 w-56 bg-[var(--bg-hover)] rounded" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-10 bg-[var(--bg-hover)] rounded-lg" />
          <div className="h-10 w-28 bg-[var(--bg-hover)] rounded-full" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-[var(--bg-hover)] rounded-xl" />
              <div className="h-6 w-16 bg-[var(--bg-hover)] rounded-full" />
            </div>
            <div className="h-8 w-20 bg-[var(--bg-hover)] rounded mb-1" />
            <div className="h-4 w-24 bg-[var(--bg-hover)] rounded" />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1 */}
        <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-5 w-32 bg-[var(--bg-hover)] rounded" />
            <div className="h-8 w-24 bg-[var(--bg-hover)] rounded-lg" />
          </div>
          <div className="h-[280px] bg-[var(--bg-hover)] rounded-lg" />
        </div>

        {/* Chart 2 */}
        <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-5 w-28 bg-[var(--bg-hover)] rounded" />
            <div className="h-8 w-24 bg-[var(--bg-hover)] rounded-lg" />
          </div>
          <div className="h-[280px] bg-[var(--bg-hover)] rounded-lg" />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] p-6">
          <div className="h-5 w-28 bg-[var(--bg-hover)] rounded mb-4" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-[var(--border)] last:border-0">
                <div className="h-10 w-10 bg-[var(--bg-hover)] rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-40 bg-[var(--bg-hover)] rounded mb-2" />
                  <div className="h-3 w-24 bg-[var(--bg-hover)] rounded" />
                </div>
                <div className="h-6 w-16 bg-[var(--bg-hover)] rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] p-6">
          <div className="h-5 w-32 bg-[var(--bg-hover)] rounded mb-4" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-sunken)]">
                <div className="h-8 w-8 bg-[var(--bg-hover)] rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-[var(--bg-hover)] rounded mb-1" />
                  <div className="h-3 w-16 bg-[var(--bg-hover)] rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
