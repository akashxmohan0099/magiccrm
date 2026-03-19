"use client";

interface FormFieldProps {
  label: string;
  error?: string;
  success?: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}

export function FormField({ label, error, success, children, required, hint }: FormFieldProps) {
  return (
    <div className="mb-5">
      <label className="block text-[13px] font-medium text-foreground mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[12px] text-red-500 mt-1.5 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
          {error}
        </p>
      )}
      {success && (
        <p className="text-[12px] text-emerald-600 mt-1.5 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-emerald-500" />
          {success}
        </p>
      )}
      {hint && !error && !success && (
        <p className="text-[12px] text-text-tertiary mt-1.5">{hint}</p>
      )}
    </div>
  );
}
