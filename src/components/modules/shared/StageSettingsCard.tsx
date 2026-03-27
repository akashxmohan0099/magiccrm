"use client";

import { useState } from "react";
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import type { StageDefinition } from "@/types/industry-config";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";

const STAGE_COLOR_OPTIONS = [
  { value: "bg-slate-400", label: "Slate" },
  { value: "bg-blue-500", label: "Blue" },
  { value: "bg-cyan-500", label: "Cyan" },
  { value: "bg-emerald-500", label: "Emerald" },
  { value: "bg-amber-500", label: "Amber" },
  { value: "bg-orange-500", label: "Orange" },
  { value: "bg-rose-500", label: "Rose" },
  { value: "bg-violet-500", label: "Violet" },
] as const;

function slugifyStageId(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizeStages(stages: StageDefinition[]): StageDefinition[] {
  const seen = new Set<string>();

  return stages.map((stage, index) => {
    const label = stage.label.trim() || `Stage ${index + 1}`;
    const baseId = slugifyStageId(stage.id || label) || `stage-${index + 1}`;
    let uniqueId = baseId;
    let suffix = 2;

    while (seen.has(uniqueId)) {
      uniqueId = `${baseId}-${suffix}`;
      suffix += 1;
    }

    seen.add(uniqueId);

    return {
      id: uniqueId,
      label,
      color: stage.color || STAGE_COLOR_OPTIONS[0].value,
      isClosed: stage.isClosed ?? false,
    };
  });
}

interface StageSettingsCardProps {
  title: string;
  description: string;
  entityLabel: string;
  stages: StageDefinition[];
  defaultStages: StageDefinition[];
  onSave: (stages: StageDefinition[]) => void;
  onReset: () => void;
}

export function StageSettingsCard({
  title,
  description,
  entityLabel,
  stages,
  defaultStages,
  onSave,
  onReset,
}: StageSettingsCardProps) {
  const [draftStages, setDraftStages] = useState<StageDefinition[]>(
    stages.map((stage) => ({ ...stage }))
  );

  const updateStage = (
    index: number,
    field: keyof StageDefinition,
    value: string | boolean
  ) => {
    setDraftStages((current) =>
      current.map((stage, stageIndex) =>
        stageIndex === index ? { ...stage, [field]: value } : stage
      )
    );
  };

  const addStage = () => {
    setDraftStages((current) => [
      ...current,
      {
        id: `stage-${current.length + 1}`,
        label: "",
        color: STAGE_COLOR_OPTIONS[0].value,
      },
    ]);
  };

  const removeStage = (index: number) => {
    setDraftStages((current) => current.filter((_, stageIndex) => stageIndex !== index));
  };

  const handleSave = () => {
    if (draftStages.length === 0) {
      toast(`Add at least one ${entityLabel} stage`, "error");
      return;
    }

    const nextStages = sanitizeStages(draftStages);
    onSave(nextStages);
    setDraftStages(nextStages);
    toast(`${title} updated`);
  };

  const handleReset = () => {
    onReset();
    setDraftStages(defaultStages.map((stage) => ({ ...stage })));
    toast(`${title} reset to defaults`, "info");
  };

  return (
    <div className="mt-4 p-4 bg-card-bg rounded-xl border border-border-light">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h4 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider">
            {title}
          </h4>
          <p className="text-xs text-text-secondary mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" type="button" onClick={handleReset}>
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
          <Button variant="secondary" size="sm" type="button" onClick={addStage}>
            <Plus className="w-3.5 h-3.5" /> Add Stage
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {draftStages.map((stage, index) => (
          <div
            key={`${stage.id}-${index}`}
            className="grid gap-3 rounded-xl border border-border-light bg-surface/40 p-3 md:grid-cols-[minmax(0,2fr)_160px_120px_auto]"
          >
            <label className="block">
              <span className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                Label
              </span>
              <input
                type="text"
                value={stage.label}
                onChange={(event) => updateStage(index, "label", event.target.value)}
                className="mt-1 w-full rounded-lg border border-border-light bg-card-bg px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                placeholder={`Stage ${index + 1}`}
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                Color
              </span>
              <select
                value={stage.color}
                onChange={(event) => updateStage(index, "color", event.target.value)}
                className="mt-1 w-full rounded-lg border border-border-light bg-card-bg px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
              >
                {STAGE_COLOR_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 pt-6 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={Boolean(stage.isClosed)}
                onChange={(event) => updateStage(index, "isClosed", event.target.checked)}
                className="rounded border-border-light"
              />
              Closed stage
            </label>

            <div className="flex items-center justify-end pt-5">
              <button
                type="button"
                onClick={() => removeStage(index)}
                className="p-2 text-text-tertiary hover:text-red-500 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-text-tertiary mt-3">
        Existing records keep their current stage id. If a saved stage is removed, older records fall back to the first open stage until you reassign them.
      </p>

      <div className="flex justify-end mt-4">
        <Button variant="primary" size="sm" type="button" onClick={handleSave}>
          <Save className="w-3.5 h-3.5" /> Save Stages
        </Button>
      </div>
    </div>
  );
}
