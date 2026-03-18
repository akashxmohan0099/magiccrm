"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string;
}

export function DataTable<T>({ columns, data, onRowClick, keyExtractor }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal == null || bVal == null) return 0;
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl bg-card-bg shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-light">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-3 ${
                  col.sortable ? "cursor-pointer select-none hover:text-foreground transition-colors" : ""
                }`}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div className="flex items-center gap-1.5">
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      {sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </motion.div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((item, index) => (
            <motion.tr
              key={keyExtractor(item)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.02, duration: 0.2 }}
              onClick={() => onRowClick?.(item)}
              className={`border-t border-border-light transition-colors ${
                onRowClick ? "cursor-pointer hover:bg-surface/60" : ""
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3.5 text-sm text-foreground">
                  {col.render
                    ? col.render(item)
                    : String((item as Record<string, unknown>)[col.key] ?? "")}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
