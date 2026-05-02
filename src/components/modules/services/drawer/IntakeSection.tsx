"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ServiceIntakeQuestionType } from "@/types/models";
import { useFormsStore } from "@/store/forms";
import { generateId } from "@/lib/id";
import type { FormState, IntakeInput } from "./types";
import { Section } from "./Section";

const smallInputClass =
  "w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

// The two intake mechanisms run at different times in the booking lifecycle:
//   - "inline"  → questions asked DURING booking, answers captured in
//                 booking.intake_answers (blocks the booking until answered)
//   - "linked"  → a Forms-module form sent AFTER booking by
//                 /api/cron/send-intake-forms (does not block the booking)
// The drawer treats them as exclusive so saved state matches the operator's
// intent — the public booking + cron each look at their own field.
type Mode = "inline" | "linked";

export function IntakeSection({
  form,
  update,
  setForm,
}: {
  form: FormState;
  update: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const forms = useFormsStore((s) => s.forms);

  const mode: Mode = form.intakeFormId ? "linked" : "inline";
  const hasData = form.intakeQuestions.length > 0 || !!form.intakeFormId;

  const setMode = (next: Mode) => {
    if (next === mode) return;
    if (next === "linked") {
      // Switching to a linked form clears any inline questions so we don't
      // double-collect (and so subtitle counts stay honest).
      setForm((p) => ({
        ...p,
        intakeQuestions: [],
        // Default to the first available form so the dropdown isn't stuck
        // on the empty placeholder, which would re-derive mode = "inline".
        intakeFormId: forms[0]?.id ?? "",
      }));
    } else {
      setForm((p) => ({ ...p, intakeFormId: "" }));
    }
  };

  const addIntake = () =>
    setForm((p) => ({
      ...p,
      intakeQuestions: [
        ...p.intakeQuestions,
        {
          id: generateId(),
          label: "",
          type: "text",
          required: false,
          options: "",
          hint: "",
        },
      ],
    }));
  const updateIntake = (id: string, patch: Partial<IntakeInput>) =>
    setForm((p) => ({
      ...p,
      intakeQuestions: p.intakeQuestions.map((q) =>
        q.id === id ? { ...q, ...patch } : q,
      ),
    }));
  const removeIntake = (id: string) =>
    setForm((p) => ({
      ...p,
      intakeQuestions: p.intakeQuestions.filter((q) => q.id !== id),
    }));

  const subtitleSuffix = form.intakeFormId
    ? "· Linked form"
    : form.intakeQuestions.length > 0
      ? `· ${form.intakeQuestions.length} question${form.intakeQuestions.length === 1 ? "" : "s"}`
      : "";

  return (
    <Section
      title="Intake"
      defaultOpen={hasData}
      subtitle={`What you need from the client ${subtitleSuffix}`.trim()}
    >
      <div className="grid grid-cols-2 gap-2 mb-4">
        {(
          [
            {
              id: "inline" as const,
              label: "Ask during booking",
              hint: "Inline questions in the booking flow",
            },
            {
              id: "linked" as const,
              label: "Send after booking",
              hint: "Email a Form built in Forms",
            },
          ]
        ).map((opt) => {
          const active = mode === opt.id;
          const disabled = opt.id === "linked" && forms.length === 0;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => !disabled && setMode(opt.id)}
              disabled={disabled}
              className={`text-left rounded-lg border px-3 py-2 transition-all ${
                active
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5 cursor-pointer"
                  : disabled
                    ? "border-border-light bg-card-bg opacity-50 cursor-not-allowed"
                    : "border-border-light hover:border-text-tertiary bg-card-bg cursor-pointer"
              }`}
              title={disabled ? "Build a Form in the Forms module first" : undefined}
            >
              <p className="text-[12px] font-semibold text-foreground">{opt.label}</p>
              <p className="text-[11px] text-text-tertiary leading-snug">{opt.hint}</p>
            </button>
          );
        })}
      </div>

      {mode === "linked" ? (
        <div>
          <label className="text-[11px] text-text-tertiary block mb-1">Form</label>
          <select
            value={form.intakeFormId}
            onChange={(e) => update("intakeFormId", e.target.value)}
            className={smallInputClass}
          >
            {forms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name || "Untitled form"}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-text-tertiary mt-1.5">
            Sent to the client by email shortly after they book (via the
            intake-form cron). The booking itself is not blocked on the form
            being completed.
          </p>
        </div>
      ) : (
        <div>
          <p className="text-[11px] text-text-tertiary mb-3">
            Custom fields shown during the booking flow&apos;s details step.
            The booking won&apos;t submit until required fields are answered.
          </p>
          <div className="space-y-3">
            {form.intakeQuestions.map((q) => (
              <div key={q.id} className="bg-surface border border-border-light rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-[1fr_120px_auto] gap-2 items-center">
                  <input
                    type="text"
                    value={q.label}
                    onChange={(e) => updateIntake(q.id, { label: e.target.value })}
                    placeholder="Question label"
                    className={smallInputClass}
                  />
                  <select
                    value={q.type}
                    onChange={(e) =>
                      updateIntake(q.id, {
                        type: e.target.value as ServiceIntakeQuestionType,
                      })
                    }
                    className={smallInputClass}
                  >
                    <option value="text">Short text</option>
                    <option value="longtext">Long text</option>
                    <option value="select">Choose one</option>
                    <option value="yesno">Yes / No</option>
                    <option value="date">Date</option>
                    <option value="number">Number</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeIntake(q.id)}
                    className="p-1.5 text-text-tertiary hover:text-red-500 cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {q.type === "select" && (
                  <input
                    type="text"
                    value={q.options}
                    onChange={(e) => updateIntake(q.id, { options: e.target.value })}
                    placeholder="Options, comma-separated (e.g. Short, Medium, Long)"
                    className={smallInputClass}
                  />
                )}
                <input
                  type="text"
                  value={q.hint}
                  onChange={(e) => updateIntake(q.id, { hint: e.target.value })}
                  placeholder="Helper text (optional)"
                  className={smallInputClass}
                />
                <label className="flex items-center gap-2 text-[12px] text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) => updateIntake(q.id, { required: e.target.checked })}
                    className="rounded"
                  />
                  Required
                </label>
              </div>
            ))}
            <button
              type="button"
              onClick={addIntake}
              className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add question
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}
