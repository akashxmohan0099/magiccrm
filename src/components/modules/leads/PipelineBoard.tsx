"use client";

import { useMemo } from "react";
import { UserCheck, DollarSign, Mail } from "lucide-react";
import { useLeadsStore } from "@/store/leads";
import { Lead, LeadStage } from "@/types/models";
import { KanbanBoard, KanbanColumn } from "@/components/ui/KanbanBoard";
import { Button } from "@/components/ui/Button";

interface PipelineBoardProps {
  leads?: Lead[];
}

const stageConfig: { id: LeadStage; label: string; color: string }[] = [
  { id: "new", label: "New", color: "bg-blue-500" },
  { id: "contacted", label: "Contacted", color: "bg-yellow-500" },
  { id: "qualified", label: "Qualified", color: "bg-purple-500" },
  { id: "proposal", label: "Proposal", color: "bg-orange-500" },
  { id: "won", label: "Won", color: "bg-green-500" },
  { id: "lost", label: "Lost", color: "bg-red-500" },
];

export function PipelineBoard({ leads: externalLeads }: PipelineBoardProps) {
  const store = useLeadsStore();
  const leads = externalLeads ?? store.leads;

  const columns: KanbanColumn<Lead>[] = useMemo(
    () =>
      stageConfig.map((stage) => ({
        id: stage.id,
        label: stage.label,
        color: stage.color,
        items: leads.filter((l) => l.stage === stage.id),
      })),
    [leads]
  );

  const handleMove = (leadId: string, toStage: string) => {
    store.moveLead(leadId, toStage as LeadStage);
  };

  const handleConvert = (leadId: string) => {
    store.convertToClient(leadId);
  };

  return (
    <KanbanBoard<Lead>
      columns={columns}
      keyExtractor={(lead) => lead.id}
      onMove={handleMove}
      renderCard={(lead) => (
        <div className="bg-card-bg rounded-lg border border-border-warm p-3 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-foreground truncate">
            {lead.name}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-text-secondary">
            <Mail className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
          {lead.value != null && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-text-secondary">
              <DollarSign className="w-3 h-3 flex-shrink-0" />
              <span>${lead.value.toLocaleString()}</span>
            </div>
          )}
          {lead.stage === "won" && !lead.clientId && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleConvert(lead.id);
              }}
            >
              <UserCheck className="w-3.5 h-3.5 mr-1" />
              Convert to Client
            </Button>
          )}
        </div>
      )}
    />
  );
}
