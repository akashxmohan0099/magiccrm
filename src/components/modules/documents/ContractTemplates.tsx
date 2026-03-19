"use client";

import { useState } from "react";
import { FileText, Plus } from "lucide-react";
import { useDocumentsStore } from "@/store/documents";
import { Button } from "@/components/ui/Button";
import { UploadForm } from "./UploadForm";

export function ContractTemplates() {
  const { getTemplates } = useDocumentsStore();
  const [uploadOpen, setUploadOpen] = useState(false);

  const templates = getTemplates();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            Contract Templates
          </h2>
          <p className="text-sm text-text-secondary mt-0.5">
            Reusable templates for contracts and agreements
          </p>
        </div>
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Plus className="w-4 h-4" />
          Create Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-surface rounded-lg border border-border-light p-8 text-center">
          <FileText className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <p className="text-sm text-text-secondary">
            No templates yet. Create your first template to speed up document creation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-card-bg rounded-xl border border-border-light p-4 hover:border-brand/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {template.name}
                  </h3>
                  <p className="text-xs text-text-secondary capitalize mt-0.5">
                    {template.category}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <UploadForm
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        defaultIsTemplate
      />
    </div>
  );
}
