"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Service } from "@/types/models";
import { generateId } from "@/lib/id";
import type {
  FormState,
  DynamicPriceRuleInput,
} from "./types";
import { Section } from "./Section";
import { InfoHint } from "@/components/ui/InfoHint";

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
  // Default-open when any field already has a value.
  const hasBookingRules = !!(
    (Number(form.bufferBefore) || 0) > 0 ||
    (Number(form.bufferAfter) || 0) > 0 ||
    form.minNoticeHours ||
    form.maxAdvanceDays ||
    form.availableWeekdays.length > 0 ||
    form.allowGroupBooking ||
    form.dynamicPriceRules.length > 0
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

  return (
    <Section
      title="Booking rules"
      defaultOpen={hasBookingRules}
      subtitle="Scheduling, group bookings & pricing rules"
    >
      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
        Scheduling
      </p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="text-[11px] text-text-tertiary mb-1 flex items-center gap-1">
            Buffer before (min)
            <InfoHint text="Hidden padding the system adds before the slot — for setup or prep. Chair counts as occupied; nothing else can be booked into it." />
          </label>
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
          <label className="text-[11px] text-text-tertiary mb-1 flex items-center gap-1">
            Buffer after (min)
            <InfoHint align="right" text="Hidden padding after the slot — for cleanup, room reset, or color processing. Chair stays occupied for this time." />
          </label>
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
          <label className="text-[11px] text-text-tertiary mb-1 flex items-center gap-1">
            Min notice (hrs)
            <InfoHint text="Earliest a client can book before the slot starts. e.g. 24 = no same-day bookings inside that window. Empty inherits the workspace default." />
          </label>
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
          <label className="text-[11px] text-text-tertiary mb-1 flex items-center gap-1">
            Max advance (days)
            <InfoHint align="right" text="Furthest into the future the booking page will offer slots. Stops bookings months ahead before rates or schedules are set." />
          </label>
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
      <div className="space-y-2">
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

      {/* Patch test gate. Lives here rather than in its own section because
          it's another booking-time block — same conceptual bucket as min
          notice / weekday restrictions. Mirrors the runtime gate in
          lib/services/patch-test.ts. */}
      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mt-6 mb-2">
        Patch test
      </p>
      <label className="flex items-center gap-2 text-[13px] text-text-secondary cursor-pointer mb-2">
        <input
          type="checkbox"
          checked={form.requiresPatchTest}
          onChange={(e) => update("requiresPatchTest", e.target.checked)}
          className="rounded"
        />
        Block booking unless a non-expired patch test is on file
      </label>
      {form.requiresPatchTest && (
        <div className="grid grid-cols-3 gap-2 mb-3">
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

      {/*
       * Service.locationType (Studio/Mobile/Both) is intentionally NOT
       * surfaced anymore. Studio-vs-mobile is now driven by Location.kind
       * — the operator defines real locations (Studio A, Mobile, …) and
       * restricts services via locationIds in the "Where & resources"
       * section. The DB column + type remain for backward compat with
       * older rows; new edits don't touch them.
       */}
    </Section>
  );
}
