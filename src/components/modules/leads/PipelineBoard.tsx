"use client";

import { useMemo, useState } from "react";
import {
  UserCheck,
  DollarSign,
  Mail,
  ChevronDown,
  Flame,
  Clock,
  Inbox,
  Calendar,
  Receipt,
} from "lucide-react";
import { useLeadsStore } from "@/store/leads";
import { Lead } from "@/types/models";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import { useAuth } from "@/hooks/useAuth";
import { KanbanBoard, KanbanColumn } from "@/components/ui/KanbanBoard";
import { Button } from "@/components/ui/Button";
import { BookingForm } from "@/components/modules/bookings/BookingForm";
import { InvoiceForm } from "@/components/modules/invoicing/InvoiceForm";

interface PipelineBoardProps {
  leads?: Lead[];
  onCardClick?: (lead: Lead) => void;
}

/* ---------- helpers ---------- */

/** Compute how many days a lead has been in its current stage. */
function daysInStage(lead: Lead): number {
  const ref = lead.updatedAt || lead.createdAt;
  if (!ref) return 0;
  const diff = Date.now() - new Date(ref).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/** Derive a temperature badge from value + days-in-stage. */
function temperature(lead: Lead): "hot" | "warm" | "cold" {
  const days = daysInStage(lead);
  if ((lead.value ?? 0) >= 5000 || days <= 2) return "hot";
  if (days <= 7) return "warm";
  return "cold";
}

const tempColors: Record<string, string> = {
  hot: "bg-red-500/15 text-red-600",
  warm: "bg-amber-500/15 text-amber-600",
  cold: "bg-sky-500/15 text-sky-600",
};

const tempIcons: Record<string, typeof Flame> = {
  hot: Flame,
  warm: Clock,
  cold: Inbox,
};

/* ---------- sub-components ---------- */

function StageMoveDropdown({
  leadId,
  currentStage,
  stages,
  onMove,
}: {
  leadId: string;
  currentStage: string;
  stages: { id: string; label: string }[];
  onMove: (leadId: string, stage: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const others = stages.filter((s) => s.id !== currentStage);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-foreground transition-colors cursor-pointer"
      >
        Move
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 min-w-[140px] bg-card-bg border border-border-light rounded-lg shadow-lg py-1">
          {others.map((s) => (
            <button
              key={s.id}
              onClick={(e) => {
                e.stopPropagation();
                onMove(leadId, s.id);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-surface transition-colors cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TemperatureBadge({ temp }: { temp: "hot" | "warm" | "cold" }) {
  const Icon = tempIcons[temp];
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${tempColors[temp]}`}
    >
      <Icon className="w-2.5 h-2.5" />
      {temp}
    </span>
  );
}

/* ---------- main component ---------- */

export function PipelineBoard({ leads: externalLeads, onCardClick }: PipelineBoardProps) {
  const store = useLeadsStore();
  const config = useIndustryConfig();
  const { workspaceId } = useAuth();
  const leads = externalLeads ?? store.leads;

  // ── Lead action state ──
  const [bookingLeadId, setBookingLeadId] = useState<string | null>(null);
  const [invoiceLeadId, setInvoiceLeadId] = useState<string | null>(null);

  const bookingLead = bookingLeadId ? leads.find((l) => l.id === bookingLeadId) : null;
  const invoiceLead = invoiceLeadId ? leads.find((l) => l.id === invoiceLeadId) : null;

  // Convert lead to client first if needed, then open the form
  const handleConvertAndBook = (lead: Lead) => {
    if (!lead.clientId) {
      store.convertToClient(lead.id, workspaceId ?? undefined);
    }
    setBookingLeadId(lead.id);
  };

  const handleConvertAndInvoice = (lead: Lead) => {
    if (!lead.clientId) {
      store.convertToClient(lead.id, workspaceId ?? undefined);
    }
    setInvoiceLeadId(lead.id);
  };

  const columns: KanbanColumn<Lead>[] = useMemo(() => {
    const stageIds = new Set(config.leadStages.map((s) => s.id));
    const fallbackStageId =
      config.leadStages.find((s) => !s.isClosed)?.id ??
      config.leadStages[0]?.id;

    return config.leadStages.map((stage) => ({
      id: stage.id,
      label: stage.label,
      color: stage.color,
      items: leads.filter((l) => {
        if (l.stage === stage.id) return true;
        if (!stageIds.has(l.stage) && stage.id === fallbackStageId) return true;
        return false;
      }),
    }));
  }, [leads, config.leadStages]);

  /* Total pipeline value per column */
  const columnValues = useMemo(() => {
    const map: Record<string, number> = {};
    for (const col of columns) {
      map[col.id] = col.items.reduce((sum, l) => sum + (l.value ?? 0), 0);
    }
    return map;
  }, [columns]);

  const handleMove = (leadId: string, toStage: string) => {
    store.moveLead(leadId, toStage, workspaceId ?? undefined);
  };

  const handleConvert = (leadId: string) => {
    store.convertToClient(leadId, workspaceId ?? undefined);
  };

  const stagesMeta = config.leadStages.map((s) => ({
    id: s.id,
    label: s.label,
  }));

  return (
    <>
    <KanbanBoard<Lead>
      columns={columns}
      keyExtractor={(lead) => lead.id}
      onMove={handleMove}
      renderCard={(lead) => {
        const days = daysInStage(lead);
        const temp = temperature(lead);

        return (
          <div
            className="bg-card-bg rounded-lg border border-border-light p-3 shadow-sm hover:shadow-md transition-shadow space-y-2"
            onClick={() => onCardClick?.(lead)}
          >
            {/* Header row: name + temperature */}
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground truncate flex-1">
                {lead.name}
              </p>
              <TemperatureBadge temp={temp} />
            </div>

            {/* Email */}
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Mail className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>

            {/* Source + Value row */}
            <div className="flex items-center gap-3 text-xs text-text-secondary">
              {lead.source && (
                <span className="px-1.5 py-0.5 rounded bg-surface text-[10px] font-medium">
                  {lead.source}
                </span>
              )}
              {lead.value != null && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 flex-shrink-0" />
                  ${lead.value.toLocaleString()}
                </span>
              )}
            </div>

            {/* Days in stage + move dropdown */}
            <div className="flex items-center justify-between pt-1 border-t border-border-light/60">
              <span className="text-[10px] text-text-tertiary">
                {days === 0 ? "Today" : `${days}d in stage`}
              </span>
              <StageMoveDropdown
                leadId={lead.id}
                currentStage={lead.stage}
                stages={stagesMeta}
                onMove={handleMove}
              />
            </div>

            {/* Lead actions */}
            <div className="flex gap-1.5 pt-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleConvertAndBook(lead); }}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-semibold bg-foreground text-background rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              >
                <Calendar className="w-3 h-3" />
                Book
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleConvertAndInvoice(lead); }}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-semibold bg-surface border border-border-light text-foreground rounded-lg cursor-pointer hover:bg-card-bg transition-colors"
              >
                <Receipt className="w-3 h-3" />
                Quote
              </button>
            </div>

            {/* Convert button for won leads */}
            {lead.stage === "won" && !lead.clientId && (
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConvert(lead.id);
                }}
                className="w-full mt-1"
              >
                <UserCheck className="w-3.5 h-3.5 mr-1" />
                Convert to Client
              </Button>
            )}
          </div>
        );
      }}
      renderColumnHeader={(col) => (
        <div>
          <div className="flex items-center gap-2 px-1">
            <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
            <span className="text-sm font-semibold text-foreground tracking-tight">
              {col.label}
            </span>
            <span className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full bg-background text-[11px] font-semibold text-text-secondary">
              {col.items.length}
            </span>
          </div>
          {columnValues[col.id] > 0 && (
            <p className="text-[10px] text-text-tertiary mt-1 px-1">
              ${columnValues[col.id].toLocaleString()} total
            </p>
          )}
        </div>
      )}
      renderEmpty={() => (
        <div className="flex flex-col items-center justify-center py-6 text-text-tertiary">
          <Inbox className="w-5 h-5 mb-1.5 opacity-50" />
          <span className="text-[11px]">No leads</span>
        </div>
      )}
    />

      {/* Inline booking form — pre-filled from lead */}
      {bookingLead && (
        <BookingForm
          open={!!bookingLeadId}
          onClose={() => setBookingLeadId(null)}
          defaultDate={new Date().toISOString().split("T")[0]}
          prefill={{
            title: bookingLead.name,
            clientId: bookingLead.clientId ?? "",
          }}
        />
      )}

      {/* Inline invoice form — pre-filled from lead */}
      {invoiceLead && (
        <InvoiceForm
          open={!!invoiceLeadId}
          onClose={() => setInvoiceLeadId(null)}
          prefill={{
            clientId: invoiceLead.clientId ?? "",
          }}
        />
      )}
    </>
  );
}
