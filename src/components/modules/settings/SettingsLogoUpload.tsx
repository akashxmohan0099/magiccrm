"use client";

import { useRef, useState, useCallback } from "react";
import { Camera, ImagePlus, X } from "lucide-react";

// Settings-specific logo dropzone — circular avatar style with hover overlay.
// Distinct from the generic <LogoUpload> in components/ui (square card).
export function SettingsLogoUpload({
  logoUrl,
  onLogoChange,
  onClearLogo,
  brandColor,
}: {
  logoUrl?: string;
  onLogoChange: (base64: string) => void;
  onClearLogo: () => void;
  brandColor: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onLogoChange(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    },
    [onLogoChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="flex items-center gap-6">
      <div
        className="relative group cursor-pointer"
        onClick={() => fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
      >
        <div
          className={`w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-200 overflow-hidden ${
            isDragging
              ? "border-foreground bg-surface scale-105"
              : logoUrl
              ? "border-transparent"
              : "border-border-warm hover:border-foreground/30 bg-surface hover:bg-surface/80"
          }`}
        >
          {logoUrl ? (
            <>
              {/* User-uploaded logo URL — domain unknown at build time, so
                  next/image would need wildcard remotePatterns. Plain <img>
                  for the avatar-sized preview is fine here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="Business logo" className="w-full h-full object-cover" />
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <ImagePlus className="w-6 h-6 text-text-tertiary" />
            </div>
          )}
        </div>

        {logoUrl && (
          <button
            onClick={(e) => { e.stopPropagation(); onClearLogo(); }}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-card-bg border border-border-light shadow-sm flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3 text-text-tertiary hover:text-red-500" />
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-foreground">
          {logoUrl ? "Logo uploaded" : "Upload your logo"}
        </p>
        <p className="text-xs text-text-tertiary mt-0.5">
          Drag &amp; drop or click to browse. PNG, JPG up to 5MB.
        </p>
        {logoUrl && (
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs font-medium mt-1.5 cursor-pointer transition-colors"
            style={{ color: brandColor }}
          >
            Change logo
          </button>
        )}
      </div>
    </div>
  );
}
