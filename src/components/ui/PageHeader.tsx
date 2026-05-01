"use client";

import { ReactNode, useEffect } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

// Steady-state on first paint. The earlier framer-motion fade ran on every
// navigation on top of Next's skeleton-to-content transition, which read as
// the title flashing dimmed-gray for ~300ms before snapping in. The skeleton
// already provides enough motion; layering a second one was the bug.
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  useEffect(() => {
    document.title = `${title} · Magic`;
  }, [title]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
        {description && (
          <p className="text-text-secondary mt-1 text-sm">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">{actions}</div>}
    </div>
  );
}
