"use client";

import { ReactNode, DragEvent, useState } from "react";
import { motion } from "framer-motion";

export interface KanbanColumn<T> {
  id: string;
  label: string;
  color: string;
  items: T[];
}

interface KanbanBoardProps<T> {
  columns: KanbanColumn<T>[];
  keyExtractor: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  onMove: (itemId: string, toColumnId: string) => void;
}

export function KanbanBoard<T>({
  columns,
  keyExtractor,
  renderCard,
  onMove,
}: KanbanBoardProps<T>) {
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDragStart = (e: DragEvent, itemId: string) => {
    e.dataTransfer.setData("text/plain", itemId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(itemId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverCol(null);
  };

  const handleDrop = (e: DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverCol(null);
    setDraggingId(null);
    const itemId = e.dataTransfer.getData("text/plain");
    if (itemId) onMove(itemId, columnId);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
      {columns.map((col, colIdx) => (
        <motion.div
          key={col.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: colIdx * 0.05 }}
          className={`flex-shrink-0 w-72 rounded-xl p-3 transition-all duration-200 ${
            dragOverCol === col.id
              ? "bg-brand-light/50 ring-2 ring-brand/20 scale-[1.01]"
              : "bg-surface/70"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
          onDragLeave={() => setDragOverCol(null)}
          onDrop={(e) => handleDrop(e, col.id)}
        >
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
            <span className="text-sm font-semibold text-foreground tracking-tight">{col.label}</span>
            <span className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full bg-background text-[11px] font-semibold text-text-secondary">
              {col.items.length}
            </span>
          </div>
          <div className="space-y-2 min-h-[80px]">
            {col.items.map((item, idx) => (
              <motion.div
                key={keyExtractor(item)}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: draggingId === keyExtractor(item) ? 0.5 : 1,
                  scale: draggingId === keyExtractor(item) ? 0.95 : 1,
                }}
                transition={{ delay: idx * 0.03, duration: 0.2 }}
                draggable
                onDragStart={(e) => handleDragStart(e as unknown as DragEvent, keyExtractor(item))}
                onDragEnd={handleDragEnd}
                className="cursor-grab active:cursor-grabbing"
              >
                {renderCard(item)}
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
