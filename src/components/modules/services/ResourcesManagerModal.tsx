"use client";

import { useState } from "react";
import { Plus, Trash2, X, Box } from "lucide-react";
import { useResourcesStore } from "@/store/resources";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ResourcesManagerModal({ open, onClose }: Props) {
  const { resources, addResource, updateResource, deleteResource } = useResourcesStore();
  const { workspaceId } = useAuth();
  const [name, setName] = useState("");
  const [kind, setKind] = useState("");

  if (!open) return null;

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
      },
      workspaceId || undefined,
    );
    setName("");
    setKind("");
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
              {resources.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 bg-surface border border-border-light rounded-lg px-3 py-2.5"
                >
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
              ))}
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
