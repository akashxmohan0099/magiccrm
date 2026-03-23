"use client";

import { useId } from "react";

interface FormFieldProps {
  label: string;
  error?: string;
  success?: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
  htmlFor?: string;
}

export function FormField({ label, error, success, children, required, hint, htmlFor }: FormFieldProps) {
  const autoId = useId();
  const fieldId = htmlFor || autoId;
  const messageId = `${fieldId}-msg`;
  const hasMessage = !!(error || success || hint);

  return (
    <div className="mb-5">
      <label
        htmlFor={fieldId}
        className="block text-[13px] font-medium text-foreground mb-1.5"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p id={messageId} role="alert" className="text-[12px] text-red-500 mt-1.5 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
          {error}
        </p>
      )}
      {success && !error && (
        <p id={messageId} className="text-[12px] text-emerald-600 mt-1.5 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-emerald-500" />
          {success}
        </p>
      )}
      {hint && !error && !success && (
        <p id={hasMessage ? messageId : undefined} className="text-[12px] text-text-tertiary mt-1.5">{hint}</p>
      )}
    </div>
  );
}
