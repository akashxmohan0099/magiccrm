"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard, Plus, FileText, CheckCircle, Clock,
  AlertTriangle, XCircle,
} from "lucide-react";
import { usePaymentsStore } from "@/store/payments";
import { useClientsStore } from "@/store/clients";
import { useServicesStore } from "@/store/services";
import { PaymentDocument, PaymentDocStatus } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { DataTable, Column } from "@/components/ui/DataTable";
import { toast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useSettingsStore } from "@/store/settings";
import { PaymentDetail } from "./PaymentDetail";
import { CreatePaymentForm } from "./CreatePaymentForm";

const STATUS_FILTERS: { value: PaymentDocStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

export function PaymentsPage() {
  const { documents, lineItems, updateDocument, deleteDocument } = usePaymentsStore();
  const { clients } = useClientsStore();
  const { services } = useServicesStore();
  const { workspaceId } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const stripeConnected = useSettingsStore((s) => s.settings?.stripeOnboardingComplete ?? false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentDocStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const clearQueryParams = useCallback((keys: string[]) => {
    const next = new URLSearchParams(searchParams.toString());
    keys.forEach((key) => next.delete(key));
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "add" && !createOpen) {
      const timeout = window.setTimeout(() => {
        setCreateOpen(true);
      }, 0);
      clearQueryParams(["action"]);
      return () => window.clearTimeout(timeout);
    }

    const paymentId = searchParams.get("payment");
    if (
      paymentId &&
      paymentId !== "success" &&
      paymentId !== "cancelled" &&
      paymentId !== selectedId &&
      documents.some((doc) => doc.id === paymentId)
    ) {
      const timeout = window.setTimeout(() => {
        setSelectedId(paymentId);
      }, 0);
      clearQueryParams(["payment"]);
      return () => window.clearTimeout(timeout);
    }
  }, [clearQueryParams, createOpen, documents, searchParams, selectedId]);

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const filtered = useMemo(() => {
    let result = documents;
    if (statusFilter !== "all") result = result.filter((d) => d.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((d) => {
        const client = clientMap.get(d.clientId);
        return d.documentNumber.toLowerCase().includes(q) || (client?.name || "").toLowerCase().includes(q) || d.notes.toLowerCase().includes(q);
      });
    }
    return [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [documents, search, statusFilter, clientMap]);

  const selected = selectedId ? documents.find((d) => d.id === selectedId) ?? null : null;
  const selectedItems = selected ? lineItems[selected.id] || [] : [];

  const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const handleStatusChange = (docId: string, newStatus: PaymentDocStatus) => {
    const updates: Partial<PaymentDocument> = { status: newStatus };
    if (newStatus === "sent" && !documents.find((d) => d.id === docId)?.sentAt) {
      updates.sentAt = new Date().toISOString();
    }
    if (newStatus === "paid") {
      updates.paidAt = new Date().toISOString();
    }
    updateDocument(docId, updates, workspaceId || undefined);
  };

  const paymentColumns: Column<PaymentDocument>[] = [
    {
      key: "documentNumber",
      label: "Number",
      sortable: true,
      render: (d) => (
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-foreground">{d.documentNumber}</span>
          <span className="text-[10px] font-medium text-text-tertiary uppercase bg-surface px-1.5 py-0.5 rounded">{d.label}</span>
        </div>
      ),
    },
    {
      key: "clientId",
      label: "Client",
      sortable: true,
      render: (d) => <span className="text-[14px] text-foreground">{clientMap.get(d.clientId)?.name || "—"}</span>,
    },
    {
      key: "total",
      label: "Amount",
      sortable: true,
      render: (d) => <span className="text-[14px] font-bold text-foreground">${d.total.toLocaleString()}</span>,
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (d) => <span className="text-[14px] text-text-secondary">{fmtDate(d.createdAt)}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (d) => {
        const colors: Record<PaymentDocStatus, { dot: string; text: string }> = {
          draft: { dot: "bg-gray-400", text: "text-gray-600" },
          sent: { dot: "bg-blue-500", text: "text-blue-700" },
          paid: { dot: "bg-emerald-500", text: "text-emerald-700" },
          overdue: { dot: "bg-red-500", text: "text-red-700" },
          cancelled: { dot: "bg-gray-400", text: "text-gray-500" },
        };
        const c = colors[d.status];
        return (
          <div className="relative inline-flex items-center" onClick={(e) => e.stopPropagation()}>
            <span className={`w-2 h-2 rounded-full mr-1.5 flex-shrink-0 ${c.dot}`} />
            <select
              value={d.status}
              onChange={(e) => handleStatusChange(d.id, e.target.value as PaymentDocStatus)}
              className={`text-[12px] font-semibold ${c.text} bg-transparent border-none outline-none cursor-pointer appearance-none pr-4`}
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0 center" }}
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        );
      },
    },
  ];

  const totals = useMemo(() => ({
    paid: documents.filter((d) => d.status === "paid").reduce((s, d) => s + d.total, 0),
    outstanding: documents.filter((d) => d.status === "sent" || d.status === "overdue").reduce((s, d) => s + d.total, 0),
    overdue: documents.filter((d) => d.status === "overdue").reduce((s, d) => s + d.total, 0),
  }), [documents]);

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Quotes, invoices, and payment tracking."
        actions={
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Create Payment
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card-bg border border-border-light rounded-xl p-4">
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">Paid</p>
          <p className="text-xl font-bold text-emerald-600">${totals.paid.toLocaleString()}</p>
        </div>
        <div className="bg-card-bg border border-border-light rounded-xl p-4">
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">Outstanding</p>
          <p className="text-xl font-bold text-blue-600">${totals.outstanding.toLocaleString()}</p>
        </div>
        <div className="bg-card-bg border border-border-light rounded-xl p-4">
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">Overdue</p>
          <p className="text-xl font-bold text-red-600">${totals.overdue.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search payments..." />
        <div className="flex items-center bg-surface rounded-lg p-1 border border-border-light">
          {STATUS_FILTERS.map((opt) => (
            <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                statusFilter === opt.value ? "bg-card-bg text-foreground shadow-sm" : "text-text-secondary hover:text-foreground"
              }`}>{opt.label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-card-bg border border-border-light rounded-2xl p-12 text-center">
          <CreditCard className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-tertiary text-sm">{documents.length === 0 ? "No payment documents yet." : "No documents match your filters."}</p>
        </div>
      ) : (
        <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
          <DataTable<PaymentDocument>
            storageKey="magic-crm-payments-columns"
            columns={paymentColumns}
            data={filtered}
            keyExtractor={(d) => d.id}
            onRowClick={(d) => setSelectedId(d.id)}
          />
        </div>
      )}

      {/* Detail Sidebar */}
      <PaymentDetail
        doc={selected}
        items={selectedItems}
        clientName={selected ? clientMap.get(selected.clientId)?.name : undefined}
        onClose={() => setSelectedId(null)}
        onUpdate={(data) => { if (selected) updateDocument(selected.id, data, workspaceId || undefined); }}
        onDelete={() => { if (selected) { deleteDocument(selected.id, workspaceId || undefined); setSelectedId(null); } }}
        onViewClient={() => {
          if (!selected) return;
          setSelectedId(null);
          router.push(`/dashboard/clients?client=${selected.clientId}`);
          toast(`Viewing ${clientMap.get(selected.clientId)?.name}`);
        }}
        fmtDate={fmtDate}
        stripeConnected={stripeConnected}
      />

      {/* Create Form */}
      <CreatePaymentForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        clients={clients}
        services={services}
        onCreated={(id) => { setCreateOpen(false); setSelectedId(id); }}
      />
    </div>
  );
}
