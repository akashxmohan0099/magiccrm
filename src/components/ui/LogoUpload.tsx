"use client";

import { useRef } from "react";
import { ImagePlus } from "lucide-react";
import { toast } from "@/components/ui/Toast";

interface LogoUploadProps {
  value: string;
  onChange: (next: string) => void;
  /** Shown above the upload tile */
  label?: string;
  /** Override the default copy under the title */
  hint?: string;
  /** Title shown next to the tile when no image is set. Default: "No logo" */
  emptyLabel?: string;
  /** Title shown next to the tile when an image is set. Default: "Logo set" */
  setLabel?: string;
  /** Accept text-paste of remote URLs in addition to file upload */
  allowUrlPaste?: boolean;
  /** Single-row layout: thumbnail + URL field + upload/remove inline. */
  compact?: boolean;
}

/**
 * Square logo upload — file picker → data URL, with preview + remove.
 * Mirrors the FormLogoUpload pattern so Forms and Services feel identical.
 */
export function LogoUpload({
  value,
  onChange,
  label = "Logo",
  hint,
  emptyLabel = "No logo",
  setLabel = "Logo set",
  allowUrlPaste = true,
  compact = false,
}: LogoUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("Image must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) onChange(e.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (compact) {
    return (
      <div>
        <label className="text-[11px] text-text-tertiary block mb-1">{label}</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-9 h-9 rounded-lg border border-dashed border-border-light bg-surface hover:border-text-tertiary cursor-pointer flex items-center justify-center overflow-hidden transition-colors flex-shrink-0"
            title={value ? "Change image" : "Upload image"}
          >
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImagePlus className="w-4 h-4 text-text-tertiary" />
            )}
          </button>
          <input
            type="url"
            value={value && !value.startsWith("data:") ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Upload or paste image URL"
            className="flex-1 min-w-0 px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-[12px] text-text-tertiary hover:text-foreground cursor-pointer flex-shrink-0"
            >
              Remove
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-2">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative w-16 h-16 rounded-2xl border-2 border-dashed border-border-light bg-surface hover:border-text-tertiary cursor-pointer flex items-center justify-center overflow-hidden transition-colors flex-shrink-0"
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <ImagePlus className="w-5 h-5 text-text-tertiary" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-foreground">
            {value ? setLabel : emptyLabel}
          </p>
          <p className="text-[12px] text-text-secondary leading-snug">
            {hint ?? "Square image works best. Falls back to your business name initial."}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-[12px] text-primary font-medium hover:underline cursor-pointer"
            >
              {value ? "Change" : "Upload"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="text-[12px] text-text-tertiary hover:text-foreground cursor-pointer"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
      {allowUrlPaste && (
        <input
          type="url"
          value={value && !value.startsWith("data:") ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="…or paste an image URL"
          className="w-full mt-3 px-3 py-2 bg-surface border border-border-light rounded-lg text-[12px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/20"
        />
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
