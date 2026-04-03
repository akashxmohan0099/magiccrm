"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileIcon, Image as ImageIcon } from "lucide-react";

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  existingFiles?: { name: string; url: string }[];
  onRemoveExisting?: (url: string) => void;
  disabled?: boolean;
  label?: string;
}

export function FileUpload({
  onFilesSelected,
  accept = "image/*",
  multiple = true,
  maxSizeMB = 10,
  existingFiles = [],
  onRemoveExisting,
  disabled = false,
  label = "Drop files here or click to upload",
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      setError(null);
      const maxBytes = maxSizeMB * 1024 * 1024;
      const valid: File[] = [];
      const newPreviews: { file: File; url: string }[] = [];

      Array.from(files).forEach((file) => {
        if (file.size > maxBytes) {
          setError(`${file.name} exceeds ${maxSizeMB}MB limit`);
          return;
        }
        valid.push(file);
        if (file.type.startsWith("image/")) {
          newPreviews.push({ file, url: URL.createObjectURL(file) });
        } else {
          newPreviews.push({ file, url: "" });
        }
      });

      if (valid.length > 0) {
        setPreviews((prev) => (multiple ? [...prev, ...newPreviews] : newPreviews));
        onFilesSelected(valid);
      }
    },
    [maxSizeMB, multiple, onFilesSelected]
  );

  const removePreview = (index: number) => {
    setPreviews((prev) => {
      const removed = prev[index];
      if (removed.url) URL.revokeObjectURL(removed.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled && e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
          disabled
            ? "opacity-50 cursor-not-allowed border-border-light bg-surface/30"
            : dragOver
              ? "border-primary bg-primary/5"
              : "border-border-light hover:border-foreground/20 hover:bg-surface/50"
        }`}
      >
        <Upload className={`w-5 h-5 ${dragOver ? "text-primary" : "text-text-tertiary"}`} />
        <p className="text-[13px] text-text-secondary text-center">{label}</p>
        <p className="text-[11px] text-text-tertiary">Max {maxSizeMB}MB per file</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {error && (
        <p className="text-[12px] text-red-500 font-medium">{error}</p>
      )}

      {/* Existing files */}
      {existingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {existingFiles.map((f) => (
            <div key={f.url} className="relative group">
              {f.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img src={f.url} alt={f.name} className="w-16 h-16 object-cover rounded-lg border border-border-light" />
              ) : (
                <div className="w-16 h-16 flex items-center justify-center bg-surface rounded-lg border border-border-light">
                  <FileIcon className="w-5 h-5 text-text-tertiary" />
                </div>
              )}
              {onRemoveExisting && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveExisting(f.url); }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <p className="text-[9px] text-text-tertiary mt-0.5 truncate w-16">{f.name}</p>
            </div>
          ))}
        </div>
      )}

      {/* New file previews */}
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((p, i) => (
            <div key={i} className="relative group">
              {p.url ? (
                <img src={p.url} alt={p.file.name} className="w-16 h-16 object-cover rounded-lg border border-border-light" />
              ) : (
                <div className="w-16 h-16 flex items-center justify-center bg-surface rounded-lg border border-border-light">
                  <FileIcon className="w-5 h-5 text-text-tertiary" />
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); removePreview(i); }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
              <p className="text-[9px] text-text-tertiary mt-0.5 truncate w-16">{p.file.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
