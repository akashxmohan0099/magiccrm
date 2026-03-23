"use client";

import { useState } from "react";
import {
  Pencil,
  Trash2,
  Send,
  Link2,
  ArrowRightCircle,
  FileText,
  Copy,
  Check,
  Eye,
  Clock,
  DollarSign,
  CalendarClock,
  AlertTriangle,
  LayoutTemplate,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useProposalsStore } from "@/store/proposals";
import { useClientsStore } from "@/store/clients";
import { useOnboardingStore } from "@/store/onboarding";
import { useAuth } from "@/hooks/useAuth";
import { Proposal, ProposalStatus } from "@/types/models";
import { buildPublicProposalUrl } from "@/lib/proposal-share";
import { SlideOver } from "@/components/ui/SlideOver";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";

// ── Status timeline config ──

const STATUS_STEPS: { key: ProposalStatus; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "viewed", label: "Viewed" },
  { key: "accepted", label: "Accepted" },
];

function getStatusIndex(status: ProposalStatus): number {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

function getStatusDate(proposal: Proposal, stepKey: ProposalStatus): string | null {
  switch (stepKey) {
    case "draft":
      return proposal.createdAt;
    case "sent":
      // If status is sent or beyond, use updatedAt as approximation
      if (getStatusIndex(proposal.status) >= 1) return proposal.updatedAt;
      return null;
    case "viewed":
      if (proposal.lastViewedAt) return proposal.lastViewedAt;
      return null;
    case "accepted":
      if (proposal.signature?.signedAt) return proposal.signature.signedAt;
      return null;
    default:
      return null;
  }
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Component ──

interface ProposalDetailProps {
  open: boolean;
  onClose: () => void;
  proposalId: string | null;
  onEdit?: (proposal: Proposal) => void;
}

export function ProposalDetail({ open, onClose, proposalId, onEdit }: ProposalDetailProps) {
  const {
    proposals,
    updateProposal,
    deleteProposal,
    generateShareToken,
    addTemplate,
    convertToInvoice,
    convertToQuote,
  } = useProposalsStore();
  const { clients } = useClientsStore();
  const businessName = useOnboardingStore((s) => s.businessContext.businessName);
  const { workspaceId } = useAuth();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);

  const proposal = proposals.find((p) => p.id === proposalId);

  if (!proposal) {
    return (
      <SlideOver open={open} onClose={onClose} title="Proposal">
        <p className="text-sm text-text-secondary">Proposal not found.</p>
      </SlideOver>
    );
  }

  const client = clients.find((c) => c.id === proposal.clientId);
  const currentStatusIndex = getStatusIndex(proposal.status);
  const isDeclinedOrExpired = proposal.status === "declined" || proposal.status === "expired";

  // ── Pricing total ──
  const getPricingTotal = (lineItems: { quantity: number; unitPrice: number }[]) =>
    lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);

  const totalValue = proposal.sections
    .filter((s) => s.type === "pricing-table" || s.type === "services")
    .reduce((sum, s) => sum + getPricingTotal(s.lineItems ?? []), 0);

  // ── Valid until warning ──
  const isExpiringSoon = (() => {
    if (!proposal.validUntil) return false;
    const validDate = new Date(proposal.validUntil);
    const now = new Date();
    const daysLeft = Math.ceil((validDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft >= 0 && daysLeft <= 7;
  })();

  const isExpired = (() => {
    if (!proposal.validUntil) return false;
    return new Date(proposal.validUntil) < new Date();
  })();

  // ── Handlers ──

  const handleMarkAsSent = () => {
    updateProposal(proposal.id, { status: "sent" }, workspaceId ?? undefined);
  };

  const handleCopyLink = async () => {
    let token = proposal.shareToken;
    if (!token || token.length < 16) {
      token = generateShareToken(proposal.id, workspaceId ?? undefined);
    }
    try {
      const url = buildPublicProposalUrl({
        origin: window.location.origin,
        token,
        proposal: workspaceId
          ? undefined
          : {
              ...proposal,
              shareToken: token,
            },
        businessName: workspaceId ? undefined : businessName,
      });
      await navigator.clipboard.writeText(url);
      toast(workspaceId ? "Proposal link copied to clipboard" : "Portable proposal link copied to clipboard");
    } catch {
      toast("Failed to copy link", "error");
    }
  };

  const handleConvertToInvoice = () => {
    convertToInvoice(proposal.id, workspaceId ?? undefined);
  };

  const handleConvertToQuote = () => {
    convertToQuote(proposal.id, workspaceId ?? undefined);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast("Template name is required", "error");
      return;
    }
    addTemplate({
      name: templateName.trim(),
      description: templateDescription.trim(),
      sections: proposal.sections,
      isDefault: false,
    }, workspaceId ?? undefined);
    toast("Template saved");
    setShowTemplateForm(false);
    setTemplateName("");
    setTemplateDescription("");
  };

  const handleOpenTemplateForm = () => {
    setTemplateName(proposal.title + " Template");
    setTemplateDescription("");
    setShowTemplateForm(true);
  };

  const handleDelete = () => {
    deleteProposal(proposal.id, workspaceId ?? undefined);
    onClose();
  };

  return (
    <>
      <SlideOver open={open} onClose={onClose} title={`Proposal ${proposal.number}`} wide>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{proposal.title}</h3>
              <p className="text-sm text-text-secondary mt-0.5">
                {client?.name ?? proposal.clientName ?? "\u2014"}
              </p>
            </div>
            <StatusBadge status={proposal.status} />
          </div>

          {/* ── Status Timeline ── */}
          {!isDeclinedOrExpired && (
            <div className="bg-surface/50 rounded-xl border border-border-light px-6 py-4">
              <div className="flex items-center justify-between">
                {STATUS_STEPS.map((step, i) => {
                  const isCompleted = i <= currentStatusIndex;
                  const isCurrent = i === currentStatusIndex;
                  const dateStr = getStatusDate(proposal, step.key);

                  return (
                    <div key={step.key} className="flex items-center flex-1 last:flex-initial">
                      {/* Step node */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                            isCompleted
                              ? isCurrent
                                ? "bg-primary border-primary text-white"
                                : "bg-primary/10 border-primary text-primary"
                              : "bg-surface border-border-light text-text-tertiary"
                          }`}
                        >
                          {isCompleted && !isCurrent ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <div
                              className={`w-2 h-2 rounded-full ${
                                isCompleted ? "bg-white" : "bg-border-light"
                              }`}
                            />
                          )}
                        </div>
                        <span
                          className={`text-[11px] font-medium mt-1.5 ${
                            isCompleted ? "text-foreground" : "text-text-tertiary"
                          }`}
                        >
                          {step.label}
                        </span>
                        {dateStr && isCompleted && (
                          <span className="text-[10px] text-text-tertiary mt-0.5">
                            {formatShortDate(dateStr)}
                          </span>
                        )}
                      </div>
                      {/* Connecting line */}
                      {i < STATUS_STEPS.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-2 mt-[-1.5rem] ${
                            i < currentStatusIndex ? "bg-primary" : "bg-border-light"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Declined / expired notice */}
          {isDeclinedOrExpired && (
            <div className="bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800/30 px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700 dark:text-red-400">
                This proposal has been {proposal.status}.
              </span>
            </div>
          )}

          {/* ── Key Metrics Row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-surface/50 rounded-lg border border-border-light px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Eye className="w-3.5 h-3.5 text-text-tertiary" />
                <span className="text-[11px] text-text-tertiary font-medium">Views</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{proposal.viewCount}</p>
            </div>
            <div className="bg-surface/50 rounded-lg border border-border-light px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                <span className="text-[11px] text-text-tertiary font-medium">Last Viewed</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {proposal.lastViewedAt ? formatShortDate(proposal.lastViewedAt) : "\u2014"}
              </p>
            </div>
            <div className="bg-surface/50 rounded-lg border border-border-light px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-text-tertiary" />
                <span className="text-[11px] text-text-tertiary font-medium">Total Value</span>
              </div>
              <p className="text-sm font-semibold text-foreground">${totalValue.toFixed(2)}</p>
            </div>
            <div className="bg-surface/50 rounded-lg border border-border-light px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <CalendarClock className="w-3.5 h-3.5 text-text-tertiary" />
                <span className="text-[11px] text-text-tertiary font-medium">Valid Until</span>
              </div>
              <div className="flex items-center gap-1">
                <p
                  className={`text-sm font-semibold ${
                    isExpired
                      ? "text-red-500"
                      : isExpiringSoon
                      ? "text-amber-500"
                      : "text-foreground"
                  }`}
                >
                  {proposal.validUntil
                    ? new Date(proposal.validUntil).toLocaleDateString()
                    : "\u2014"}
                </p>
                {isExpiringSoon && !isExpired && (
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                )}
                {isExpired && <AlertTriangle className="w-3 h-3 text-red-500" />}
              </div>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-surface/30 rounded-xl border border-border-light">
            <div className="flex flex-col gap-1">
              <Button variant="secondary" size="sm" onClick={handleCopyLink}>
                <Link2 className="w-4 h-4" /> Copy Link
              </Button>
              <span className="text-[10px] text-text-tertiary leading-tight px-1">
                Link opens anywhere. View and signature syncing still stay local until cloud sync is connected.
              </span>
            </div>
            {proposal.status === "draft" && (
              <Button variant="primary" size="sm" onClick={handleMarkAsSent}>
                <Send className="w-4 h-4" /> Mark as Sent
              </Button>
            )}
            {!proposal.convertedToInvoiceId && (
              <Button variant="secondary" size="sm" onClick={handleConvertToInvoice}>
                <ArrowRightCircle className="w-4 h-4" /> Convert to Invoice
              </Button>
            )}
            {!proposal.convertedToQuoteId && (
              <Button variant="secondary" size="sm" onClick={handleConvertToQuote}>
                <FileText className="w-4 h-4" /> Convert to Quote
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={handleOpenTemplateForm}>
              <LayoutTemplate className="w-4 h-4" /> Save as Template
            </Button>
            {onEdit && (
              <Button variant="secondary" size="sm" onClick={() => onEdit(proposal)}>
                <Pencil className="w-4 h-4" /> Edit
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>

          {/* ── Save as Template Inline Form ── */}
          {showTemplateForm && (
            <div className="bg-surface/50 rounded-xl border border-primary/20 p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">Save as Template</p>
              <div>
                <label className="text-[12px] text-text-secondary font-medium mb-1 block">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Web Design Proposal Template"
                  className="w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[12px] text-text-secondary font-medium mb-1 block">
                  Description
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Brief description of this template..."
                  rows={2}
                  className="w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-none"
                />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowTemplateForm(false);
                    setTemplateName("");
                    setTemplateDescription("");
                  }}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveTemplate}>
                  <Check className="w-4 h-4" /> Save Template
                </Button>
              </div>
            </div>
          )}

          {/* ── Section Preview ── */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Sections</p>
            <div className="space-y-4">
              {proposal.sections.length === 0 && (
                <p className="text-sm text-text-tertiary italic">No sections in this proposal.</p>
              )}
              {proposal.sections
                .sort((a, b) => a.order - b.order)
                .map((section) => {
                  switch (section.type) {
                    case "text":
                      return (
                        <div key={section.id}>
                          {section.title && (
                            <p className="text-sm font-semibold text-foreground mb-1">{section.title}</p>
                          )}
                          <p className="text-sm text-text-secondary whitespace-pre-wrap">
                            {section.content || "\u2014"}
                          </p>
                        </div>
                      );

                    case "pricing-table":
                    case "services":
                      return (
                        <div key={section.id}>
                          {section.title && (
                            <p className="text-sm font-semibold text-foreground mb-2">{section.title}</p>
                          )}
                          {section.interactive && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-2">
                              <Check className="w-3 h-3" /> Interactive pricing
                            </span>
                          )}
                          <div className="bg-surface rounded-lg border border-border-light overflow-hidden">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-border-light">
                                  <th className="text-left text-xs font-medium text-text-secondary px-4 py-2">Description</th>
                                  <th className="text-center text-xs font-medium text-text-secondary px-4 py-2">Qty</th>
                                  <th className="text-right text-xs font-medium text-text-secondary px-4 py-2">Price</th>
                                  <th className="text-right text-xs font-medium text-text-secondary px-4 py-2">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(section.lineItems ?? []).map((li) => (
                                  <tr key={li.id} className="border-b border-border-light last:border-b-0">
                                    <td className="px-4 py-2 text-sm text-foreground">{li.description || "\u2014"}</td>
                                    <td className="px-4 py-2 text-sm text-foreground text-center">{li.quantity}</td>
                                    <td className="px-4 py-2 text-sm text-foreground text-right">${li.unitPrice.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-sm font-medium text-foreground text-right">
                                      ${(li.quantity * li.unitPrice).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {section.lineItems && section.lineItems.length > 0 && (
                            <div className="flex justify-end mt-2">
                              <span className="text-sm font-semibold text-foreground">
                                Subtotal: ${getPricingTotal(section.lineItems).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      );

                    case "terms":
                      return (
                        <div key={section.id}>
                          {section.title && (
                            <p className="text-sm font-semibold text-foreground mb-1">{section.title}</p>
                          )}
                          <div className="px-4 py-3 bg-surface/50 rounded-lg border border-border-light">
                            <p className="text-sm text-text-secondary whitespace-pre-wrap">
                              {section.content || "\u2014"}
                            </p>
                          </div>
                        </div>
                      );

                    case "signature":
                      return null; // Rendered separately below

                    case "divider":
                      return <hr key={section.id} className="border-border-light" />;

                    default:
                      return (
                        <div key={section.id}>
                          {section.title && (
                            <p className="text-sm font-semibold text-foreground mb-1">{section.title}</p>
                          )}
                          <p className="text-sm text-text-secondary whitespace-pre-wrap">
                            {section.content || "\u2014"}
                          </p>
                        </div>
                      );
                  }
                })}
            </div>
          </div>

          {/* ── Signature Section ── */}
          {proposal.sections.some((s) => s.type === "signature") && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Signature</p>
              {proposal.signature ? (
                <div className="px-4 py-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      Signed by {proposal.signature.signedBy}
                    </span>
                  </div>
                  {proposal.signature.signatureDataUrl && (
                    <img
                      src={proposal.signature.signatureDataUrl}
                      alt="Client signature"
                      className="max-h-20 mb-2"
                    />
                  )}
                  <p className="text-xs text-text-tertiary">
                    Signed on {new Date(proposal.signature.signedAt).toLocaleDateString()} at{" "}
                    {new Date(proposal.signature.signedAt).toLocaleTimeString()}
                  </p>
                </div>
              ) : (
                <div className="px-4 py-3 bg-surface/30 rounded-lg border border-dashed border-border-light flex items-center gap-2">
                  <Clock className="w-4 h-4 text-text-tertiary" />
                  <p className="text-sm text-text-tertiary italic">Awaiting signature</p>
                </div>
              )}
            </div>
          )}

          {/* ── Notes ── */}
          {proposal.notes && (
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Notes</p>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{proposal.notes}</p>
            </div>
          )}

          {/* ── Version History ── */}
          {proposal.previousVersions && proposal.previousVersions.length > 0 && (
            <div className="border border-border-light rounded-xl overflow-hidden">
              <button
                onClick={() => setVersionHistoryOpen(!versionHistoryOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-surface/30 hover:bg-surface/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Copy className="w-4 h-4 text-text-secondary" />
                  <span className="text-sm font-medium text-foreground">
                    Version History
                  </span>
                  <span className="text-[11px] text-text-tertiary bg-surface px-2 py-0.5 rounded-full">
                    {proposal.previousVersions.length} version{proposal.previousVersions.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {versionHistoryOpen ? (
                  <ChevronDown className="w-4 h-4 text-text-secondary" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-text-secondary" />
                )}
              </button>
              {versionHistoryOpen && (
                <div className="border-t border-border-light divide-y divide-border-light">
                  {[...proposal.previousVersions]
                    .sort((a, b) => b.version - a.version)
                    .map((ver) => (
                      <div key={ver.version} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Version {ver.version}
                          </p>
                          {ver.notes && (
                            <p className="text-xs text-text-tertiary mt-0.5">{ver.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-text-secondary">
                            {new Date(ver.savedAt).toLocaleDateString()}
                          </p>
                          <p className="text-[10px] text-text-tertiary">
                            {new Date(ver.savedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  {/* Current version */}
                  <div className="px-4 py-3 flex items-center justify-between bg-primary/5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        Version {proposal.version}
                      </p>
                      <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        Current
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">
                      {new Date(proposal.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SlideOver>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Proposal"
        message={`Are you sure you want to delete proposal ${proposal.number}? This action cannot be undone.`}
      />
    </>
  );
}
