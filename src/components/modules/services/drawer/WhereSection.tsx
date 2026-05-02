"use client";

import { Check } from "lucide-react";
import { useLocationsStore } from "@/store/locations";
import { useResourcesStore } from "@/store/resources";
import type { FormState } from "./types";
import { Section } from "./Section";

export function WhereSection({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
}) {
  const locations = useLocationsStore((s) => s.locations);
  const resources = useResourcesStore((s) => s.resources);

  // Nothing to configure → hide the section entirely. With one location and
  // no resources, the operational picture is implicit.
  if (locations.length < 2 && resources.length === 0) return null;

  const hasData =
    form.locationIds.length > 0 || form.requiredResourceIds.length > 0;

  return (
    <Section
      title="Where & resources"
      defaultOpen={hasData}
      subtitle="Locations & required rooms or equipment"
    >
      {locations.length >= 2 && (
        <div className="mb-5">
          <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
            Locations
          </p>
          <p className="text-[11px] text-text-tertiary mb-2">
            {form.locationIds.length === 0
              ? "Available at every location."
              : `Limited to ${form.locationIds.length} of ${locations.length} locations.`}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {locations.map((loc) => {
              const all = form.locationIds.length === 0;
              const selected = all || form.locationIds.includes(loc.id);
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => {
                    const cur = form.locationIds;
                    let next: string[];
                    if (cur.length === 0) {
                      next = locations.filter((l) => l.id !== loc.id).map((l) => l.id);
                    } else if (cur.includes(loc.id)) {
                      next = cur.filter((id) => id !== loc.id);
                    } else {
                      next = [...cur, loc.id];
                    }
                    if (next.length === locations.length) next = [];
                    update("locationIds", next);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium border cursor-pointer transition-colors ${
                    selected
                      ? "bg-primary text-white border-primary"
                      : "bg-surface text-text-secondary border-border-light hover:text-foreground"
                  }`}
                >
                  {selected && <Check className="w-3 h-3" />}
                  {loc.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {resources.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
            Required resources
          </p>
          <p className="text-[11px] text-text-tertiary mb-2">
            Each one must be free for the booking. Pick rooms, chairs, or machines this service needs.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {resources.map((r) => {
              const selected = form.requiredResourceIds.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() =>
                    update(
                      "requiredResourceIds",
                      selected
                        ? form.requiredResourceIds.filter((id) => id !== r.id)
                        : [...form.requiredResourceIds, r.id],
                    )
                  }
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium border cursor-pointer transition-colors ${
                    selected
                      ? "bg-primary text-white border-primary"
                      : "bg-surface text-text-secondary border-border-light hover:text-foreground"
                  }`}
                >
                  {selected && <Check className="w-3 h-3" />}
                  {r.name}
                  {r.kind && (
                    <span className="text-[10px] opacity-70 ml-0.5">· {r.kind}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Section>
  );
}
