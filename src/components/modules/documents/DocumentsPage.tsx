"use client";

import { useState, useMemo } from "react";
import { FileText } from "lucide-react";
import { useDocumentsStore } from "@/store/documents";
import { Document } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { UploadForm } from "./UploadForm";
import { DocumentPreview } from "./DocumentPreview";
import { ContractTemplates } from "./ContractTemplates";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsPage() {
  const { documents } = useDocumentsStore();
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return documents;
    const q = search.toLowerCase();
    return documents.filter((d) => d.name.toLowerCase().includes(q));
  }, [documents, search]);

  const columns: Column<Document>[] = [
    { key: "name", label: "Name", sortable: true },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (doc) => (
        <span className="capitalize">{doc.category}</span>
      ),
    },
    { key: "type", label: "Type", sortable: true },
    {
      key: "size",
      label: "Size",
      sortable: true,
      render: (doc) => <span>{formatSize(doc.size)}</span>,
    },
    {
      key: "shared",
      label: "Shared",
      render: (doc) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
            doc.shared
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-gray-50 text-gray-600 border-gray-200"
          }`}
        >
          {doc.shared ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (doc) => (
        <span className="text-text-secondary text-xs">
          {new Date(doc.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Upload and manage your files, contracts, and templates"
        actions={
          <div className="flex items-center gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search documents..."
            />
            <Button onClick={() => setUploadOpen(true)}>Upload Document</Button>
          </div>
        }
      />

      {documents.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          title="No documents yet"
          description="Upload your first document to start organizing your files."
          actionLabel="Upload Document"
          onAction={() => setUploadOpen(true)}
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary text-sm">
            No documents match your search.
          </p>
        </div>
      ) : (
        <div className="bg-card-bg rounded-xl border border-border-warm overflow-hidden">
          <DataTable
            columns={columns}
            data={filtered}
            onRowClick={(doc) => setPreviewDocId(doc.id)}
            keyExtractor={(doc) => doc.id}
          />
        </div>
      )}

      {/* Contract Templates - Feature Gated */}
      <FeatureSection moduleId="documents" featureId="contract-templates">
        <div className="mt-8">
          <ContractTemplates />
        </div>
      </FeatureSection>

      <UploadForm open={uploadOpen} onClose={() => setUploadOpen(false)} />

      <DocumentPreview
        open={previewDocId !== null}
        onClose={() => setPreviewDocId(null)}
        documentId={previewDocId}
      />
    </div>
  );
}
