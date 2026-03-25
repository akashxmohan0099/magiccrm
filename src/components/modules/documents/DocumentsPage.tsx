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
        <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
          <DataTable
            storageKey="magic-crm-documents-columns"
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

      <FeatureSection moduleId="documents" featureId="auto-attach-to-job" featureLabel="Auto-Attach to Job">
        <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
          <p className="text-[13px] font-medium text-foreground">Auto-Attach is active</p>
          <p className="text-[11px] text-text-tertiary">Documents are automatically linked to their related job or project.</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="documents" featureId="version-history" featureLabel="Version History">
        <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
          <p className="text-[13px] font-medium text-foreground">Version History</p>
          <p className="text-[11px] text-text-tertiary">Track changes across document versions. Previous versions are preserved when a document is updated.</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="documents" featureId="doc-template-variables" featureLabel="Template Variables">
        <div className="mt-4 bg-card-bg rounded-xl border border-border-light p-5">
          <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Template Variables</h3>
          <div className="flex flex-wrap gap-2">
            {["{client_name}", "{date}", "{service}", "{amount}", "{business_name}", "{contract_number}"].map(v => (
              <span key={v} className="text-[11px] font-mono px-2 py-1 bg-surface rounded border border-border-light text-text-secondary">{v}</span>
            ))}
          </div>
          <p className="text-[11px] text-text-tertiary mt-2">Use these variables in contract templates. They auto-fill when generating a document.</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="documents" featureId="document-request" featureLabel="Request from Client">
        <div className="mt-4 bg-card-bg rounded-xl border border-border-light p-5">
          <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Document Requests</h3>
          <p className="text-[13px] text-text-tertiary text-center py-4">No pending requests. Request clients to upload specific documents like IDs, insurance, or photos.</p>
          <div className="flex justify-center">
            <button className="px-4 py-2 bg-foreground text-white rounded-lg text-[12px] font-medium cursor-pointer hover:opacity-90">Request Document</button>
          </div>
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
