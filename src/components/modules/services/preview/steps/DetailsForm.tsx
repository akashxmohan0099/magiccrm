"use client";

import { useMemo } from "react";
import type { Service, ServiceIntakeQuestion } from "@/types/models";
import type { FlowState } from "../types";
import { IntakeField } from "./IntakeField";

export function DetailsForm({
  flow,
  primaryColor,
  intakeQuestions,
  onChange,
  onIntakeChange,
  onSubmit,
}: {
  flow: FlowState;
  primaryColor: string;
  intakeQuestions: { service: Service; question: ServiceIntakeQuestion }[];
  onChange: (patch: Partial<FlowState>) => void;
  onIntakeChange: (questionId: string, value: string) => void;
  onSubmit: () => void;
}) {
  const requiredAnswered = intakeQuestions.every(({ question }) => {
    if (!question.required) return true;
    const v = (flow.intakeAnswers[question.id] ?? "").trim();
    return v.length > 0;
  });
  const canSubmit =
    flow.name.trim() && flow.email.trim() && flow.phone.trim() && requiredAnswered;
  const inputClass =
    "w-full px-3.5 py-2.5 bg-card-bg border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  // Group intake questions by service so the operator's structure carries through.
  const grouped = useMemo(() => {
    const map = new Map<string, { service: Service; questions: ServiceIntakeQuestion[] }>();
    for (const { service, question } of intakeQuestions) {
      if (!map.has(service.id)) map.set(service.id, { service, questions: [] });
      map.get(service.id)!.questions.push(question);
    }
    return Array.from(map.values());
  }, [intakeQuestions]);

  return (
    <div className="space-y-4">
      <div className="bg-card-bg border border-border-light rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-[12px] font-medium text-foreground block mb-1.5">Full name</label>
          <input
            autoFocus
            value={flow.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Your name"
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-[12px] font-medium text-foreground block mb-1.5">Email</label>
          <input
            type="email"
            value={flow.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="you@email.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-[12px] font-medium text-foreground block mb-1.5">Phone</label>
          <input
            type="tel"
            value={flow.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="0400 000 000"
            className={inputClass}
          />
        </div>
      </div>

      {grouped.map(({ service, questions }) => (
        <div key={service.id} className="bg-card-bg border border-border-light rounded-2xl p-5">
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.1em] mb-3">
            For {service.name}
          </p>
          <div className="space-y-4">
            {questions.map((q) => (
              <IntakeField
                key={q.id}
                question={q}
                value={flow.intakeAnswers[q.id] ?? ""}
                onChange={(v) => onIntakeChange(q.id, v)}
                inputClass={inputClass}
              />
            ))}
          </div>
        </div>
      ))}

      <button
        disabled={!canSubmit}
        onClick={onSubmit}
        className="w-full py-3 rounded-xl text-[14px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-opacity"
        style={{ backgroundColor: primaryColor }}
      >
        Confirm booking
      </button>
      <p className="text-[11px] text-text-tertiary text-center">
        By confirming, you agree to the cancellation policy.
      </p>
    </div>
  );
}
