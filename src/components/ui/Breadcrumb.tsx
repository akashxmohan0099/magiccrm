"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 mb-4" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />}
          {item.href ? (
            <Link
              href={item.href}
              className="text-[13px] text-text-secondary hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[13px] text-foreground font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
