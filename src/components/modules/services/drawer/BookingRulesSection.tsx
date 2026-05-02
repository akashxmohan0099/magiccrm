"use client";

import { Plus, Check, Trash2 } from "lucide-react";
import type {
  Service,
  DepositAppliesTo,
  ServiceIntakeQuestionType,
} from "@/types/models";
import { useFormsStore } from "@/store/forms";
import { useLocationsStore } from "@/store/locations";
import { useResourcesStore } from "@/store/resources";
import { generateId } from "@/lib/id";
import type {
  FormState,
  IntakeInput,
  DynamicPriceRuleInput,
} from "./types";
import { Section } from "./Section";

const smallInputClass =
  "w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

export function BookingRulesSection({
  form,
  update,
  setForm,
}: {
  service?: Service;
  form: FormState;
  update: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const forms = useFormsStore((s) => s.forms);
  const locations = useLocationsStore((s) => s.locations);
  const resources = useResourcesStore((s) => s.resources);

  // Default-open when any field already has a value.
  const hasBookingRules = !!(
    (Number(form.bufferBefore) || 0) > 0 ||
    (Number(form.bufferAfter) || 0) > 0 ||
    form.minNoticeHours ||
    form.maxAdvanceDays ||
    form.availableWeekdays.length > 0 ||
    form.requiresConfirmation ||
    (form.depositType && form.depositType !== "none") ||
    form.cancellationWindowHours ||
    form.cancellationFee ||
    form.intakeQuestions.length > 0
  );

  // ── State helpers (own form state via setForm closure) ──
  const toggleWeekday = (d: number) =>
    setForm((p) => {
      const allDays = [0, 1, 2, 3, 4, 5, 6];
      // Empty list = "any day" (all visually selected). Clicking one pill
      // means "deselect just this one" → expand to all-except-clicked.
      if (p.availableWeekdays.length === 0) {
        return { ...p, availableWeekdays: allDays.filter((x) => x !== d) };
      }
      const next = p.availableWeekdays.includes(d)
        ? p.availableWeekdays.filter((x) => x !== d)
        : [...p.availableWeekdays, d];
      // Selecting every day is functionally identical to "any day" — collapse back.
      if (next.length === allDays.length) return { ...p, availableWeekdays: [] };
      return { ...p, availableWeekdays: next };
    });

  const addDynamicRule = () =>
    setForm((p) => ({
      ...p,
      dynamicPriceRules: [
        ...p.dynamicPriceRules,
        {
          id: generateId(),
          label: "",
          weekdays: [],
          startTime: "09:00",
          endTime: "12:00",
          modifierType: "percent" as const,
          modifierValue: "-20",
        },
      ],
    }));
  const updateDynamicRule = (id: string, patch: Partial<DynamicPriceRuleInput>) =>
    setForm((p) => ({
      ...p,
      dynamicPriceRules: p.dynamicPriceRules.map((r) =>
        r.id === id ? { ...r, ...patch } : r,
      ),
    }));
  const removeDynamicRule = (id: string) =>
    setForm((p) => ({
      ...p,
      dynamicPriceRules: p.dynamicPriceRules.filter((r) => r.id !== id),
    }));

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

  return (
    <Section
      title="Booking rules"
      defaultOpen={hasBookingRules}
      subtitle="Scheduling, deposits, cancellation, intake & location"
    >
      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
        Scheduling
      </p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="text-[11px] text-text-tertiary block mb-1">Buffer before (min)</label>
          <input
            type="number"
            min={0}
            step={5}
            value={form.bufferBefore}
            onChange={(e) => update("bufferBefore", e.target.value)}
            placeholder="0"
            className={smallInputClass}
          />
        </div>
        <div>
          <label className="text-[11px] text-text-tertiary block mb-1">Buffer after (min)</label>
          <input
            type="number"
            min={0}
            step={5}
            value={form.bufferAfter}
            onChange={(e) => update("bufferAfter", e.target.value)}
            placeholder="0"
            className={smallInputClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-5">
        <div>
          <label className="text-[11px] text-text-tertiary block mb-1">Min notice (hrs)</label>
          <input
            type="number"
            min={0}
            value={form.minNoticeHours}
            onChange={(e) => update("minNoticeHours", e.target.value)}
            placeholder="Default"
            className={smallInputClass}
          />
        </div>
        <div>
          <label className="text-[11px] text-text-tertiary block mb-1">Max advance (days)</label>
          <input
            type="number"
            min={1}
            value={form.maxAdvanceDays}
            onChange={(e) => update("maxAdvanceDays", e.target.value)}
            placeholder="Default"
            className={smallInputClass}
          />
        </div>
      </div>

      <div className="mb-5">
        <label className="text-[11px] text-text-tertiary block mb-1.5">
          Available days{" "}
          <span className="text-text-tertiary normal-case font-normal tracking-normal">
            (optional — defaults to any day)
          </span>
        </label>
        <div className="flex items-center gap-1.5">
          {[
            { d: 0, l: "S" },
            { d: 1, l: "M" },
            { d: 2, l: "T" },
            { d: 3, l: "W" },
            { d: 4, l: "T" },
            { d: 5, l: "F" },
            { d: 6, l: "S" },
          ].map(({ d, l }) => {
            const allDays = form.availableWeekdays.length === 0;
            const selected = allDays || form.availableWeekdays.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleWeekday(d)}
                className={`w-8 h-8 rounded-full text-[11px] font-semibold border cursor-pointer transition-colors ${
                  selected
                    ? "bg-primary text-white border-primary"
                    : "bg-surface text-text-tertiary border-border-light hover:text-foreground"
                }`}
              >
                {l}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-center gap-2 text-[13px] text-text-secondary cursor-pointer mb-2">
        <input
          type="checkbox"
          checked={form.requiresConfirmation}
          onChange={(e) => update("requiresConfirmation", e.target.checked)}
          className="rounded"
        />
        Requires confirmation (pending until approved)
      </label>
      <label className="flex items-center gap-2 text-[13px] text-text-secondary cursor-pointer mb-5">
        <input
          type="checkbox"
          checked={form.requiresCardOnFile}
          onChange={(e) => update("requiresCardOnFile", e.target.checked)}
          className="rounded"
        />
        Require a card on file before booking
      </label>

      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mt-4 mb-2">
        Deposit
      </p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="text-[11px] text-text-tertiary block mb-1">Type</label>
          <select
            value={form.depositType}
            onChange={(e) =>
              update("depositType", e.target.value as FormState["depositType"])
            }
            className={smallInputClass}
          >
            <option value="none">No deposit</option>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] text-text-tertiary block mb-1">Amount</label>
          <input
            type="number"
            min={0}
            value={form.depositAmount}
            onChange={(e) => update("depositAmount", e.target.value)}
            placeholder="0"
            disabled={form.depositType === "none"}
            className={smallInputClass}
          />
        </div>
      </div>
      {form.depositType !== "none" && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div>
            <label className="text-[11px] text-text-tertiary block mb-1">Applies to</label>
            <select
              value={form.depositAppliesTo}
              onChange={(e) =>
                update("depositAppliesTo", e.target.value as DepositAppliesTo)
              }
              className={smallInputClass}
            >
              <option value="all">Everyone</option>
              <option value="new">New clients only</option>
              <option value="flagged">Flagged clients only</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-text-tertiary block mb-1">No-show fee (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.depositNoShowFee}
              onChange={(e) => update("depositNoShowFee", e.target.value)}
              placeholder="0"
              className={smallInputClass}
            />
          </div>
          <div>
            <label className="text-[11px] text-text-tertiary block mb-1">Auto-cancel (hrs)</label>
            <input
              type="number"
              min={0}
              value={form.depositAutoCancelHours}
              onChange={(e) => update("depositAutoCancelHours", e.target.value)}
              placeholder="Off"
              className={smallInputClass}
            />
          </div>
        </div>
      )}

      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mt-4 mb-2">
        Patch test
      </p>
      <label className="flex items-center gap-2 text-[13px] text-text-secondary cursor-pointer mb-2">
        <input
          type="checkbox"
          checked={form.requiresPatchTest}
          onChange={(e) => update("requiresPatchTest", e.target.checked)}
          className="rounded"
        />
        Require a non-expired patch test on file
      </label>
      {form.requiresPatchTest && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div>
            <label className="text-[11px] text-text-tertiary block mb-1">Category</label>
            <input
              type="text"
              value={form.patchTestCategory}
              onChange={(e) => update("patchTestCategory", e.target.value)}
              placeholder="color"
              className={smallInputClass}
            />
          </div>
          <div>
            <label className="text-[11px] text-text-tertiary block mb-1">Valid for (days)</label>
            <input
              type="number"
              min={1}
              value={form.patchTestValidityDays}
              onChange={(e) => update("patchTestValidityDays", e.target.value)}
              placeholder="180"
              className={smallInputClass}
            />
          </div>
          <div>
            <label className="text-[11px] text-text-tertiary block mb-1">Min lead (hrs)</label>
            <input
              type="number"
              min={0}
              value={form.patchTestMinLeadHours}
              onChange={(e) => update("patchTestMinLeadHours", e.target.value)}
              placeholder="48"
              className={smallInputClass}
            />
          </div>
        </div>
      )}

      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mt-4 mb-2">
        Rebook cadence
      </p>
      <div className="mb-5">
        <label className="text-[11px] text-text-tertiary block mb-1">
          Suggest a rebook after (days){" "}
          <span className="text-text-tertiary normal-case font-normal tracking-normal">
            · empty = no auto rebook
          </span>
        </label>
        <input
          type="number"
          min={0}
          value={form.rebookAfterDays}
          onChange={(e) => update("rebookAfterDays", e.target.value)}
          placeholder="42"
          className={smallInputClass}
        />
        <p className="text-[11px] text-text-tertiary mt-1.5">
          Drives the &quot;Book your next&quot; CTA on the confirm screen and the rebook-nudge cron.
        </p>
      </div>

      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mt-4 mb-2">
        Group bookings
      </p>
      <label className="flex items-center gap-2 text-[13px] text-text-secondary cursor-pointer mb-2">
        <input
          type="checkbox"
          checked={form.allowGroupBooking}
          onChange={(e) => update("allowGroupBooking", e.target.checked)}
          className="rounded"
        />
        Allow guests (mom + daughter, bridal party)
      </label>
      {form.allowGroupBooking && (
        <div className="mb-5">
          <label className="text-[11px] text-text-tertiary block mb-1">Max group size</label>
          <input
            type="number"
            min={2}
            value={form.maxGroupSize}
            onChange={(e) => update("maxGroupSize", e.target.value)}
            placeholder="4"
            className={smallInputClass}
          />
        </div>
      )}

      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mt-4 mb-2">
        Off-peak / dynamic pricing
      </p>
      <p className="text-[11px] text-text-tertiary mb-3">
        First matching rule wins. Use negative values for off-peak discounts, positive for premium hours.
      </p>
      <div className="space-y-2 mb-5">
        {form.dynamicPriceRules.map((r) => (
          <div
            key={r.id}
            className="bg-card-bg border border-border-light rounded-lg p-3 space-y-2"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={r.label}
                onChange={(e) => updateDynamicRule(r.id, { label: e.target.value })}
                placeholder="Off-peak weekday mornings"
                className={`${smallInputClass} flex-1`}
              />
              <button
                type="button"
                onClick={() => removeDynamicRule(r.id)}
                className="p-1.5 text-text-tertiary hover:text-red-500 cursor-pointer"
                title="Remove rule"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { d: 0, l: "S" },
                { d: 1, l: "M" },
                { d: 2, l: "T" },
                { d: 3, l: "W" },
                { d: 4, l: "T" },
                { d: 5, l: "F" },
                { d: 6, l: "S" },
              ].map(({ d, l }) => {
                const allDays = r.weekdays.length === 0;
                const selected = allDays || r.weekdays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      const cur = r.weekdays;
                      let next: number[];
                      if (cur.length === 0) {
                        next = [0, 1, 2, 3, 4, 5, 6].filter((x) => x !== d);
                      } else if (cur.includes(d)) {
                        next = cur.filter((x) => x !== d);
                      } else {
                        next = [...cur, d];
                      }
                      if (next.length === 7) next = [];
                      updateDynamicRule(r.id, { weekdays: next });
                    }}
                    className={`w-7 h-7 rounded-full text-[11px] font-semibold border cursor-pointer transition-colors ${
                      selected
                        ? "bg-primary text-white border-primary"
                        : "bg-surface text-text-tertiary border-border-light hover:text-foreground"
                    }`}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-[1fr_1fr_120px_100px] gap-2 items-center">
              <input
                type="time"
                value={r.startTime}
                onChange={(e) => updateDynamicRule(r.id, { startTime: e.target.value })}
                className={smallInputClass}
              />
              <input
                type="time"
                value={r.endTime}
                onChange={(e) => updateDynamicRule(r.id, { endTime: e.target.value })}
                className={smallInputClass}
              />
              <select
                value={r.modifierType}
                onChange={(e) =>
                  updateDynamicRule(r.id, {
                    modifierType: e.target.value as "percent" | "amount",
                  })
                }
                className={smallInputClass}
              >
                <option value="percent">% off / on</option>
                <option value="amount">$ off / on</option>
              </select>
              <input
                type="number"
                value={r.modifierValue}
                onChange={(e) => updateDynamicRule(r.id, { modifierValue: e.target.value })}
                placeholder="-20"
                className={smallInputClass}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addDynamicRule}
          className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add pricing rule
        </button>
      </div>

      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mt-4 mb-2">
        Cancellation
      </p>
      <div className="grid grid-cols-2 gap-2 mb-5">
        <div>
          <label className="text-[11px] text-text-tertiary block mb-1">Window (hrs)</label>
          <input
            type="number"
            min={0}
            value={form.cancellationWindowHours}
            onChange={(e) => update("cancellationWindowHours", e.target.value)}
            placeholder="Default"
            className={smallInputClass}
          />
        </div>
        <div>
          <label className="text-[11px] text-text-tertiary block mb-1">Fee inside window (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={form.cancellationFee}
            onChange={(e) => update("cancellationFee", e.target.value)}
            placeholder="0"
            className={smallInputClass}
          />
        </div>
      </div>

      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mt-4 mb-2">
        Intake
        {form.intakeQuestions.length > 0 && !form.intakeFormId && (
          <span className="text-text-tertiary normal-case font-normal tracking-normal ml-1.5">
            ({form.intakeQuestions.length} questions)
          </span>
        )}
        {form.intakeFormId && (
          <span className="text-primary normal-case font-medium tracking-normal ml-1.5">
            · Linked form
          </span>
        )}
      </p>
      <div className="bg-card-bg border border-border-light rounded-xl p-4 mb-5">
        {forms.length > 0 && (
          <div className="mb-4 pb-4 border-b border-border-light">
            <label className="text-[12px] font-medium text-foreground block mb-1.5">
              Use a form for intake
            </label>
            <select
              value={form.intakeFormId}
              onChange={(e) => update("intakeFormId", e.target.value)}
              className={smallInputClass}
            >
              <option value="">Use the inline questions below</option>
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name || "Untitled form"}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-text-tertiary mt-1.5">
              {form.intakeFormId
                ? "The booking flow will render this form during intake. Inline questions below are ignored."
                : "Pick a Form built in the Forms module to use its sections, conditionals, and file uploads instead of the inline questions."}
            </p>
          </div>
        )}
        <p className="text-[11px] text-text-tertiary mb-3">
          {form.intakeFormId
            ? "Inline questions are disabled while a form is linked above."
            : "Custom fields shown during the booking flow's details step. Hidden when empty."}
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

      {/*
       * Service.locationType (Studio/Mobile/Both) is intentionally NOT
       * surfaced anymore. Studio-vs-mobile is now driven by Location.kind
       * — the operator defines real locations (Studio A, Mobile, …) and
       * restricts services via locationIds below. The DB column + type
       * remain for backward compat with older rows; new edits don't
       * touch them.
       */}

      {resources.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border-light">
          <label className="text-[12px] font-medium text-foreground block mb-1.5">
            Required resources
          </label>
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

      {locations.length >= 2 && (
        <div className="mt-4 pt-4 border-t border-border-light">
          <label className="text-[12px] font-medium text-foreground block mb-1.5">
            Available at locations
          </label>
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
                    // All selected → collapse to "Anywhere".
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
    </Section>
  );
}
