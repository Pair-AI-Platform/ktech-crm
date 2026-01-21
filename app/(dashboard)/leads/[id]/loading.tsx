export default function LeadDetailLoading() {
  return (
    <div className="min-h-screen p-6 space-y-6 animate-pulse">
      {/* Back button and header */}
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-[var(--bg-hover)] rounded-lg" />
        <div>
          <div className="h-7 w-48 bg-[var(--bg-hover)] rounded-lg mb-2" />
          <div className="h-4 w-32 bg-[var(--bg-hover)] rounded" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info Card */}
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] p-6">
            <div className="h-5 w-32 bg-[var(--bg-hover)] rounded mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <div className="h-3 w-20 bg-[var(--bg-hover)] rounded mb-2" />
                  <div className="h-5 w-32 bg-[var(--bg-hover)] rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Card */}
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] p-6">
            <div className="h-5 w-24 bg-[var(--bg-hover)] rounded mb-4" />
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-10 w-10 bg-[var(--bg-hover)] rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 w-48 bg-[var(--bg-hover)] rounded mb-2" />
                    <div className="h-3 w-32 bg-[var(--bg-hover)] rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] p-6">
            <div className="h-5 w-16 bg-[var(--bg-hover)] rounded mb-4" />
            <div className="h-8 w-full bg-[var(--bg-hover)] rounded-lg mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-20 bg-[var(--bg-hover)] rounded" />
                  <div className="h-4 w-16 bg-[var(--bg-hover)] rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Actions Card */}
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] p-6">
            <div className="h-5 w-20 bg-[var(--bg-hover)] rounded mb-4" />
            <div className="space-y-2">
              <div className="h-10 w-full bg-[var(--bg-hover)] rounded-lg" />
              <div className="h-10 w-full bg-[var(--bg-hover)] rounded-lg" />
              <div className="h-10 w-full bg-[var(--bg-hover)] rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
