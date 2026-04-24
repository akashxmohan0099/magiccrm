"use client";

import { ReactNode, useEffect } from "react";
import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  useEffect(() => {
    document.title = `${title} · Magic`;
  }, [title]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6"
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
        {description && (
          <p className="text-text-secondary mt-1 text-sm">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">{actions}</div>}
    </motion.div>
  );
}
