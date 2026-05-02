"use client";

import { useRef } from "react";
import { ImagePlus } from "lucide-react";
import { toast } from "@/components/ui/Toast";

// Logo uploader for a single form. Falls back to the workspace logo
// (Settings → Brand Identity) when this form has no override of its own.
export function FormLogoUpload({
  logo,
  workspaceLogo,
  onChange,
}: {
  logo?: string;
  workspaceLogo?: string;
  onChange: (next: string | undefined) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const effective = logo || workspaceLogo;
  const usingFallback = !logo && !!workspaceLogo;

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

  return (
    <div>
      <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-2">Logo</label>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative w-16 h-16 rounded-2xl border-2 border-dashed border-border-light bg-surface hover:border-text-tertiary cursor-pointer flex items-center justify-center overflow-hidden transition-colors"
        >
          {effective ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={effective} alt="Form logo" className="w-full h-full object-cover" />
          ) : (
            <ImagePlus className="w-5 h-5 text-text-tertiary" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-foreground">
            {logo
              ? "Custom logo for this form"
              : usingFallback
              ? "Using workspace logo"
              : "No logo set"}
          </p>
          <p className="text-[13px] text-text-secondary mt-1 leading-snug">
            {logo
              ? "Overrides your workspace logo on this form."
              : workspaceLogo
              ? "Set in Settings → Brand Identity. Upload one here to override just this form."
              : "Upload a logo here, or set one in Settings to apply across every form."}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-[12px] text-primary font-medium hover:underline cursor-pointer"
            >
              {logo ? "Change" : "Upload"}
            </button>
            {logo && (
              <button
                type="button"
                onClick={() => onChange(undefined)}
                className="text-[12px] text-text-tertiary hover:text-foreground cursor-pointer"
              >
                Use workspace logo
              </button>
            )}
          </div>
        </div>
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

// Cover image — wide hero photo rendered above the form title across all
// templates. Beauty is a visual sell, so this is one of the highest-value
// branding knobs we expose.
export function CoverImageUpload({
  value,
  onChange,
}: {
  value?: string;
  onChange: (next: string | undefined) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("Cover image must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) onChange(e.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-2">Cover image</label>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="relative w-full aspect-[3/1] rounded-2xl border-2 border-dashed border-border-light bg-surface hover:border-text-tertiary cursor-pointer flex items-center justify-center overflow-hidden transition-colors"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Form cover" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <ImagePlus className="w-5 h-5 text-text-tertiary mx-auto mb-1" />
            <p className="text-[12px] text-text-tertiary">Add a hero image</p>
          </div>
        )}
      </button>
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-[11px] text-text-secondary leading-snug">
          Wide photo shown above the form title. Best at 1500×500.
        </p>
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-[12px] text-text-tertiary hover:text-foreground cursor-pointer"
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
