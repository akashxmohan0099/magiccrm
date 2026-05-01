"use client";

import { useRef } from "react";
import { ImagePlus } from "lucide-react";
import { toast } from "@/components/ui/Toast";

interface CoverImageUploadProps {
  value: string;
  onChange: (next: string) => void;
  label?: string;
}

/**
 * Wide cover photo — drag/drop or click to pick. Stored as a data URL when
 * the picker is used; remote URLs also accepted via direct value.
 * Same UX as Forms' CoverImageUpload, sharable across modules.
 */
export function CoverImageUpload({ value, onChange, label = "Cover image" }: CoverImageUploadProps) {
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
      <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-2">
        {label}
      </label>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="relative w-full aspect-[3/1] rounded-xl border-2 border-dashed border-border-light bg-surface hover:border-text-tertiary cursor-pointer overflow-hidden transition-colors flex items-center justify-center"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <ImagePlus className="w-5 h-5 text-text-tertiary mx-auto mb-1" />
            <p className="text-[11px] text-text-tertiary">Upload cover</p>
          </div>
        )}
      </button>
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-[12px] text-text-tertiary hover:text-foreground cursor-pointer mt-1.5"
        >
          Remove
        </button>
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
