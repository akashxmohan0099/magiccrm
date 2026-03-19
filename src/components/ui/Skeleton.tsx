"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar skeleton - hidden on mobile */}
      <aside className="hidden lg:flex w-[240px] bg-card-bg border-r border-border-light flex-col fixed h-full">
        <div className="p-5 border-b border-border-light">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <div>
              <Skeleton className="w-24 h-4 mb-1" />
              <Skeleton className="w-16 h-3" />
            </div>
          </div>
        </div>
        <div className="p-3 space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-10 rounded-lg" />
          ))}
        </div>
      </aside>

      {/* Main skeleton */}
      <main className="flex-1 ml-0 lg:ml-[240px]">
        <div className="bg-card-bg border-b border-border-light px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="w-10 h-10 rounded-lg lg:hidden" />
            <Skeleton className="w-full lg:w-64 h-10 rounded-lg" />
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
        </div>
        <div className="p-4 lg:p-8">
          <Skeleton className="w-48 sm:w-72 h-8 mb-2" />
          <Skeleton className="w-64 sm:w-96 h-5 mb-8" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="lg:col-span-2 h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
