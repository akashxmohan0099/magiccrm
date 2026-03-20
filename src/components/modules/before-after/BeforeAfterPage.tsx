"use client";

import { useState } from "react";
import { Plus, Camera } from "lucide-react";
import { useBeforeAfterStore } from "@/store/before-after";
import { BeforeAfterRecord } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { BeforeAfterForm } from "./BeforeAfterForm";

export function BeforeAfterPage() {
  const { records } = useBeforeAfterStore();
  const [formOpen, setFormOpen] = useState(false);

  const columns: Column<BeforeAfterRecord>[] = [
    { key: "clientName", label: "Client", sortable: true },
    { key: "title", label: "Title", sortable: true },
    { key: "beforePhotos", label: "Before", render: (r) => `${r.beforePhotos.length} photo${r.beforePhotos.length !== 1 ? "s" : ""}` },
    { key: "afterPhotos", label: "After", render: (r) => `${r.afterPhotos.length} photo${r.afterPhotos.length !== 1 ? "s" : ""}` },
    { key: "checklist", label: "Checklist", render: (r) => r.checklist.length > 0 ? `${r.checklist.filter((c) => c.checked).length}/${r.checklist.length}` : <span className="text-text-tertiary">—</span> },
    { key: "createdAt", label: "Date", sortable: true, render: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <PageHeader
        title="Before & After"
        description="Capture proof of work with photos and checklists."
        actions={<Button variant="primary" size="sm" onClick={() => setFormOpen(true)}><Plus className="w-4 h-4" /> New Record</Button>}
      />
      {records.length === 0 ? (
        <EmptyState
          icon={<Camera className="w-10 h-10" />}
          title="No records yet"
          description="Document your work with before/after photos and job checklists."
          setupSteps={[{ label: "Create your first record", description: "Add photos, notes, and a checklist", action: () => setFormOpen(true) }]}
        />
      ) : (
        <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
          <DataTable<BeforeAfterRecord> columns={columns} data={records} keyExtractor={(r) => r.id} />
        </div>
      )}
      <BeforeAfterForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
