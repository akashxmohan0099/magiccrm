"use client";

import { useState } from "react";
import { Plus, Trash2, X, Box } from "lucide-react";
import { useResourcesStore } from "@/store/resources";
import { useLocationsStore } from "@/store/locations";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ResourcesManagerModal({ open, onClose }: Props) {
  const { resources, addResource, updateResource, deleteResource } = useResourcesStore();
  const { locations } = useLocationsStore();
  const { workspaceId } = useAuth();
  const [name, setName] = useState("");
  const [kind, setKind] = useState("");
  // For the "add new" form: which locations the resource lives at. Empty
  // means "available at every location" — same convention as the edit row.
  const [draftLocationIds, setDraftLocationIds] = useState<string[]>([]);

  // Only surface the picker when the workspace has 2+ locations. With 0 or 1
  // there's nothing meaningful to pick — the resource is implicitly tied to
  // the only location.
  const showLocationPicker = locations.length >= 2;

  if (!open) return null;

  const toggleDraftLocation = (id: string) =>
    setDraftLocationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const toggleResourceLocation = (resourceId: string, locId: string) => {
    const r = resources.find((x) => x.id === resourceId);
    if (!r) return;
    const current = r.locationIds ?? [];
    const next = current.includes(locId)
      ? current.filter((x) => x !== locId)
      : [...current, locId];
    updateResource(
      resourceId,
      { locationIds: next.length === 0 ? undefined : next },
      workspaceId || undefined,
    );
  };

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addResource(
      {
        workspaceId: workspaceId ?? "",
        name: trimmed,
        kind: kind.trim() || undefined,
        enabled: true,
        sortOrder: resources.length,
        locationIds: draftLocationIds.length > 0 ? draftLocationIds : undefined,
      },
      workspaceId || undefined,
    );
    setName("");
    setKind("");
    setDraftLocationIds([]);
  };

  const inputClass =
    "w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card-bg border border-border-light rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-primary" />
            <p className="text-[15px] font-semibold text-foreground">Resources</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-tertiary hover:text-foreground hover:bg-surface rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-auto">
          <p className="text-[12px] text-text-tertiary">
            Bookable rooms, chairs, machines. A booking reserves required resources for its full envelope — slots are rejected when a needed resource is busy, even if the artist is free.
          </p>

          {resources.length > 0 && (
            <div className="space-y-2">
              {resources.map((r) => {
                const assigned = r.locationIds ?? [];
                const allLocations = assigned.length === 0;
                return (
                  <div
                    key={r.id}
                    className="bg-surface border border-border-light rounded-lg px-3 py-2.5 space-y-2"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={r.name}
                        onChange={(e) =>
                          updateResource(
                            r.id,
                            { name: e.target.value },
                            workspaceId || undefined,
                          )
                        }
                        className="flex-1 bg-transparent outline-none text-[13px] font-medium text-foreground"
                      />
                      <input
                        type="text"
                        value={r.kind ?? ""}
                        placeholder="Kind"
                        onChange={(e) =>
                          updateResource(
                            r.id,
                            { kind: e.target.value },
                            workspaceId || undefined,
                          )
                        }
                        className="bg-card-bg border border-border-light rounded text-[12px] px-1.5 py-0.5 w-24"
                      />
                      <button
                        onClick={() => deleteResource(r.id, workspaceId || undefined)}
                        className="p-1 text-text-tertiary hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {showLocationPicker && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] text-text-tertiary">
                          {allLocations
                            ? "Available at every location."
                            : `Limited to ${assigned.length} of ${locations.length} locations.`}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {locations.map((loc) => {
                            const selected = allLocations || assigned.includes(loc.id);
                            return (
                              <button
                                key={loc.id}
                                type="button"
                                onClick={() => toggleResourceLocation(r.id, loc.id)}
                                className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                                  selected
                                    ? "bg-primary/10 border-primary/40 text-primary"
                                    : "bg-card-bg border-border-light text-text-secondary hover:border-foreground/15"
                                }`}
                              >
                                {loc.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="bg-card-bg border border-border-light rounded-lg p-4 space-y-2">
            <p className="text-[12px] font-semibold text-foreground">Add a resource</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (e.g. Treatment Room A, Pedicure Chair 2)"
              className={inputClass}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />
            <input
              type="text"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              placeholder="Kind (optional — Room, Chair, Machine, …)"
              className={inputClass}
            />
            {showLocationPicker && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] text-text-tertiary">
                  {draftLocationIds.length === 0
                    ? "Available at every location."
                    : `Limited to ${draftLocationIds.length} of ${locations.length} locations.`}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {locations.map((loc) => {
                    const selected =
                      draftLocationIds.length === 0 || draftLocationIds.includes(loc.id);
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => toggleDraftLocation(loc.id)}
                        className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                          selected
                            ? "bg-primary/10 border-primary/40 text-primary"
                            : "bg-surface border-border-light text-text-secondary hover:border-foreground/15"
                        }`}
                      >
                        {loc.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button size="sm" onClick={handleAdd} disabled={!name.trim()}>
                <Plus className="w-4 h-4 mr-1.5" /> Add
              </Button>
            </div>
          </div>

          {resources.length === 0 && (
            <p className="text-[12px] text-text-tertiary text-center">
              No resources yet. Add one above to start tracking room/chair availability.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
