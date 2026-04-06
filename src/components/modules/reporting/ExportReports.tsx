"use client";

import { Download } from "lucide-react";
import { useClientsStore } from "@/store/clients";
import { useInvoicesStore } from "@/store/invoices";
import { useLeadsStore } from "@/store/leads";
import { useJobsStore } from "@/store/jobs";
import { usePaymentsStore } from "@/store/payments";
import { useBookingsStore } from "@/store/bookings";
import { Button } from "@/components/ui/Button";

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toCSV(headers: string[], rows: string[][]): string {
  const escape = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ];
  return lines.join("\n");
}

export function ExportReports() {
  const { clients } = useClientsStore();
  const { invoices, quotes } = useInvoicesStore();
  const { leads } = useLeadsStore();
  const { jobs } = useJobsStore();
  const { payments } = usePaymentsStore();
  const { bookings } = useBookingsStore();

  const exportClientsCSV = () => {
    const headers = ["Name", "Email", "Phone", "Company", "Status", "Tags", "Created"];
    const rows = clients.map((c) => [
      c.name,
      c.email,
      c.phone,
      c.company ?? "",
      c.status,
      c.tags.join("; "),
      c.createdAt,
    ]);
    downloadFile("clients.csv", toCSV(headers, rows), "text/csv");
  };

  const exportInvoicesCSV = () => {
    const headers = ["Number", "Client ID", "Status", "Total", "Due Date", "Created"];
    const rows = invoices.map((inv) => {
      const total = (inv.lineItems ?? []).reduce(
        (sum, li) => sum + li.quantity * li.unitPrice,
        0
      );
      return [
        inv.number,
        inv.clientId ?? "",
        inv.status,
        total.toFixed(2),
        inv.dueDate ?? "",
        inv.createdAt,
      ];
    });
    downloadFile("invoices.csv", toCSV(headers, rows), "text/csv");
  };

  const exportAllJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      clients,
      leads,
      jobs,
      invoices,
      quotes,
      payments,
      bookings,
    };
    downloadFile(
      "magic-export.json",
      JSON.stringify(data, null, 2),
      "application/json"
    );
  };

  return (
    <div className="bg-card-bg border border-border-light rounded-xl p-6">
      <h2 className="text-lg font-semibold text-foreground tracking-tight mb-4">
        Export Reports
      </h2>
      <p className="text-sm text-text-secondary mb-5">
        Download your data for offline analysis or backup.
      </p>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={exportClientsCSV}>
          <Download className="w-4 h-4 mr-1.5" />
          Export Clients (CSV)
        </Button>
        <Button variant="secondary" onClick={exportInvoicesCSV}>
          <Download className="w-4 h-4 mr-1.5" />
          Export Invoices (CSV)
        </Button>
        <Button variant="secondary" onClick={exportAllJSON}>
          <Download className="w-4 h-4 mr-1.5" />
          Export All Data (JSON)
        </Button>
      </div>
    </div>
  );
}
