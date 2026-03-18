"use client";

import { useState, useRef } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { useClientsStore } from "@/store/clients";
import { useLeadsStore } from "@/store/leads";
import { useJobsStore } from "@/store/jobs";
import { useInvoicesStore } from "@/store/invoices";
import { usePaymentsStore } from "@/store/payments";
import { useBookingsStore } from "@/store/bookings";
import { useActivityStore } from "@/store/activity";
import { useAutomationsStore } from "@/store/automations";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function DataManagement() {
  const [confirmClear, setConfirmClear] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clients = useClientsStore((s) => s.clients);
  const leads = useLeadsStore((s) => s.leads);
  const jobs = useJobsStore((s) => s.jobs);
  const invoices = useInvoicesStore((s) => s.invoices);
  const quotes = useInvoicesStore((s) => s.quotes);
  const payments = usePaymentsStore((s) => s.payments);
  const bookings = useBookingsStore((s) => s.bookings);
  const activities = useActivityStore((s) => s.entries);
  const automations = useAutomationsStore((s) => s.rules);

  const exportAllData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      clients,
      leads,
      jobs,
      invoices,
      quotes,
      payments,
      bookings,
      activities,
      automations,
    };

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
    // Clear all localStorage keys used by stores
    const storeKeys = [
      "magic-crm-clients",
      "magic-crm-leads",
      "magic-crm-jobs",
      "magic-crm-invoices",
      "magic-crm-payments",
      "magic-crm-bookings",
      "magic-crm-activity",
      "magic-crm-automations",
      "magic-crm-communication",
      "magic-crm-marketing",
      "magic-crm-support",
      "magic-crm-documents",
      "magic-crm-reminders",
      "magic-crm-goals",
    ];
    storeKeys.forEach((key) => localStorage.removeItem(key));

    // Reload to reset all Zustand stores
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
        JSON.parse(reader.result as string);
        setImportStatus(
          "File parsed successfully. Full import functionality coming soon."
        );
      } catch {
        setImportStatus("Invalid JSON file. Please check the file format.");
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Export section */}
      <div className="bg-card-bg border border-border-warm rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground tracking-tight mb-2">
          Export Data
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Download a complete backup of all your CRM data as a JSON file.
        </p>
        <Button variant="secondary" onClick={exportAllData}>
          <Download className="w-4 h-4 mr-1.5" />
          Export All Data (JSON)
        </Button>
      </div>

      {/* Import section */}
      <div className="bg-card-bg border border-border-warm rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground tracking-tight mb-2">
          Import Data
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Restore data from a previously exported JSON backup file.
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
