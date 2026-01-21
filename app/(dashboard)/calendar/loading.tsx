export default function CalendarLoading() {
  return (
    <div className="min-h-screen p-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-28 bg-[var(--bg-hover)] rounded-lg mb-2" />
          <div className="h-4 w-40 bg-[var(--bg-hover)] rounded" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-10 bg-[var(--bg-hover)] rounded-lg" />
          <div className="h-10 w-10 bg-[var(--bg-hover)] rounded-lg" />
          <div className="h-10 w-32 bg-[var(--bg-hover)] rounded-full" />
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--bg-sunken)]">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="p-4 text-center">
              <div className="h-4 w-12 bg-[var(--bg-hover)] rounded mx-auto" />
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        {[...Array(5)].map((_, week) => (
          <div key={week} className="grid grid-cols-7 border-b border-[var(--border)] last:border-0">
            {[...Array(7)].map((_, day) => (
              <div key={day} className="min-h-[120px] p-2 border-r border-[var(--border)] last:border-0">
                <div className="h-6 w-6 bg-[var(--bg-hover)] rounded-full mb-2" />
                {day % 3 === 0 && (
                  <div className="space-y-1">
                    <div className="h-6 w-full bg-[var(--bg-hover)] rounded" />
                    {day % 2 === 0 && <div className="h-6 w-3/4 bg-[var(--bg-hover)] rounded" />}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
