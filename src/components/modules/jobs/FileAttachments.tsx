"use client";

import { useRef, useMemo } from "react";
import { Upload, Trash2, FileIcon, Paperclip } from "lucide-react";
import { useJobsStore } from "@/store/jobs";
import { useAuth } from "@/hooks/useAuth";

interface FileAttachmentsProps {
  jobId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileAttachments({ jobId }: FileAttachmentsProps) {
  const { jobs, addFile, deleteFile } = useJobsStore();
  const { workspaceId } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const job = useMemo(() => jobs.find((j) => j.id === jobId), [jobs, jobId]);
  const files = job?.files ?? [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        addFile(jobId, {
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: reader.result as string,
        }, workspaceId ?? undefined);
      };
      reader.readAsDataURL(file);
    });

    // Reset the input so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-border-light rounded-xl hover:border-brand/40 hover:bg-surface/50 transition-colors cursor-pointer"
      >
        <Upload className="w-6 h-6 text-text-secondary" />
        <p className="text-sm text-text-secondary">
          Click to upload files
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-surface group transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
                <FileIcon className="w-4 h-4 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  {file.name}
                </p>
                <p className="text-xs text-text-secondary">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                onClick={() => deleteFile(jobId, file.id, workspaceId ?? undefined)}
                className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-red-500 cursor-pointer transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length === 0 && (
        <div className="flex flex-col items-center py-4 text-center">
          <Paperclip className="w-5 h-5 text-text-secondary mb-1.5" />
          <p className="text-sm text-text-secondary">
            No files attached yet
          </p>
        </div>
      )}
    </div>
  );
}
