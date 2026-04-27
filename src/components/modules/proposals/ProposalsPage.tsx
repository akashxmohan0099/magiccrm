"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  ScrollText,
  DollarSign,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Trash2,
} from "lucide-react";
import { useProposalsStore } from "@/store/proposals";
import { useClientsStore } from "@/store/clients";
import type { ProposalSection } from "@/types/models";
import { generateId } from "@/lib/id";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SlideOver } from "@/components/ui/SlideOver";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toast";

const SECTION_TYPES: ProposalSection["type"][] = [
  "cover", "text", "services", "timeline", "gallery", "terms", "payment",
];

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function ProposalsPage() {
  const { proposals, addProposal, updateProposal, deleteProposal } = useProposalsStore();
  const { clients } = useClientsStore();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "sections" | "actions">("overview");

  // Create form
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [total, setTotal] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [sections, setSections] = useState<{ type: ProposalSection["type"]; content: string }[]>([]);

  const filtered = useMemo(() => {
    if (!search.trim()) return proposals;
    const q = search.toLowerCase();
    return proposals.filter(
      (p) => p.title.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q)
    );
  }, [proposals, search]);

  const detail = detailId ? proposals.find((p) => p.id === detailId) : null;

  const accepted = proposals.filter((p) => p.status === "accepted").length;
  const pending = proposals.filter((p) => p.status === "sent" || p.status === "viewed").length;
  const totalValue = proposals.reduce((s, p) => s + p.total, 0);

  const resetForm = () => {
    setTitle(""); setClientId(""); setTotal(""); setValidUntil(""); setNotes("");
    setSections([]);
  };

  const handleCreate = () => {
    if (!title.trim()) { toast("Title is required", "error"); return; }
    const client = clients.find((c) => c.id === clientId);
    addProposal({
      workspaceId: "",
      title: title.trim(),
      clientId: clientId || undefined,
      clientName: client?.name || "---",
      status: "draft",
      sections: sections.map((s, i) => ({
        id: generateId(), type: s.type, content: s.content, sortOrder: i,
      })),
      total: Number(total) || 0,
      validUntil: validUntil || undefined,
      notes: notes.trim(),
    });
    setCreateOpen(false);
    resetForm();
  };

  const copyShareLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/p/${token}`);
    toast("Share link copied");
  };

  return (
    <div>
      <PageHeader
        title="Proposals"
        description="Create and send service proposals to clients."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Create Proposal
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <SummaryCard icon={<ScrollText className="w-5 h-5" />} label="Total" value={String(proposals.length)} color="text-blue-500" />
        <SummaryCard icon={<CheckCircle2 className="w-5 h-5" />} label="Accepted" value={String(accepted)} color="text-emerald-500" />
        <SummaryCard icon={<Clock className="w-5 h-5" />} label="Pending" value={String(pending)} color="text-amber-500" />
        <SummaryCard icon={<DollarSign className="w-5 h-5" />} label="Total Value" value={formatCurrency(totalValue)} color="text-violet-500" />
      </div>

      {/* Search */}
      {proposals.length > 0 && (
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search proposals..." />
        </div>
      )}

      {/* List */}
      {proposals.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="w-6 h-6" />}
          title="No proposals yet"
          description="Create your first proposal to get started."
          actionLabel="Create Proposal"
          onAction={() => setCreateOpen(true)}
        />
      ) : filtered.length === 0 ? (
        <div className="bg-card-bg border border-border-light rounded-2xl p-12 text-center">
          <p className="text-[14px] text-text-tertiary">No proposals match your search.</p>
        </div>
      ) : (
        <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
          <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_100px_100px_120px] gap-4 px-5 py-3 border-b border-border-light bg-surface/50">
            <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Title</span>
            <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Client</span>
            <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Total</span>
            <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Status</span>
            <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Date</span>
          </div>
          <div className="divide-y divide-border-light">
            {filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => { setDetailId(p.id); setActiveTab("overview"); }}
                className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px_100px_120px] gap-2 sm:gap-4 px-5 py-4 hover:bg-surface/30 transition-colors cursor-pointer"
              >
                <span className="text-[14px] font-medium text-foreground truncate">{p.title}</span>
                <span className="text-[13px] text-text-secondary truncate">{p.clientName}</span>
                <span className="text-[13px] font-medium text-foreground">{formatCurrency(p.total)}</span>
                <div><StatusBadge status={p.status} /></div>
                <span className="text-[12px] text-text-tertiary">{formatDate(p.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create SlideOver */}
      <SlideOver open={createOpen} onClose={() => { setCreateOpen(false); resetForm(); }} title="Create Proposal">
        <div className="space-y-5">
          <Field label="Title" required>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Wedding Glam Package"
              className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10" />
          </Field>

          <Field label="Client">
            <select value={clientId} onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10">
              <option value="">Select client...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Total ($)">
              <input type="number" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="0.00" min={0}
                className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10" />
            </Field>
            <Field label="Valid Until">
              <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10" />
            </Field>
          </div>

          {/* Sections */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-medium text-foreground">Sections</label>
              <button onClick={() => setSections([...sections, { type: "text", content: "" }])}
                className="text-[12px] font-medium text-text-secondary hover:text-foreground cursor-pointer">
                + Add Section
              </button>
            </div>
            {sections.map((sec, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select value={sec.type} onChange={(e) => {
                  const next = [...sections]; next[i] = { ...sec, type: e.target.value as ProposalSection["type"] }; setSections(next);
                }} className="px-2 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground outline-none w-28">
                  {SECTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input value={sec.content} onChange={(e) => {
                  const next = [...sections]; next[i] = { ...sec, content: e.target.value }; setSections(next);
                }} placeholder="Section content..." className="flex-1 px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10" />
                <button onClick={() => setSections(sections.filter((_, j) => j !== i))}
                  className="p-2 text-text-tertiary hover:text-red-500 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          <Field label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Internal notes..."
              className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10 resize-none" />
          </Field>

          <div className="flex justify-end gap-2 pt-4 border-t border-border-light">
            <Button variant="ghost" onClick={() => { setCreateOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-1.5" /> Create</Button>
          </div>
        </div>
      </SlideOver>

      {/* Detail SlideOver */}
      <SlideOver open={!!detail} onClose={() => setDetailId(null)} title={detail?.title || "Proposal"}>
        {detail && (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-1 border-b border-border-light pb-0">
              {(["overview", "sections", "actions"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-[13px] font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
                    activeTab === tab ? "border-foreground text-foreground" : "border-transparent text-text-secondary hover:text-foreground"
                  }`}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div className="space-y-3">
                <DetailRow label="Title" value={detail.title} />
                <DetailRow label="Client" value={detail.clientName} />
                <DetailRow label="Total" value={formatCurrency(detail.total)} />
                <DetailRow label="Status" value={detail.status} />
                <DetailRow label="Created" value={formatDate(detail.createdAt)} />
                {detail.validUntil && <DetailRow label="Valid Until" value={formatDate(detail.validUntil)} />}
                {detail.sentAt && <DetailRow label="Sent" value={formatDate(detail.sentAt)} />}
                {detail.viewedAt && <DetailRow label="Viewed" value={formatDate(detail.viewedAt)} />}
                {detail.acceptedAt && <DetailRow label="Accepted" value={formatDate(detail.acceptedAt)} />}
                <DetailRow label="Views" value={String(detail.viewCount)} />
                {detail.notes && (
                  <div className="pt-3 border-t border-border-light">
                    <p className="text-[12px] font-medium text-text-tertiary mb-1">Notes</p>
                    <p className="text-[13px] text-foreground">{detail.notes}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "sections" && (
              <div className="space-y-3">
                {detail.sections.length === 0 ? (
                  <p className="text-[13px] text-text-tertiary text-center py-8">No sections added.</p>
                ) : (
                  detail.sections.map((sec) => (
                    <div key={sec.id} className="bg-surface rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <StatusBadge status={sec.type} />
                        {sec.title && <span className="text-[13px] font-medium text-foreground">{sec.title}</span>}
                      </div>
                      {sec.content && <p className="text-[13px] text-text-secondary">{sec.content}</p>}
                      {sec.items && sec.items.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {sec.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-[12px]">
                              <span className="text-text-secondary">{item.description}</span>
                              <span className="text-foreground font-medium">{formatCurrency(item.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "actions" && (
              <div className="space-y-3">
                <Button variant="secondary" className="w-full justify-start" onClick={() => {
                  updateProposal(detail.id, { status: "sent", sentAt: new Date().toISOString() });
                  toast("Proposal marked as sent");
                }}>
                  <Send className="w-4 h-4 mr-2" /> Mark as Sent
                </Button>
                <Button variant="secondary" className="w-full justify-start" onClick={() => {
                  updateProposal(detail.id, { status: "viewed", viewedAt: new Date().toISOString(), viewCount: detail.viewCount + 1 });
                  toast("Proposal marked as viewed");
                }}>
                  <Eye className="w-4 h-4 mr-2" /> Mark as Viewed
                </Button>
                <Button variant="secondary" className="w-full justify-start" onClick={() => {
                  updateProposal(detail.id, { status: "accepted", acceptedAt: new Date().toISOString() });
                  toast("Proposal accepted");
                }}>
                  <ThumbsUp className="w-4 h-4 mr-2" /> Mark as Accepted
                </Button>
                <Button variant="secondary" className="w-full justify-start" onClick={() => {
                  updateProposal(detail.id, { status: "declined" });
                  toast("Proposal declined");
                }}>
                  <ThumbsDown className="w-4 h-4 mr-2" /> Mark as Declined
                </Button>
                <Button variant="secondary" className="w-full justify-start" onClick={() => copyShareLink(detail.shareToken)}>
                  <Copy className="w-4 h-4 mr-2" /> Copy Share Link
                </Button>
                <div className="pt-3 border-t border-border-light">
                  <Button variant="danger" className="w-full justify-start" onClick={() => {
                    deleteProposal(detail.id); setDetailId(null);
                  }}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Proposal
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </SlideOver>
    </div>
  );
}

// ── Helpers ──

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-card-bg border border-border-light rounded-xl p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-surface flex items-center justify-center ${color}`}>{icon}</div>
        <div>
          <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[12px] font-medium text-text-tertiary">{label}</span>
      <span className="text-[13px] font-medium text-foreground">{value}</span>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-foreground mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
