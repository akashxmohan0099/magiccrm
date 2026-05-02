"use client";

import type { ServiceIntakeQuestion } from "@/types/models";

export function IntakeField({
  question,
  value,
  onChange,
  inputClass,
}: {
  question: ServiceIntakeQuestion;
  value: string;
  onChange: (v: string) => void;
  inputClass: string;
}) {
  const label = (
    <label className="text-[12px] font-medium text-foreground block mb-1.5">
      {question.label}
      {question.required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
  const hint = question.hint && (
    <p className="text-[11px] text-text-tertiary mt-1">{question.hint}</p>
  );

  if (question.type === "longtext") {
    return (
      <div>
        {label}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={`${inputClass} resize-none`}
        />
        {hint}
      </div>
    );
  }
  if (question.type === "select") {
    return (
      <div>
        {label}
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          <option value="">Pick one…</option>
          {(question.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {hint}
      </div>
    );
  }
  if (question.type === "yesno") {
    return (
      <div>
        {label}
        <div className="flex items-center gap-2">
          {["Yes", "No"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-medium border cursor-pointer transition-colors ${
                value === opt
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-text-secondary border-border-light hover:text-foreground"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {hint}
      </div>
    );
  }
  if (question.type === "date") {
    return (
      <div>
        {label}
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
        {hint}
      </div>
    );
  }
  if (question.type === "number") {
    return (
      <div>
        {label}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
        {hint}
      </div>
    );
  }
  return (
    <div>
      {label}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
      {hint}
    </div>
  );
}
