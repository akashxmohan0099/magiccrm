"use client";

import { useState, useRef, useEffect } from "react";
import {
  Clock, Pencil, MoreHorizontal, Copy, Trash2, Check, ToggleLeft, ToggleRight,
} from "lucide-react";
import type { Service } from "@/types/models";
import { useServicesStore } from "@/store/services";
import { useTeamStore } from "@/store/team";
import { minPrice, isFromPriced, resolveBuffer } from "@/lib/services/price";
import { resolveServiceCategoryName } from "@/lib/services/category";
import { ServiceLetterCard } from "./ServiceLetterCard";
import { MemberAvatarStack } from "./MemberAvatar";

export function ServiceRow({
  service,
  selectionMode,
  selected,
  onToggleSelected,
  onEdit,
  onDuplicate,
  onToggleEnabled,
  onDelete,
}: {
  service: Service;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelected: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleEnabled: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { getServiceMembers, categories: storeCategories } = useServicesStore();
  const { members } = useTeamStore();
  const resolvedCategory = resolveServiceCategoryName(service, storeCategories);
  const assignedIds = getServiceMembers(service.id);
  const activeMembers = members.filter((m) => m.status !== "inactive");
  const isAnyone = assignedIds.length === 0;
  const displayMembers = isAnyone
    ? activeMembers
    : activeMembers.filter((m) => assignedIds.includes(m.id));

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [menuOpen]);

  return (
    <div
      className={`flex items-center px-5 py-4 gap-4 hover:bg-surface/60 transition-colors group ${
        !service.enabled ? "opacity-60" : ""
      } ${selectionMode && selected ? "bg-primary/5" : ""}`}
    >
      {selectionMode && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelected();
          }}
          aria-checked={selected}
          role="checkbox"
          title={selected ? "Deselect" : "Select"}
          className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer flex-shrink-0 transition-colors ${
            selected
              ? "bg-primary border-primary text-white"
              : "bg-surface border-border-light hover:border-text-tertiary"
          }`}
        >
          {selected && <Check className="w-3 h-3" strokeWidth={3} />}
        </button>
      )}
      <button
        onClick={selectionMode ? onToggleSelected : onEdit}
        className="flex items-center gap-4 flex-1 min-w-0 text-left cursor-pointer"
      >
        <ServiceLetterCard name={service.name} category={resolvedCategory} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-x-5 gap-y-1 flex-wrap">
            <p className="text-[14px] font-medium text-foreground truncate">
              {service.name}
            </p>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-[12px] text-text-tertiary tabular-nums flex items-center gap-1">
                <Clock className="w-3 h-3" /> {service.duration}min
                {(() => {
                  const { before, after } = resolveBuffer(service);
                  const total = before + after;
                  return total > 0 ? `+${total}` : "";
                })()}
              </span>
              <span className="text-[12px] font-semibold text-foreground tabular-nums whitespace-nowrap">
                {isFromPriced(service) &&
                  !(service.priceType === "from" && service.priceMax != null && service.priceMax > minPrice(service)) && (
                    <span className="text-[10px] text-text-tertiary font-medium mr-0.5">From</span>
                  )}
                ${minPrice(service)}
                {service.priceType === "from" &&
                  service.priceMax != null &&
                  service.priceMax > minPrice(service) &&
                  `–$${service.priceMax}`}
              </span>
            </div>
            {displayMembers.length > 0 && (
              <MemberAvatarStack members={displayMembers} isAnyone={isAnyone} />
            )}
            <div className="flex items-center gap-1.5 flex-wrap">
              {!service.enabled && (
                <span className="text-[9px] font-semibold text-text-tertiary bg-surface px-1.5 py-0.5 rounded">
                  Inactive
                </span>
              )}
              {service.isPackage && (
                <span className="text-[9px] font-semibold text-fuchsia-600 bg-fuchsia-50 px-1.5 py-0.5 rounded">
                  Bundle
                </span>
              )}
              {service.requiresConfirmation && (
                <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                  Approval
                </span>
              )}
              {service.depositType !== "none" && (
                <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  Deposit
                </span>
              )}
              {/* Studio/Mobile badge dropped — Location.kind drives this now;
                  the badge would need a per-location join to be honest. */}
            </div>
          </div>
          {service.description && (
            <p className="text-[12px] text-text-tertiary truncate mt-1">
              {service.description}
            </p>
          )}
        </div>
      </button>

      {/* Settings — far right */}
      <div className={`flex items-center gap-1 flex-shrink-0 ${selectionMode ? "hidden" : ""}`}>
        <button
          onClick={onEdit}
          title="Edit service"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-text-secondary hover:text-foreground hover:bg-surface cursor-pointer transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Edit</span>
        </button>
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            title="More"
            className="p-1.5 rounded-lg text-text-secondary hover:text-foreground hover:bg-surface cursor-pointer transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-10 bg-card-bg border border-border-light rounded-lg shadow-lg py-1 min-w-[160px]">
              <button
                onClick={() => {
                  onDuplicate();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-[13px] text-foreground hover:bg-surface cursor-pointer flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
        <button
          onClick={onToggleEnabled}
          className="cursor-pointer p-1"
          aria-label={service.enabled ? "Mark inactive" : "Mark active"}
          title={service.enabled ? "Active — click to mark inactive" : "Inactive — click to mark active"}
        >
          {service.enabled ? (
            <ToggleRight className="w-6 h-6 text-emerald-500" />
          ) : (
            <ToggleLeft className="w-6 h-6 text-text-tertiary" />
          )}
        </button>
      </div>
    </div>
  );
}
