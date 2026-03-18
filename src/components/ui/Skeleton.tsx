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
      {/* Sidebar skeleton */}
      <aside className="w-64 bg-card-bg border-r border-border-warm flex flex-col fixed h-full">
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
      <main className="flex-1 ml-64">
        <div className="bg-card-bg border-b border-border-warm px-8 py-4 flex items-center justify-between">
          <Skeleton className="w-64 h-10 rounded-lg" />
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
        </div>
        <div className="p-8">
          <Skeleton className="w-72 h-8 mb-2" />
          <Skeleton className="w-96 h-5 mb-8" />
          <div className="grid grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-6">
            <Skeleton className="col-span-2 h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
