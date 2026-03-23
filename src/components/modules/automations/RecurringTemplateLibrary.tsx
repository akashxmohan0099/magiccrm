"use client";

import { useState } from "react";
import { Plus, Trash2, Play, Clock, CalendarDays, CalendarRange, Calendar, CalendarCheck } from "lucide-react";
import { useAutomationsStore } from "@/store/automations";
import { RecurringTaskTemplate } from "@/types/models";
import { Button } from "@/components/ui/Button";

const FREQUENCY_CONFIG: Record<RecurringTaskTemplate["frequency"], { label: string; icon: React.ReactNode; color: string }> = {
  daily: { label: "Daily", icon: <Clock className="w-3 h-3" />, color: "bg-blue-100 text-blue-700" },
  weekly: { label: "Weekly", icon: <CalendarDays className="w-3 h-3" />, color: "bg-green-100 text-green-700" },
  biweekly: { label: "Biweekly", icon: <CalendarRange className="w-3 h-3" />, color: "bg-yellow-100 text-yellow-700" },
  monthly: { label: "Monthly", icon: <Calendar className="w-3 h-3" />, color: "bg-purple-100 text-purple-700" },
  quarterly: { label: "Quarterly", icon: <CalendarCheck className="w-3 h-3" />, color: "bg-orange-100 text-orange-700" },
};

export function RecurringTemplateLibrary() {
  const { recurringTemplates, addRecurringTemplate, deleteRecurringTemplate, createTaskFromTemplate } = useAutomationsStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    taskTitle: "",
    description: "",
    frequency: "weekly" as RecurringTaskTemplate["frequency"],
    category: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.taskTitle.trim()) return;
    addRecurringTemplate({
      ...formData,
      name: formData.name.trim(),
      taskTitle: formData.taskTitle.trim(),
      description: formData.description.trim(),
      category: formData.category.trim() || "general",
      isBuiltIn: false,
    });
    setFormData({ name: "", taskTitle: "", description: "", frequency: "weekly", category: "" });
    setShowForm(false);
  };

  return (
    <div className="mt-6">
      <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">
        Recurring Task Templates
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {recurringTemplates.map((template) => {
          const freq = FREQUENCY_CONFIG[template.frequency];
          return (
            <div
              key={template.id}
              className="p-3 bg-card-bg border border-border-light rounded-xl hover:border-foreground/15 transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground">{template.name}</p>
                  <p className="text-[11px] text-text-tertiary mt-0.5">{template.description}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${freq.color}`}>
                  {freq.icon}
                  {freq.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2.5">
                <button
                  onClick={() => createTaskFromTemplate(template.id)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  <Play className="w-3 h-3" />
                  Use
                </button>
                {!template.isBuiltIn && (
                  <button
                    onClick={() => deleteRecurringTemplate(template.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-red-600 bg-red-50 hover:bg-red-100"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Custom button / inline form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="p-3 border border-dashed border-border-light rounded-xl hover:border-foreground/20 transition-all flex items-center justify-center gap-2 text-[13px] text-text-tertiary hover:text-foreground"
          >
            <Plus className="w-4 h-4" />
            Add Custom
          </button>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-card-bg border border-primary/20 rounded-xl space-y-2"
          >
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Template name"
              className="w-full rounded-lg border border-border-light bg-white px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary/30"
              autoFocus
            />
            <input
              type="text"
              value={formData.taskTitle}
              onChange={(e) => setFormData({ ...formData, taskTitle: e.target.value })}
              placeholder="Task title (what gets created)"
              className="w-full rounded-lg border border-border-light bg-white px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description (optional)"
              className="w-full rounded-lg border border-border-light bg-white px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <div className="flex gap-2">
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as RecurringTaskTemplate["frequency"] })}
                className="flex-1 rounded-lg border border-border-light bg-white px-2.5 py-1.5 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Category"
                className="flex-1 rounded-lg border border-border-light bg-white px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" type="submit" disabled={!formData.name.trim() || !formData.taskTitle.trim()}>
                Save
              </Button>
              <Button size="sm" variant="secondary" type="button" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
