"use client";

import { Plus, Trash2 } from "lucide-react";
import { generateId } from "@/lib/id";
import { Button } from "@/components/ui/Button";

interface Milestone {
  id: string;
  label: string;
  percent: number;
  status: string;
}

interface MilestoneEditorProps {
  milestones: Milestone[];
  onChange: (milestones: Milestone[]) => void;
}

export function MilestoneEditor({ milestones, onChange }: MilestoneEditorProps) {
  const totalPercent = milestones.reduce((sum, m) => sum + m.percent, 0);
  const isValid = totalPercent === 100;

  const addMilestone = () => {
    const remaining = 100 - totalPercent;
    onChange([
      ...milestones,
      { id: generateId(), label: "", percent: Math.max(remaining, 0), status: "pending" },
    ]);
  };

  const updateMilestone = (id: string, updates: Partial<Milestone>) => {
    onChange(milestones.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const removeMilestone = (id: string) => {
    onChange(milestones.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-2">
      {milestones.map((milestone, idx) => (
        <div key={milestone.id} className="flex items-center gap-2">
          <input
            type="text"
            value={milestone.label}
            onChange={(e) => updateMilestone(milestone.id, { label: e.target.value })}
            placeholder={`Milestone ${idx + 1}`}
            className="flex-1 px-3 py-2 bg-card-bg border border-border-light rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={milestone.percent}
              onChange={(e) => updateMilestone(milestone.id, { percent: Number(e.target.value) })}
              min={1}
              max={100}
              className="w-16 px-2 py-2 bg-card-bg border border-border-light rounded-lg text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
            <span className="text-xs text-text-secondary">%</span>
          </div>
          <button
            type="button"
            onClick={() => removeMilestone(milestone.id)}
            className="p-1.5 text-text-tertiary hover:text-red-500 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm" onClick={addMilestone}>
          <Plus className="w-3.5 h-3.5" /> Add Milestone
        </Button>
        <span className={`text-xs font-medium ${isValid ? "text-green-600" : "text-amber-600"}`}>
          Total: {totalPercent}%{!isValid && " (must equal 100%)"}
        </span>
      </div>
    </div>
  );
}
