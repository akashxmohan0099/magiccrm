"use client";

import { useState, useEffect, useMemo } from "react";
import { useCalendarBlocksStore } from "@/store/calendar-blocks";
import type { BlockKind, CalendarBlock } from "@/types/models";
import { useAuth } from "@/hooks/useAuth";
import { useModuleEnabled } from "@/hooks/useFeature";
import { SlideOver } from "@/components/ui/SlideOver";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { DateField } from "@/components/ui/DateField";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import { TeamMemberPicker } from "@/components/ui/TeamMemberPicker";
import {
  ALL_BLOCK_KINDS_GROUPED,
  COMMON_REASONS,
  getBlockMeta,
} from "@/lib/blocks-meta";

// Kinds where a private reason is meaningful (and the public booking page
// should hide details). Workflow/operations kinds don't carry sensitive
// info, so we skip the privacy toggle and the free-text note for them.
const PRIVACY_RELEVANT_KINDS: BlockKind[] = [
  "blocked", "unavailable", "personal", "sick", "vacation",
];

// Kind-specific verbs so the slide-over title reads naturally instead of
// "New Unavailable" / "Edit Sick".
const KIND_TITLES: Record<BlockKind, { create: string; edit: string }> = {
  break:       { create: "Add break",            edit: "Edit break" },
  cleanup:     { create: "Add cleanup",          edit: "Edit cleanup" },
  lunch:       { create: "Add lunch",            edit: "Edit lunch" },
  travel:      { create: "Add travel time",      edit: "Edit travel time" },
  prep:        { create: "Add prep time",        edit: "Edit prep time" },
  blocked:     { create: "Block time",           edit: "Edit blocked time" },
  unavailable: { create: "Mark unavailable",     edit: "Edit unavailable time" },
  admin:       { create: "Add admin time",       edit: "Edit admin time" },
  training:    { create: "Add training",         edit: "Edit training" },
  personal:    { create: "Add personal time",    edit: "Edit personal time" },
  sick:        { create: "Mark sick day",        edit: "Edit sick day" },
  vacation:    { create: "Schedule vacation",    edit: "Edit vacation" },
  deep_clean:  { create: "Schedule deep clean",  edit: "Edit deep clean" },
  delivery:    { create: "Add delivery",         edit: "Edit delivery" },
  holiday:     { create: "Add holiday",          edit: "Edit holiday" },
  custom:      { create: "Add to calendar",      edit: "Edit block" },
};

interface BlockFormProps {
  open: boolean;
  onClose: () => void;
  block?: CalendarBlock;
  defaultKind?: BlockKind;
  defaultDate?: string;
  defaultStart?: string; // HH:MM
  defaultEnd?: string;   // HH:MM
}

const recurrenceOptions = [
  { value: "", label: "Does not repeat" },
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Every weekday (Mon–Fri)" },
  { value: "weekly", label: "Every week" },
  { value: "fortnightly", label: "Every 2 weeks" },
  { value: "monthly", label: "Every month" },
];

