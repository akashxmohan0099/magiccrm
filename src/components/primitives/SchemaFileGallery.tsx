"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, X, FileText, Image, File,
  Trash2, ZoomIn, ChevronLeft, ChevronRight,
} from "lucide-react";

export interface FileItem {
  id: string;
  name: string;
  type: string;        // MIME type
  size: number;        // bytes
  dataUrl: string;     // base64 or blob URL
  uploadedAt: string;
}

interface SchemaFileGalleryProps {
  files: FileItem[];
  onChange: (files: FileItem[]) => void;
  /** Accept filter (e.g., "image/*" or ".pdf,.doc") */
  accept?: string;
  /** Max files allowed */
  maxFiles?: number;
  /** Layout mode */
  mode?: "grid" | "list";
  /** Read-only */
  readOnly?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  if (type.includes("pdf")) return FileText;
  return File;
}

/**
 * File and image gallery with upload, preview, and lightbox.
 * Stores files as base64 dataUrls in localStorage (same pattern as existing codebase).
 */
export function SchemaFileGallery({
  files,
  onChange,
  accept,
  maxFiles = 20,
  mode = "grid",
  readOnly = false,
}: SchemaFileGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback((fileList: FileList) => {
    const remaining = maxFiles - files.length;
    const toAdd = Array.from(fileList).slice(0, remaining);
    const newFiles: FileItem[] = [];
    let loaded = 0;

    for (const file of toAdd) {
      const reader = new FileReader();
      reader.onload = () => {
        newFiles.push({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: reader.result as string,
          uploadedAt: new Date().toISOString(),
        });
        loaded++;
        if (loaded === toAdd.length) {
          onChange([...files, ...newFiles]);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [files, maxFiles, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeFile = useCallback((id: string) => {
    onChange(files.filter((f) => f.id !== id));
  }, [files, onChange]);

  const isImage = (type: string) => type.startsWith("image/");

  return (
    <div className="space-y-3">
      {/* Upload area */}
      {!readOnly && files.length < maxFiles && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border-light hover:border-primary/30 hover:bg-surface/50"
          }`}
        >
          <Upload className="w-6 h-6 text-text-tertiary mx-auto mb-2" />
          <p className="text-[13px] text-text-secondary">
            Drop files here or <span className="text-primary font-medium">browse</span>
          </p>
          <p className="text-[11px] text-text-tertiary mt-1">
            {files.length}/{maxFiles} files
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={accept}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {/* File grid/list */}
      {files.length > 0 && (
        <div className={mode === "grid"
          ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          : "space-y-2"
        }>
          {files.map((file, idx) => {
            const FileIcon = getFileIcon(file.type);

            if (mode === "grid") {
              return (
                <div key={file.id} className="group relative bg-white rounded-xl border border-border-light overflow-hidden">
                  {/* Preview */}
                  {isImage(file.type) ? (
                    <div
                      className="aspect-square bg-surface flex items-center justify-center cursor-pointer"
                      onClick={() => setLightboxIdx(idx)}
                    >
                      <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-square bg-surface flex items-center justify-center">
                      <FileIcon className="w-10 h-10 text-text-tertiary" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="p-2">
                    <p className="text-[11px] font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-[10px] text-text-tertiary">{formatFileSize(file.size)}</p>
                  </div>

                  {/* Actions overlay */}
                  {!readOnly && (
                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      {isImage(file.type) && (
                        <button
                          onClick={() => setLightboxIdx(idx)}
                          className="p-1 bg-black/50 rounded-md text-white hover:bg-black/70 cursor-pointer"
                        >
                          <ZoomIn className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 bg-black/50 rounded-md text-white hover:bg-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            // List mode
            return (
              <div key={file.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-border-light group">
                <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
                  {isImage(file.type) ? (
                    <img src={file.dataUrl} alt={file.name} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <FileIcon className="w-5 h-5 text-text-tertiary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-[11px] text-text-tertiary">{formatFileSize(file.size)}</p>
                </div>
                {!readOnly && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1.5 text-text-tertiary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && files[lightboxIdx] && isImage(files[lightboxIdx].type) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setLightboxIdx(null)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(null); }}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            {lightboxIdx > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
                className="absolute left-4 p-2 text-white/70 hover:text-white cursor-pointer"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            {lightboxIdx < files.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
                className="absolute right-4 p-2 text-white/70 hover:text-white cursor-pointer"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}

            <motion.img
              key={lightboxIdx}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={files[lightboxIdx].dataUrl}
              alt={files[lightboxIdx].name}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            <div className="absolute bottom-4 text-center text-white/70 text-[13px]">
              {files[lightboxIdx].name} — {lightboxIdx + 1} of {files.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
