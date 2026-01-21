import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ReportsLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Header Skeleton */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-4">
        <div className="h-8 w-32 bg-[var(--bg-depth-3)] rounded animate-pulse" />
        <div className="h-4 w-48 bg-[var(--bg-depth-3)] rounded animate-pulse mt-2" />
      </div>

      <div className="p-6 space-y-6">
        {/* Controls Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-9 w-24 bg-[var(--bg-depth-3)] rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 bg-[var(--bg-depth-3)] rounded-lg animate-pulse" />
            <div className="h-9 w-24 bg-[var(--bg-depth-3)] rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <Card>
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-10 w-28 bg-[var(--bg-depth-3)] rounded-lg animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-[var(--bg-depth-3)] rounded-xl animate-pulse" />
                  <div className="w-12 h-5 bg-[var(--bg-depth-3)] rounded animate-pulse" />
                </div>
                <div className="h-4 w-24 bg-[var(--bg-depth-3)] rounded animate-pulse mb-2" />
                <div className="h-8 w-16 bg-[var(--bg-depth-3)] rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="h-6 w-32 bg-[var(--bg-depth-3)] rounded animate-pulse" />
              <div className="h-4 w-48 bg-[var(--bg-depth-3)] rounded animate-pulse mt-1" />
            </CardHeader>
            <CardContent>
              <div className="h-[280px] bg-[var(--bg-depth-3)] rounded animate-pulse" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="h-6 w-32 bg-[var(--bg-depth-3)] rounded animate-pulse" />
              <div className="h-4 w-48 bg-[var(--bg-depth-3)] rounded animate-pulse mt-1" />
            </CardHeader>
            <CardContent>
              <div className="h-[240px] bg-[var(--bg-depth-3)] rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
