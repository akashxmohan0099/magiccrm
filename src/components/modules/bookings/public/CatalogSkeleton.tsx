"use client";

/**
 * Loading-state placeholder shaped like the real catalog. Two-section,
 * card-shaped pulses so layout doesn't reflow when real data arrives.
 */
export function CatalogSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      {[0, 1].map((sectionIdx) => (
        <section key={sectionIdx}>
          <div className="h-5 w-32 rounded bg-surface mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card-bg border border-border-light rounded-2xl p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-surface rounded" />
                    <div className="h-3 w-1/2 bg-surface rounded" />
                  </div>
                  <div className="w-9 h-9 rounded-full bg-surface flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
