"use client";

import { useState } from "react";
import { Plus, CalendarDays, Trash2 } from "lucide-react";
import { useClassTimetableStore } from "@/store/class-timetable";
import { ClassDefinition } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { SlideOver } from "@/components/ui/SlideOver";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const GRID_DAYS = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun ordering
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6am - 9pm

const DEFAULT_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6",
];

function formatTime(hour: number): string {
  const ampm = hour >= 12 ? "PM" : "AM";
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h} ${ampm}`;
}

function parseHour(timeStr: string): number {
  const [h] = timeStr.split(":").map(Number);
  return h;
}

function parseMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function ClassTimetablePage() {
  const { classes, addClass, updateClass, deleteClass } = useClassTimetableStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassDefinition | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Form state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [instructor, setInstructor] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [capacity, setCapacity] = useState("");
  const [recurring, setRecurring] = useState(true);
  const [color, setColor] = useState(DEFAULT_COLORS[0]);

  const resetForm = () => {
    setName("");
    setInstructor("");
    setDayOfWeek(1);
    setStartTime("09:00");
    setEndTime("10:00");
    setCapacity("");
    setRecurring(true);
    setColor(DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)]);
    setEditingClass(null);
    setErrors({});
    setSaving(false);
  };

  const openEdit = (cls: ClassDefinition) => {
    setEditingClass(cls);
    setName(cls.name);
    setInstructor(cls.instructor || "");
    setDayOfWeek(cls.dayOfWeek);
    setStartTime(cls.startTime);
    setEndTime(cls.endTime);
    setCapacity(String(cls.capacity));
    setRecurring(cls.recurring);
    setColor(cls.color || DEFAULT_COLORS[0]);
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Class name is required";
    if (parseMinutes(endTime) <= parseMinutes(startTime)) newErrors.time = "End time must be after start time";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setSaving(true);

    const data = {
      name: name.trim(),
      instructor: instructor.trim() || undefined,
      dayOfWeek,
      startTime,
      endTime,
      capacity: parseInt(capacity) || 20,
      recurring,
      color,
    };

    if (editingClass) {
      updateClass(editingClass.id, data);
    } else {
      addClass(data);
    }
    resetForm();
    setFormOpen(false);
  };

  const requestDelete = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setPendingDeleteId(id);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (pendingDeleteId) {
      deleteClass(pendingDeleteId);
      setPendingDeleteId(null);
      // If we were editing this class, close the form
      if (editingClass?.id === pendingDeleteId) {
        resetForm();
        setFormOpen(false);
      }
    }
  };

  // Get classes for a given day
  const getClassesForDay = (day: number): ClassDefinition[] => {
    return classes.filter((c) => c.dayOfWeek === day);
  };

  const inputClass =
    "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  return (
    <div>
      <PageHeader
        title="Class Timetable"
        description={`${classes.length} class${classes.length !== 1 ? "es" : ""} scheduled`}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              resetForm();
              setFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4" /> Add Class
          </Button>
        }
      />

      {classes.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="w-10 h-10" />}
          title="No classes scheduled yet"
          description="Build your weekly class timetable. Add classes with times, instructors, and capacity limits."
          setupSteps={[
            {
              label: "Add your first class",
              description: "Set a name, day, time, and capacity",
              action: () => setFormOpen(true),
            },
          ]}
        />
      ) : (
        <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Day headers */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border-light">
                <div className="p-2" />
                {GRID_DAYS.map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center text-[13px] font-semibold text-foreground border-l border-border-light"
                  >
                    {DAYS[day]}
                  </div>
                ))}
              </div>

              {/* Time grid */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border-light last:border-b-0"
                >
                  <div className="p-2 text-[11px] text-text-tertiary text-right pr-3 py-3">
                    {formatTime(hour)}
                  </div>
                  {GRID_DAYS.map((day) => {
                    const dayClasses = getClassesForDay(day).filter(
                      (c) => parseHour(c.startTime) === hour
                    );
                    return (
                      <div
                        key={day}
                        className="border-l border-border-light min-h-[48px] p-0.5 relative"
                      >
                        {dayClasses.map((cls) => {
                          const durationMins =
                            parseMinutes(cls.endTime) -
                            parseMinutes(cls.startTime);
                          const heightBlocks = Math.max(
                            1,
                            Math.round(durationMins / 60)
                          );
                          return (
                            <div
                              key={cls.id}
                              className="rounded-lg px-2 py-1.5 text-white cursor-pointer group relative"
                              style={{
                                backgroundColor: cls.color || "#6366f1",
                                height: `${heightBlocks * 48 - 4}px`,
                                zIndex: 10,
                              }}
                              onClick={() => openEdit(cls)}
                            >
                              <div className="text-xs font-semibold leading-tight truncate">
                                {cls.name}
                              </div>
                              <div className="text-[10px] opacity-80 truncate">
                                {cls.startTime} - {cls.endTime}
                              </div>
                              {cls.instructor && (
                                <div className="text-[10px] opacity-70 truncate">
                                  {cls.instructor}
                                </div>
                              )}
                              <div className="text-[10px] opacity-70">
                                {cls.enrolled}/{cls.capacity}
                              </div>
                              <button
                                onClick={(e) => requestDelete(cls.id, e)}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-white/20 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <SlideOver
        open={formOpen}
        onClose={() => {
          resetForm();
          setFormOpen(false);
        }}
        title={editingClass ? "Edit Class" : "Add Class"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Class Name" required error={errors.name}>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((prev) => { const next = { ...prev }; delete next.name; return next; }); }}
              placeholder="e.g. Morning Yoga"
              className={inputClass}
            />
          </FormField>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">
              Instructor
            </label>
            <input
              type="text"
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
              placeholder="Instructor name"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">
              Day of Week *
            </label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
              className={inputClass}
            >
              {DAYS.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Start Time" required>
              <input
                type="time"
                value={startTime}
                onChange={(e) => { setStartTime(e.target.value); if (errors.time) setErrors((prev) => { const next = { ...prev }; delete next.time; return next; }); }}
                className={inputClass}
              />
            </FormField>
            <FormField label="End Time" required error={errors.time}>
              <input
                type="time"
                value={endTime}
                onChange={(e) => { setEndTime(e.target.value); if (errors.time) setErrors((prev) => { const next = { ...prev }; delete next.time; return next; }); }}
                className={inputClass}
              />
            </FormField>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">
              Capacity
            </label>
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="20"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full cursor-pointer transition-all ${
                    color === c
                      ? "ring-2 ring-offset-2 ring-offset-card-bg ring-foreground scale-110"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recurring"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="rounded"
            />
            <label
              htmlFor="recurring"
              className="text-[13px] text-foreground cursor-pointer"
            >
              Recurring weekly
            </label>
          </div>
          <div className="pt-2 space-y-2">
            <Button type="submit" loading={saving} className="w-full">
              {editingClass ? "Save Changes" : "Add Class"}
            </Button>
            {editingClass && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => requestDelete(editingClass.id)}
                className="w-full"
              >
                Delete Class
              </Button>
            )}
          </div>
        </form>
      </SlideOver>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => {
          setConfirmDeleteOpen(false);
          setPendingDeleteId(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Class"
        message="Are you sure you want to delete this class? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
