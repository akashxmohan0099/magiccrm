"use client";

import { useState, useMemo } from "react";
import { Loader2, Upload, X as XIcon } from "lucide-react";
import type { FormFieldConfig } from "@/types/models";
import { isFieldVisible, splitMulti } from "@/lib/form-logic";
import { SignaturePad } from "./SignaturePad";
import type { RenderableService } from "./renderer-types";
import { autocompleteFor, selectPlaceholderText } from "./renderer-helpers";

export function FieldRow({
  field,
  value,
  brandColor,
  accentColor,
  onChange,
  size = "md",
  preview,
  autoFocus,
  services,
  fieldId: providedId,
  error,
}: {
  field: FormFieldConfig;
  value: string;
  brandColor: string;
  /** Accent color for secondary surfaces (radio dots, checkbox marks). Defaults to brand. */
  accentColor?: string;
  onChange: (v: string) => void;
  size?: "sm" | "md" | "lg";
  preview?: boolean;
  autoFocus?: boolean;
  services?: RenderableService[];
  /** DOM id for the input — controls htmlFor/id linkage. Falls back to a
   *  derived id if omitted. */
  fieldId?: string;
  /** Inline validation error for this field. */
  error?: string;
}) {
  const checkColor = accentColor || brandColor;
  const ringStyle = { "--brand": brandColor } as React.CSSProperties;
  const sizing =
    size === "lg"
      ? "px-4 py-4 text-[16px] rounded-xl"
      : size === "sm"
      ? "px-3 py-2 text-[13px] rounded-lg"
      : "px-4 py-3 text-[14px] rounded-xl";
  const errorRing = error ? "border-red-400 focus:border-red-500" : "";
  const inputClass = `w-full bg-surface border border-border-light text-foreground placeholder:text-text-tertiary outline-none transition-colors focus:border-[var(--brand)] ${sizing} ${errorRing}`.trim();
  const placeholder = field.placeholder ?? field.label;
  const labelSize = size === "lg" ? "text-[14px]" : size === "sm" ? "text-[11px]" : "text-[12px]";
  const fieldId = providedId ?? `f-${field.name}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const helpId = field.helpText ? `${fieldId}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(" ") || undefined;
  const ac = autocompleteFor(field);

  // Hidden fields render nothing; they're auto-populated from URL params.
  if (field.type === "hidden") return null;

  const selected = splitMulti(value);
  // For radio/checkbox/multi_select groups we use role=group + aria-labelledby
  // since the visual label points at a set of inputs, not one input.
  const isGroup = field.type === "radio" || field.type === "checkbox" || field.type === "multi_select";
  const labelProps = isGroup
    ? { id: `${fieldId}-label` }
    : { htmlFor: fieldId };

  return (
    <div>
      <label
        {...labelProps}
        className={`${labelSize} font-semibold text-foreground block mb-1.5`}
      >
        {field.label}
        {field.required && <span className="text-text-tertiary font-normal ml-1">*</span>}
      </label>
      {field.type === "radio" ? (
        <div
          role="radiogroup"
          aria-labelledby={`${fieldId}-label`}
          aria-describedby={describedBy}
          className="space-y-1.5"
        >
          {(field.options ?? []).map((opt) => (
            <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name={field.name}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(opt)}
                className="w-4 h-4 cursor-pointer"
                style={{ accentColor: checkColor }}
              />
              <span className="text-[14px] text-foreground group-hover:text-foreground">{opt}</span>
            </label>
          ))}
        </div>
      ) : field.type === "checkbox" || field.type === "multi_select" ? (
        // Chip-style multi-select. Each option is a toggleable pill —
        // selected pills get a brand-tinted bg + border. Compared to bare
        // `<input type="checkbox">` rows this scans as obviously
        // interactive, gives a tap target sized for mobile, and matches
        // the routed-thank-you variant chip pattern elsewhere in the app.
        <div role="group" aria-labelledby={`${fieldId}-label`} aria-describedby={describedBy}>
          <div className="flex flex-wrap gap-1.5">
            {(field.options ?? []).map((opt) => {
              const isOn = selected.includes(opt);
              const atCap = !!field.maxSelections && selected.length >= field.maxSelections && !isOn;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    if (atCap) return;
                    const next = isOn
                      ? selected.filter((v) => v !== opt)
                      : [...selected, opt];
                    onChange(next.join(", "));
                  }}
                  aria-pressed={isOn}
                  disabled={atCap}
                  className={`px-3 py-1.5 rounded-full border text-[13px] font-medium transition-colors ${
                    atCap
                      ? "cursor-not-allowed opacity-50 bg-surface border-border-light text-text-tertiary"
                      : "cursor-pointer"
                  } ${
                    isOn || atCap
                      ? ""
                      : "bg-surface border-border-light text-text-secondary hover:border-text-tertiary hover:text-foreground"
                  }`}
                  style={
                    isOn
                      ? {
                          backgroundColor: `${checkColor}1A`,
                          borderColor: checkColor,
                          color: checkColor,
                        }
                      : undefined
                  }
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {field.maxSelections && (
            <p className="text-[11px] text-text-tertiary mt-1.5">
              Select up to {field.maxSelections} ({selected.length}/{field.maxSelections})
            </p>
          )}
        </div>
      ) : field.type === "file" ? (
        <FileInput
          field={field}
          value={value}
          onChange={onChange}
          preview={preview}
          inputClass={inputClass}
          brandColor={brandColor}
        />
      ) : field.type === "textarea" ? (
        <div>
          <textarea
            id={fieldId}
            name={field.name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={size === "lg" ? 5 : size === "sm" ? 3 : 4}
            placeholder={placeholder}
            style={ringStyle}
            autoFocus={autoFocus}
            maxLength={field.maxLength}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`${inputClass} resize-none`}
          />
          {field.maxLength && (
            <p
              className={`text-[11px] mt-1 text-right ${
                value.length >= field.maxLength
                  ? "text-red-500 font-medium"
                  : "text-text-tertiary"
              }`}
              aria-live="polite"
            >
              {value.length} / {field.maxLength}
            </p>
          )}
        </div>
      ) : field.type === "select" ? (
        <select
          id={fieldId}
          name={field.name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={ringStyle}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputClass}
        >
          <option value="">{selectPlaceholderText(field)}</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : field.type === "service" ? (
        // Live-services dropdown. Always appends "Other" so visitors aren't
        // boxed in if their need doesn't match a configured service.
        <select
          id={fieldId}
          name={field.name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={ringStyle}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputClass}
        >
          <option value="">{selectPlaceholderText(field)}</option>
          {services?.map((svc) => (
            <option key={svc.id} value={svc.name}>
              {svc.name}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
      ) : field.type === "signature" ? (
        <SignaturePad
          value={value}
          onChange={(dataUrl) => onChange(dataUrl)}
          invalid={!!error}
        />
      ) : field.type === "date_range" ? (
        // Two date inputs side by side; values stored as a single
        // "YYYY-MM-DD to YYYY-MM-DD" string so the existing string-based
        // submission pipeline keeps working without schema changes.
        <DateRangeInput
          fieldId={fieldId}
          value={value}
          onChange={onChange}
          ringStyle={ringStyle}
          inputClass={inputClass}
          describedBy={describedBy}
          invalid={!!error}
        />
      ) : (
        <input
          id={fieldId}
          name={field.name}
          type={
            field.type === "email"
              ? "email"
              : field.type === "phone"
              ? "tel"
              : field.type === "url"
              ? "url"
              : field.type === "number"
              ? "number"
              : field.type === "date"
              ? "date"
              : field.type === "time"
              ? "time"
              : "text"
          }
          inputMode={
            field.type === "number"
              ? "numeric"
              : field.type === "phone"
              ? "tel"
              : field.type === "url"
              ? "url"
              : undefined
          }
          autoComplete={ac}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            field.type === "url"
              ? placeholder ?? "https://"
              : placeholder
          }
          style={ringStyle}
          autoFocus={autoFocus}
          min={field.type === "number" ? field.min : undefined}
          max={field.type === "number" ? field.max : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputClass}
        />
      )}
      {field.helpText && (
        <p id={helpId} className={`${size === "sm" ? "text-[10px]" : "text-[11px]"} text-text-tertiary mt-1.5`}>{field.helpText}</p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-[11px] text-red-600 mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
}

function DateRangeInput({
  fieldId,
  value,
  onChange,
  ringStyle,
  inputClass,
  describedBy,
  invalid,
}: {
  fieldId: string;
  value: string;
  onChange: (v: string) => void;
  ringStyle: React.CSSProperties;
  inputClass: string;
  describedBy?: string;
  invalid?: boolean;
}) {
  const [start = "", end = ""] = value.split(" to ");
  const emit = (next: { start?: string; end?: string }) => {
    const s = next.start ?? start;
    const e = next.end ?? end;
    if (!s && !e) onChange("");
    else if (s && e) onChange(`${s} to ${e}`);
    else onChange(s || e);
  };
  return (
    <div className="flex items-center gap-2">
      <input
        id={fieldId}
        type="date"
        aria-label="Start date"
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        value={start}
        onChange={(e) => emit({ start: e.target.value })}
        style={ringStyle}
        className={inputClass}
      />
      <span className="text-[12px] text-text-tertiary flex-shrink-0">to</span>
      <input
        id={`${fieldId}-end`}
        type="date"
        aria-label="End date"
        aria-invalid={invalid ? true : undefined}
        value={end}
        onChange={(e) => emit({ end: e.target.value })}
        style={ringStyle}
        className={inputClass}
      />
    </div>
  );
}

// ── File input (shared) ───────────────────────────────
//
// File uploads are stored as a JSON-encoded array of { name, type, dataUrl }
// inside the regular string-based answer pipeline. Keeps the existing form
// submission shape (Record<string, string>) unchanged — no schema migration.
// Each file is base64-encoded; per-file size cap is enforced on the client.

interface UploadedFile {
  name: string;
  type: string;
  dataUrl: string;
}

function decodeFileValue(value: string): UploadedFile[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (f): f is UploadedFile =>
          typeof f === "object" && f !== null && typeof f.dataUrl === "string",
      );
    }
  } catch {
    // ignore — legacy or non-JSON value
  }
  return [];
}

function FileInput({
  field,
  value,
  onChange,
  preview,
  inputClass,
  brandColor,
}: {
  field: FormFieldConfig;
  value: string;
  onChange: (v: string) => void;
  preview?: boolean;
  inputClass: string;
  brandColor: string;
}) {
  const [error, setError] = useState("");
  const files = useMemo(() => decodeFileValue(value), [value]);
  const maxMb = field.maxFileSizeMb ?? 5;
  const allowMany = !!field.multipleFiles;
  const maxFiles = allowMany ? field.maxFiles : undefined;

  const addFiles = (incoming: FileList | null) => {
    if (!incoming || preview) return;
    const list = Array.from(incoming);
    // Cap the total uploaded count when the operator set a maxFiles. Trims
    // the incoming batch so the user gets the first N rather than a hard
    // rejection of the whole drop.
    if (maxFiles && files.length >= maxFiles) {
      setError(`You can upload up to ${maxFiles} file${maxFiles === 1 ? "" : "s"}.`);
      return;
    }
    const remainingSlots = maxFiles ? Math.max(0, maxFiles - files.length) : list.length;
    const trimmed = list.slice(0, remainingSlots);
    Promise.all(
      trimmed.map(
        (f) =>
          new Promise<UploadedFile | null>((resolve) => {
            if (f.size > maxMb * 1024 * 1024) {
              setError(`${f.name} is over the ${maxMb}MB limit.`);
              resolve(null);
              return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
              const dataUrl = e.target?.result;
              if (typeof dataUrl !== "string") {
                resolve(null);
                return;
              }
              resolve({ name: f.name, type: f.type, dataUrl });
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(f);
          }),
      ),
    ).then((parsed) => {
      const ok = parsed.filter((p): p is UploadedFile => p !== null);
      if (ok.length === 0) return;
      const next = allowMany ? [...files, ...ok] : ok.slice(0, 1);
      onChange(JSON.stringify(next));
      setError("");
    });
  };

  const removeAt = (i: number) => {
    const next = files.filter((_, idx) => idx !== i);
    onChange(next.length ? JSON.stringify(next) : "");
  };

  return (
    <div>
      <label
        className={`${inputClass} flex items-center gap-2 cursor-pointer hover:border-[var(--brand)] transition-colors`}
        style={{ "--brand": brandColor } as React.CSSProperties}
      >
        <Upload className="w-4 h-4 text-text-tertiary flex-shrink-0" />
        <span className="text-text-tertiary truncate">
          {files.length > 0
            ? maxFiles && files.length >= maxFiles
              ? `${files.length} of ${maxFiles} file${maxFiles === 1 ? "" : "s"} — at max`
              : `${files.length} file${files.length > 1 ? "s" : ""} selected — add another${maxFiles ? ` (max ${maxFiles})` : ""}`
            : `Click to upload${allowMany ? (maxFiles ? ` (up to ${maxFiles})` : " (multiple allowed)") : ""}`}
        </span>
        <input
          type="file"
          accept={field.acceptedFileTypes || undefined}
          multiple={allowMany}
          disabled={preview}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
      </label>
      {error && <p className="text-[11px] text-red-600 mt-1.5">{error}</p>}
      {files.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {files.map((f, i) => {
            const isImage = f.type.startsWith("image/");
            return (
              <div key={i} className="relative rounded-lg border border-border-light overflow-hidden bg-surface aspect-square">
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.dataUrl} alt={f.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-2 text-center">
                    <span className="text-[10px] text-text-secondary truncate">{f.name}</span>
                  </div>
                )}
                {!preview && (
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                    aria-label={`Remove ${f.name}`}
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Submit button (shared) ────────────────────────────

