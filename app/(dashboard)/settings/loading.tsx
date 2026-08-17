export default function SettingsLoading() {
  return (
    <div className="min-h-screen p-6 animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-8 w-24 bg-[var(--bg-hover)] rounded-lg mb-2" />
        <div className="h-4 w-56 bg-[var(--bg-hover)] rounded" />
      </div>

      <div className="flex gap-8">
        {/* Sidebar Navigation */}
        <div className="w-56 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 w-full bg-[var(--bg-hover)] rounded-lg" />
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {/* Profile Section */}
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] p-6">
            <div className="h-5 w-20 bg-(--bg-hover) rounded mb-6" />

            <div className="flex items-start gap-6 mb-6">
              <div className="h-20 w-20 bg-[var(--bg-hover)] rounded-full" />
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="h-4 w-20 bg-[var(--bg-hover)] rounded mb-2" />
                    <div className="h-10 w-full bg-[var(--bg-hover)] rounded-lg" />
                  </div>
                  <div>
                    <div className="h-4 w-20 bg-[var(--bg-hover)] rounded mb-2" />
                    <div className="h-10 w-full bg-[var(--bg-hover)] rounded-lg" />
                  </div>
                </div>
                <div>
                  <div className="h-4 w-16 bg-[var(--bg-hover)] rounded mb-2" />
                  <div className="h-10 w-full bg-[var(--bg-hover)] rounded-lg" />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="h-10 w-28 bg-[var(--bg-hover)] rounded-full" />
            </div>
          </div>

          {/* Preferences Section */}
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] p-6">
            <div className="h-5 w-28 bg-[var(--bg-hover)] rounded mb-6" />

            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
                  <div>
                    <div className="h-4 w-32 bg-[var(--bg-hover)] rounded mb-1" />
                    <div className="h-3 w-48 bg-[var(--bg-hover)] rounded" />
                  </div>
                  <div className="h-6 w-12 bg-[var(--bg-hover)] rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
