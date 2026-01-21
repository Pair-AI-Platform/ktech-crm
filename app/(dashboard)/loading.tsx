import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[var(--primary)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-foreground)]" />
        </div>
        <p className="text-[var(--text-muted)]">Loading...</p>
      </div>
    </div>
  )
}
