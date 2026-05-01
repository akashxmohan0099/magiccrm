"use client";

import { useState } from "react";
import { Plus, Trash2, X, MapPin } from "lucide-react";
import { useLocationsStore } from "@/store/locations";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LocationsManagerModal({ open, onClose }: Props) {
  const { locations, addLocation, updateLocation, deleteLocation } = useLocationsStore();
  const { workspaceId } = useAuth();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [kind, setKind] = useState<"studio" | "mobile">("studio");

  if (!open) return null;

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    // Same dedupe behavior as categories — without it, two locations with
    // identical names are visually indistinguishable in the row UI.
    const existing = locations.some(
      (l) => l.name.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    if (existing) {
      toast(`A location named "${trimmed}" already exists`, "error");
      return;
    }
    addLocation(
      {
        workspaceId: workspaceId ?? "",
        name: trimmed,
        address: address.trim() || undefined,
        kind,
        enabled: true,
        sortOrder: locations.length,
      },
      workspaceId || undefined,
    );
    setName("");
    setAddress("");
    setKind("studio");
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
            <MapPin className="w-4 h-4 text-primary" />
            <p className="text-[15px] font-semibold text-foreground">Locations</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-tertiary hover:text-foreground hover:bg-surface rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-auto">
          {locations.length > 0 && (
            <div className="space-y-2">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-start gap-3 bg-surface border border-border-light rounded-lg px-3 py-2.5"
                >
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <input
                      type="text"
                      value={loc.name}
                      onChange={(e) =>
                        updateLocation(
                          loc.id,
                          { name: e.target.value },
                          workspaceId || undefined,
                        )
                      }
                      className="w-full bg-transparent outline-none text-[13px] font-medium text-foreground"
                    />
                    <input
                      type="text"
                      value={loc.address ?? ""}
                      placeholder="Address (optional)"
                      onChange={(e) =>
                        updateLocation(
                          loc.id,
                          { address: e.target.value || undefined },
                          workspaceId || undefined,
                        )
                      }
                      className="w-full bg-transparent outline-none text-[12px] text-text-tertiary placeholder:text-text-tertiary"
                    />
                  </div>
                  <select
                    value={loc.kind}
                    onChange={(e) =>
                      updateLocation(
                        loc.id,
                        { kind: e.target.value as "studio" | "mobile" },
                        workspaceId || undefined,
                      )
                    }
                    className="bg-card-bg border border-border-light rounded text-[12px] px-1.5 py-0.5 mt-0.5"
                  >
                    <option value="studio">Studio</option>
                    <option value="mobile">Mobile</option>
                  </select>
                  <button
                    onClick={() =>
                      deleteLocation(loc.id, workspaceId || undefined)
                    }
                    className="p-1 text-text-tertiary hover:text-red-500 cursor-pointer mt-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="bg-card-bg border border-border-light rounded-lg p-4 space-y-2">
            <p className="text-[12px] font-semibold text-foreground">Add a location</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Location name (e.g. Main Studio, Downtown)"
              className={inputClass}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Address (optional)"
              className={inputClass}
            />
            <div className="flex items-center gap-2">
              {(["studio", "mobile"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border cursor-pointer capitalize ${
                    kind === k
                      ? "bg-primary text-white border-primary"
                      : "bg-surface text-text-secondary border-border-light"
                  }`}
                >
                  {k}
                </button>
              ))}
              <div className="flex-1" />
              <Button size="sm" onClick={handleAdd} disabled={!name.trim()}>
                <Plus className="w-4 h-4 mr-1.5" /> Add
              </Button>
            </div>
          </div>

          {locations.length === 0 && (
            <p className="text-[12px] text-text-tertiary text-center">
              No locations yet. Add one above to enable per-location service availability.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
