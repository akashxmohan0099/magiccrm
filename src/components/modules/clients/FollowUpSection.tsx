"use client";

import { useState } from "react";
import {
  Bell,
  Plus,
  Check,
  Trash2,
  Clock,
} from "lucide-react";
import { useRemindersStore } from "@/store/reminders";
import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";

interface FollowUpSectionProps {
  clientId: string;
}

export function FollowUpSection({ clientId }: FollowUpSectionProps) {
  const {
    getRemindersForEntity,
    addReminder,
    toggleReminder,
    deleteReminder,
  } = useRemindersStore();

  const reminders = getRemindersForEntity("client", clientId);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");

  const handleAdd = () => {
    if (!newTitle.trim() || !newDate) return;
    addReminder({
      title: newTitle.trim(),
      entityType: "client",
      entityId: clientId,
      dueDate: newDate,
    });
    setNewTitle("");
    setNewDate("");
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
    if (e.key === "Escape") {
      setIsAdding(false);
      setNewTitle("");
      setNewDate("");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays <= 7) return `In ${diffDays} days`;
    return date.toLocaleDateString();
  };

  const isOverdue = (dateStr: string) => {
    return new Date(dateStr) < new Date() && !isNaN(new Date(dateStr).getTime());
  };

  const sorted = [...reminders].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="bg-surface rounded-lg p-4 border border-border-light">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-text-secondary" />
          <h4 className="text-sm font-medium text-foreground">
            Follow-Up Reminders
          </h4>
        </div>
        {!isAdding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Reminder
          </Button>
        )}
      </div>

      {sorted.length === 0 && !isAdding && (
        <p className="text-xs text-text-secondary">
          No follow-up reminders set.
        </p>
      )}

      <div className="space-y-2">
        {sorted.map((reminder) => (
          <div
            key={reminder.id}
            className={`flex items-center gap-3 p-2.5 rounded-lg border ${
              reminder.completed
                ? "bg-card-bg border-border-light opacity-60"
                : isOverdue(reminder.dueDate)
                ? "bg-red-50 border-red-200"
                : "bg-card-bg border-border-light"
            }`}
          >
            <button
              onClick={() => toggleReminder(reminder.id)}
              className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${
                reminder.completed
                  ? "bg-brand border-brand text-white"
                  : "border-border-light hover:border-brand"
              }`}
            >
              {reminder.completed && <Check className="w-3 h-3" />}
            </button>

            <div className="flex-1 min-w-0">
              <p
                className={`text-sm ${
                  reminder.completed
                    ? "line-through text-text-secondary"
                    : "text-foreground"
                }`}
              >
                {reminder.title}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-text-secondary" />
                <span
                  className={`text-xs ${
                    !reminder.completed && isOverdue(reminder.dueDate)
                      ? "text-red-600 font-medium"
                      : "text-text-secondary"
                  }`}
                >
                  {formatDate(reminder.dueDate)}
                </span>
              </div>
            </div>

            <button
              onClick={() => deleteReminder(reminder.id)}
              className="flex-shrink-0 p-1 rounded hover:bg-surface text-text-secondary hover:text-red-600 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="mt-3 p-3 rounded-lg border border-brand/30 bg-surface/50">
          <div className="space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Reminder title..."
              autoFocus
              className="w-full px-3 py-1.5 bg-card-bg border border-border-light rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
            <DateField
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewTitle("");
                setNewDate("");
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!newTitle.trim() || !newDate}
            >
              Add Reminder
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
