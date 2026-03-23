"use client";

import { useState, useRef } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import {
  clearMagicCrmLocalData,
  createMagicCrmLocalBackup,
  restoreMagicCrmBackup,
} from "@/lib/local-backup";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function DataManagement() {
  const [confirmClear, setConfirmClear] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportAllData = () => {
    const data = createMagicCrmLocalBackup(window.localStorage);

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `magic-crm-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAllData = () => {
    clearMagicCrmLocalData(window.localStorage);
    window.location.reload();
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as unknown;
        const result = restoreMagicCrmBackup(window.localStorage, parsed);
        setImportStatus(
          result.mode === "full"
            ? `Restored ${result.restoredKeys.length} stores. Reloading…`
            : `Restored ${result.restoredKeys.length} legacy data stores. Reloading…`
        );
        window.setTimeout(() => {
          window.location.reload();
        }, 400);
      } catch {
        setImportStatus("Unsupported JSON backup. Export a fresh backup from Magic and try again.");
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Export section */}
      <div className="bg-card-bg border border-border-light rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground tracking-tight mb-2">
          Export Data
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Download a complete local backup of every persisted Magic store, including add-ons and settings.
        </p>
        <Button variant="secondary" onClick={exportAllData}>
          <Download className="w-4 h-4 mr-1.5" />
          Export All Data (JSON)
        </Button>
      </div>

      {/* Import section */}
      <div className="bg-card-bg border border-border-light rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground tracking-tight mb-2">
          Import Data
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Restore data from a previously exported Magic backup file.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={onFileSelected}
          className="hidden"
        />
        <Button variant="secondary" onClick={handleImport}>
          <Upload className="w-4 h-4 mr-1.5" />
          Import from JSON
        </Button>
        {importStatus && (
          <p className="text-sm text-text-secondary mt-3">{importStatus}</p>
        )}
      </div>

      {/* Clear section */}
      <div className="bg-card-bg border border-red-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground tracking-tight mb-2">
          Clear All Data
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Permanently delete all data across every module. This cannot be undone.
          We recommend exporting your data first.
        </p>
        <Button variant="danger" onClick={() => setConfirmClear(true)}>
          <Trash2 className="w-4 h-4 mr-1.5" />
          Clear All Data
        </Button>
      </div>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={clearAllData}
        title="Clear All Data"
        message="This will permanently delete ALL data from every module, including clients, leads, jobs, invoices, payments, bookings, and activity history. This action cannot be undone."
        confirmLabel="Clear Everything"
        variant="danger"
      />
    </div>
  );
}
