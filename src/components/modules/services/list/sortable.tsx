"use client";

import { GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Service } from "@/types/models";
import { UNCATEGORIZED } from "./category-colors";

export function SortableServiceList({
  services,
  onReorder,
  selectionMode,
  renderItem,
}: {
  services: Service[];
  onReorder: (newOrder: Service[]) => void;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelected: (id: string) => void;
  renderItem: (service: Service) => React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = services.findIndex((s) => s.id === active.id);
    const newIdx = services.findIndex((s) => s.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    onReorder(arrayMove(services, oldIdx, newIdx));
  };

  // In selection mode, skip the dnd context entirely — drag conflicts with
  // checkbox clicks and the user is operating in a different mental mode.
  if (selectionMode) {
    return (
      <div className="divide-y divide-border-light">
        {services.map((service) => (
          <div key={service.id}>{renderItem(service)}</div>
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={services.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="divide-y divide-border-light">
          {services.map((service) => (
            <SortableRow key={service.id} id={service.id}>
              {renderItem(service)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// DndContext for the outer category list. The Uncategorized bucket is fixed
// to the bottom and never reorders, so it's excluded from the SortableContext
// items list and its SortableCategory is disabled.
export function CategoryDndContext({
  orderedNames,
  onReorder,
  disabled,
  children,
}: {
  orderedNames: string[];
  onReorder: (newOrder: string[]) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );
  // Only the non-Uncategorized names participate in sorting.
  const sortableIds = orderedNames.filter((n) => n !== UNCATEGORIZED);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = sortableIds.indexOf(String(active.id));
    const newIdx = sortableIds.indexOf(String(over.id));
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(sortableIds, oldIdx, newIdx);
    // Append Uncategorized back if it was in the original list, so the caller
    // sees a complete name list in render order.
    const finalOrder = orderedNames.includes(UNCATEGORIZED)
      ? [...reordered, UNCATEGORIZED]
      : reordered;
    onReorder(finalOrder);
  };

  if (disabled) return <>{children}</>;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

// Drag wrapper for the category card. Render-prop exposes the drag handle
// props so the category header can attach them to a small grip icon — drag
// triggers from the grip only, leaving the rest of the header clickable.
export function SortableCategory({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled?: boolean;
  children: (handleProps: {
    attributes: React.HTMLAttributes<HTMLElement>;
    listeners: React.HTMLAttributes<HTMLElement> | undefined;
  }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    opacity: isDragging ? 0.7 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners })}
    </div>
  );
}

export function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.6 : undefined,
  };
  // Drag handle sits absolutely within the row's existing left padding (px-5
  // on ServiceRow = 20px) so it doesn't shift the row's content rightward.
  return (
    <div ref={setNodeRef} style={style} className="group/row relative">
      <button
        type="button"
        {...attributes}
        {...listeners}
        title="Drag to reorder"
        className="absolute left-0 top-0 bottom-0 w-5 flex items-center justify-center text-text-tertiary opacity-0 group-hover/row:opacity-100 hover:text-foreground cursor-grab active:cursor-grabbing transition-opacity z-10"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      {children}
    </div>
  );
}