function toTimeString(val: string): string {
  if (val.includes("T")) {
    const d = new Date(val);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return val;
}

// Combine YYYY-MM-DD + HH:MM into a local-time ISO string.
function toISO(date: string, time: string): string {
  if (!date || !time) return "";
  const d = new Date(`${date}T${time}:00`);
  return d.toISOString();
}

export function BlockForm({
  open,
  onClose,
  block,
  defaultKind = "blocked",
  defaultDate,
  defaultStart,
  defaultEnd,
}: BlockFormProps) {
  const { addBlock, updateBlock, deleteBlock } = useCalendarBlocksStore();
  const { workspaceId } = useAuth();
  const teamEnabled = useModuleEnabled("team");

  const [kind, setKind] = useState<BlockKind>(defaultKind);
  const [date, setDate] = useState(defaultDate ?? "");
  const [startAt, setStartAt] = useState(defaultStart ?? "09:00");
  const [endAt, setEndAt] = useState(defaultEnd ?? "10:00");
  const [reason, setReason] = useState("");
  const [label, setLabel] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [recurrence, setRecurrence] = useState<string>("");
  const [recurrenceEnd, setRecurrenceEnd] = useState("");
  const [assignedToId, setAssignedToId] = useState<string | undefined>(undefined);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const meta = useMemo(() => getBlockMeta(kind), [kind]);
  const requiresReason = kind === "blocked" || kind === "unavailable";
  const isCustom = kind === "custom";
  const showPrivacy = PRIVACY_RELEVANT_KINDS.includes(kind);
  const showFreeNote = showPrivacy && !requiresReason; // personal/sick/vacation
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (block) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setKind(block.kind);
      setDate(block.date);
      setStartAt(toTimeString(block.startTime));
      setEndAt(toTimeString(block.endTime));
      setReason(block.reason ?? "");
      setLabel(block.label ?? "");
      setIsPrivate(block.isPrivate);
      setRecurrence(block.recurrencePattern ?? "");
      setRecurrenceEnd(block.recurrenceEndDate ?? "");
      setAssignedToId(block.teamMemberId);
    } else {
      setKind(defaultKind);
      setDate(defaultDate ?? "");
      setStartAt(defaultStart ?? "09:00");
      setEndAt(defaultEnd ?? "10:00");
      setReason("");
      setLabel("");
      setIsPrivate(true);
      setRecurrence("");
      setRecurrenceEnd("");
      setAssignedToId(undefined);
    }
    setErrors({});
  }, [open, block, defaultKind, defaultDate, defaultStart, defaultEnd]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!date) errs.date = "Date is required";
    if (!startAt) errs.startAt = "Start time is required";
    if (!endAt) errs.endAt = "End time is required";
    if (startAt && endAt && startAt >= endAt) errs.endAt = "End must be after start";
    if (recurrence && !recurrenceEnd) errs.recurrenceEnd = "Pick an end date or remove recurrence";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !validate()) return;
    setSaving(true);

    const data = {
      workspaceId: workspaceId || "",
      teamMemberId: assignedToId,
      kind,
      date,
      startTime: toISO(date, startAt),
      endTime: toISO(date, endAt),
      label: label.trim() || undefined,
      reason: reason.trim() || undefined,
      isPrivate,
      isRecurring: !!recurrence,
      recurrencePattern: (recurrence || undefined) as CalendarBlock["recurrencePattern"],
      recurrenceEndDate: recurrence ? recurrenceEnd : undefined,
    };

    if (block) {
      updateBlock(block.id, data as Partial<CalendarBlock>, workspaceId ?? undefined);
    } else {
      addBlock(
        data as Omit<CalendarBlock, "id" | "createdAt" | "updatedAt">,
        workspaceId ?? undefined
      );
    }
    onClose();
    setSaving(false);
  };

  const handleDelete = () => {
    if (!block) return;
    deleteBlock(block.id, workspaceId ?? undefined);
    onClose();
  };

  const titleText = block ? KIND_TITLES[kind].edit : KIND_TITLES[kind].create;

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={titleText}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Compact type indicator — expands to a full picker on click. */}
        <div className="flex items-center justify-between bg-surface rounded-xl px-3.5 py-2.5 border border-border-light">
          <div className="flex items-center gap-2.5">
            <meta.Icon className={`w-4 h-4 ${meta.iconClassName}`} />
            <span className="text-sm font-medium text-foreground">{meta.label}</span>
          </div>
          <button
            type="button"
            onClick={() => setTypePickerOpen((v) => !v)}
            className="text-xs font-medium text-text-secondary hover:text-foreground cursor-pointer"
          >
            {typePickerOpen ? "Done" : "Change"}
          </button>
        </div>

        {typePickerOpen && (
          <div className="space-y-3 -mt-2 animate-in slide-in-from-top-1 fade-in duration-150">
            {ALL_BLOCK_KINDS_GROUPED.map((group) => (
              <div key={group.heading}>
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
                  {group.heading}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.kinds.map((k) => {
                    const m = getBlockMeta(k);
                    const Icon = m.Icon;
                    const active = kind === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => { setKind(k); setTypePickerOpen(false); }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          active
                            ? "bg-foreground text-background border-foreground"
                            : "bg-surface text-text-secondary border-border-light hover:text-foreground"
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${active ? "" : m.iconClassName}`} />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {isCustom && (
          <FormField label="Label">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="What's this for?"
              className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            />
          </FormField>
        )}

        {requiresReason && (
          <FormField label="Reason">
            <div className="space-y-2">
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="What's this for? (only you see this)"
                className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
              />
              <div className="flex flex-wrap gap-1.5">
                {COMMON_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className="px-2.5 py-1 rounded-full text-xs border bg-surface text-text-secondary border-border-light hover:text-foreground hover:border-border-dark transition-colors cursor-pointer"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </FormField>
        )}

        {teamEnabled && (
          <TeamMemberPicker
            value={assignedToId}
            onChange={(id) => setAssignedToId(id)}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField label="Date" required error={errors.date}>
            <DateField value={date} onChange={(e) => setDate(e.target.value)} allowPast />
          </FormField>
          <FormField label="Start" required error={errors.startAt}>
            <input
              type="time"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            />
          </FormField>
          <FormField label="End" required error={errors.endAt}>
            <input
              type="time"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            />
          </FormField>
        </div>

        <FormField label="Repeat">
          <SelectField
            options={recurrenceOptions}
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
          />
        </FormField>

        {recurrence && (
          <FormField label="Repeat until" required error={errors.recurrenceEnd}>
            <DateField
              value={recurrenceEnd}
              onChange={(e) => setRecurrenceEnd(e.target.value)}
              allowPast={false}
            />
          </FormField>
        )}

        {showFreeNote && (
          <FormField label="Note">
            <TextArea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional details…"
              rows={2}
            />
          </FormField>
        )}

        {showPrivacy && (
          <button
            type="button"
            onClick={() => setIsPrivate(!isPrivate)}
            className="w-full flex items-center justify-between py-1.5 cursor-pointer text-left"
          >
            <span className="text-sm text-text-secondary">
              Hide details from clients
            </span>
            <span
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                isPrivate ? "bg-foreground" : "bg-border-light"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
                  isPrivate ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </span>
          </button>
        )}

        <div className="flex justify-between pt-4 border-t border-border-light">
          <div>
            {block && (
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={saving}>
              {block ? "Save changes" : `Create ${meta.label.toLowerCase()}`}
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title={`Delete ${meta.label.toLowerCase()}`}
        message="Remove this block from the calendar?"
      />
    </SlideOver>
  );
}
