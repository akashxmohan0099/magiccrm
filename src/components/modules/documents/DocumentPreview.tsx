"use client";

import { useState } from "react";
import {
  FileText,
  Calendar,
  HardDrive,
  Share2,
  Pencil,
  Trash2,
  Link,
} from "lucide-react";
import { useDocumentsStore } from "@/store/documents";
import { useAuth } from "@/hooks/useAuth";
import { SlideOver } from "@/components/ui/SlideOver";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { UploadForm } from "./UploadForm";

interface DocumentPreviewProps {
  open: boolean;
  onClose: () => void;
  documentId: string | null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentPreview({ open, onClose, documentId }: DocumentPreviewProps) {
  const { documents, deleteDocument } = useDocumentsStore();
  const { workspaceId } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const document = documentId
    ? documents.find((d) => d.id === documentId)
    : undefined;

  if (!document) {
    return (
      <SlideOver open={open} onClose={onClose} title="Document Details">
        <p className="text-text-secondary text-sm">Document not found.</p>
      </SlideOver>
    );
  }

  const handleDelete = () => {
    deleteDocument(document.id, workspaceId ?? undefined);
    onClose();
  };

  const infoRow = (
    icon: React.ReactNode,
    label: string,
    value?: string | React.ReactNode
  ) =>
    value ? (
      <div className="flex items-start gap-3 py-2">
        <span className="text-text-secondary mt-0.5">{icon}</span>
        <div>
          <p className="text-xs text-text-secondary">{label}</p>
          <div className="text-sm text-foreground">{value}</div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <SlideOver open={open} onClose={onClose} title="Document Details">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-foreground" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-semibold text-foreground tracking-tight truncate">
                  {document.name}
                </h3>
                <p className="text-sm text-text-secondary capitalize mt-0.5">
                  {document.category}
                </p>
                {document.isTemplate && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface text-foreground border border-foreground/20 mt-1">
                    Template
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
            </div>
          </div>

          {/* Document Info */}
          <div className="bg-surface rounded-lg p-4 border border-border-light">
            <h4 className="text-sm font-medium text-foreground mb-2">
              Document Information
            </h4>
            {infoRow(
              <FileText className="w-4 h-4" />,
              "Type",
              document.type
            )}
            {infoRow(
              <HardDrive className="w-4 h-4" />,
              "Size",
              formatSize(document.size)
            )}
            {infoRow(
              <Calendar className="w-4 h-4" />,
              "Uploaded",
              new Date(document.createdAt).toLocaleDateString()
            )}
            {infoRow(
              <Share2 className="w-4 h-4" />,
              "Shared",
              document.shared ? "Yes" : "No"
            )}
            {document.signatureStatus && document.signatureStatus !== "none" && (
              <div className="flex items-start gap-3 py-2">
                <span className="text-text-secondary mt-0.5">
                  <FileText className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-xs text-text-secondary">Signature Status</p>
                  <div className="mt-0.5">
                    <StatusBadge status={document.signatureStatus} />
                  </div>
                </div>
              </div>
            )}
            {document.signatureStatus === "none" && (
              <div className="flex items-start gap-3 py-2">
                <span className="text-text-secondary mt-0.5">
                  <FileText className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-xs text-text-secondary">Signature Status</p>
                  <p className="text-sm text-text-secondary">Not required</p>
                </div>
              </div>
            )}
          </div>

          {/* Share Link */}
          {document.shared && (
            <div className="bg-surface rounded-lg p-4 border border-border-light">
              <h4 className="text-sm font-medium text-foreground mb-2">
                Sharing
              </h4>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-card-bg border border-border-light rounded-lg text-sm text-text-secondary truncate">
                  https://app.usemagic.com/shared/{document.id}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `https://app.usemagic.com/shared/${document.id}`
                    );
                  }}
                >
                  <Link className="w-3.5 h-3.5" />
                  Copy
                </Button>
              </div>
            </div>
          )}
        </div>
      </SlideOver>

      <UploadForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Document"
        message={`Are you sure you want to delete "${document.name}"? This action cannot be undone.`}
      />
    </>
  );
}
