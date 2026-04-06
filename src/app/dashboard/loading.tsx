/**
 * Dashboard loading skeleton shown while page components are loading.
 * Next.js convention file -- renders automatically during navigation.
 */
export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 bg-surface rounded-lg" />
          <div className="h-4 w-72 bg-surface rounded-lg mt-2" />
        </div>
        <div className="h-10 w-32 bg-surface rounded-xl" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-card-bg border border-border-light rounded-xl p-4"
          >
            <div className="h-3 w-20 bg-surface rounded mb-3" />
            <div className="h-7 w-16 bg-surface rounded-lg" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border-light flex items-center gap-3">
          <div className="h-9 w-64 bg-surface rounded-lg" />
          <div className="h-9 w-24 bg-surface rounded-lg" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="p-4 border-b border-border-light last:border-b-0 flex items-center gap-4"
          >
            <div className="h-9 w-9 bg-surface rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-surface rounded" />
              <div className="h-3 w-56 bg-surface rounded" />
            </div>
            <div className="h-6 w-16 bg-surface rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
