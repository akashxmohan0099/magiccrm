"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  FileSignature,
  FileText,
  Send,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Award,
} from "lucide-react";
import { useDocumentsStore } from "@/store/documents";
import { useClientsStore } from "@/store/clients";
import type { DocumentTemplate, SentDocument, DocumentField } from "@/types/models";
import { generateId } from "@/lib/id";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SlideOver } from "@/components/ui/SlideOver";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toast";

const FIELD_TYPES: DocumentField["type"][] = ["text", "checkbox", "signature", "date"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function DocumentsPage() {
  const { templates, sentDocuments, addTemplate, deleteTemplate, sendDocument, updateSentDocument } = useDocumentsStore();
  const { clients } = useClientsStore();

  const [tab, setTab] = useState<"templates" | "sent">("templates");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [detailDocId, setDetailDocId] = useState<string | null>(null);

  // Create template form
  const [tplName, setTplName] = useState("");
  const [tplDesc, setTplDesc] = useState("");
  const [tplContent, setTplContent] = useState("");
  const [tplFields, setTplFields] = useState<{ type: DocumentField["type"]; label: string; required: boolean }[]>([]);

  // Send form
  const [sendTemplateId, setSendTemplateId] = useState("");
  const [sendClientId, setSendClientId] = useState("");

  const filteredTemplates = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }, [templates, search]);

  const filteredSent = useMemo(() => {
    if (!search.trim()) return sentDocuments;
    const q = search.toLowerCase();
    return sentDocuments.filter(
      (d) => d.clientName.toLowerCase().includes(q) || d.templateName.toLowerCase().includes(q)
    );
  }, [sentDocuments, search]);

  const detailDoc = detailDocId ? sentDocuments.find((d) => d.id === detailDocId) : null;

  const resetForm = () => {
    setTplName(""); setTplDesc(""); setTplContent(""); setTplFields([]);
  };

  const handleCreateTemplate = () => {
    if (!tplName.trim()) { toast("Template name is required", "error"); return; }
    addTemplate({
      workspaceId: "",
      name: tplName.trim(),
      description: tplDesc.trim(),
      content: tplContent.trim(),
      fields: tplFields.map((f) => ({ id: generateId(), type: f.type, label: f.label, required: f.required })),
      isDefault: false,
    });
    setCreateOpen(false);
    resetForm();
  };

  const handleSendDocument = () => {
    if (!sendTemplateId) { toast("Select a template", "error"); return; }
    if (!sendClientId) { toast("Select a client", "error"); return; }
    const client = clients.find((c) => c.id === sendClientId);
    sendDocument(sendTemplateId, sendClientId, client?.name || "---");
    setSendOpen(false);
    setSendTemplateId(""); setSendClientId("");
    setTab("sent");
  };

  const addField = () => {
    setTplFields([...tplFields, { type: "text", label: "", required: false }]);
  };

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Store and manage client documents and agreements."
        actions={
          <div className="flex gap-2">
            {tab === "templates" ? (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Create Template
              </Button>
            ) : (
              <Button size="sm" onClick={() => setSendOpen(true)}>
                <Send className="w-4 h-4 mr-1.5" /> Send Document
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-border-light">
        {(["templates", "sent"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setSearch(""); }}
            className={`px-4 py-2.5 text-[13px] font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
              tab === t ? "border-foreground text-foreground" : "border-transparent text-text-secondary hover:text-foreground"
            }`}>
            {t === "templates" ? "Templates" : "Sent"}
          </button>
        ))}
      </div>

      {/* Search */}
      {(tab === "templates" ? templates.length : sentDocuments.length) > 0 && (
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder={tab === "templates" ? "Search templates..." : "Search sent documents..."} />
        </div>
      )}

      {/* Templates Tab */}
      {tab === "templates" && (
        templates.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-6 h-6" />}
            title="No templates yet"
            description="Create a document template to get started."
            actionLabel="Create Template"
            onAction={() => setCreateOpen(true)}
          />
        ) : filteredTemplates.length === 0 ? (
          <div className="bg-card-bg border border-border-light rounded-2xl p-12 text-center">
            <p className="text-[14px] text-text-tertiary">No templates match your search.</p>
          </div>
        ) : (
          <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
            <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_100px_80px_80px] gap-4 px-5 py-3 border-b border-border-light bg-surface/50">
              <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Name</span>
              <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Description</span>
              <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Fields</span>
              <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Default</span>
              <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Actions</span>
            </div>
            <div className="divide-y divide-border-light">
              {filteredTemplates.map((tpl) => (
                <div key={tpl.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px_80px_80px] gap-2 sm:gap-4 px-5 py-4 hover:bg-surface/30 transition-colors">
                  <span className="text-[14px] font-medium text-foreground truncate">{tpl.name}</span>
                  <span className="text-[13px] text-text-secondary truncate">{tpl.description || "---"}</span>
                  <span className="text-[13px] text-foreground">{tpl.fields.length} field{tpl.fields.length !== 1 ? "s" : ""}</span>
                  <div>{tpl.isDefault && <StatusBadge status="active" />}</div>
                  <div className="flex gap-1">
                    <button onClick={() => {
                      setSendTemplateId(tpl.id); setSendOpen(true);
                    }} className="p-1.5 text-text-tertiary hover:text-foreground cursor-pointer" title="Send">
                      <Send className="w-4 h-4" />
                    </button>
                    {!tpl.isDefault && (
                      <button onClick={() => deleteTemplate(tpl.id)} className="p-1.5 text-text-tertiary hover:text-red-500 cursor-pointer" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Sent Tab */}
      {tab === "sent" && (
        sentDocuments.length === 0 ? (
          <EmptyState
            icon={<Send className="w-6 h-6" />}
            title="No documents sent"
            description="Send a document to a client to get started."
            actionLabel="Send Document"
            onAction={() => setSendOpen(true)}
          />
        ) : filteredSent.length === 0 ? (
          <div className="bg-card-bg border border-border-light rounded-2xl p-12 text-center">
            <p className="text-[14px] text-text-tertiary">No documents match your search.</p>
          </div>
        ) : (
          <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
            <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_100px_120px_120px] gap-4 px-5 py-3 border-b border-border-light bg-surface/50">
              <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Client</span>
              <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Template</span>
              <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Status</span>
              <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Sent</span>
              <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Signed</span>
            </div>
            <div className="divide-y divide-border-light">
              {filteredSent.map((doc) => (
                <div key={doc.id} onClick={() => setDetailDocId(doc.id)}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px_120px_120px] gap-2 sm:gap-4 px-5 py-4 hover:bg-surface/30 transition-colors cursor-pointer">
                  <span className="text-[14px] font-medium text-foreground truncate">{doc.clientName}</span>
                  <span className="text-[13px] text-text-secondary truncate">{doc.templateName}</span>
                  <div><StatusBadge status={doc.status} /></div>
                  <span className="text-[12px] text-text-tertiary">{doc.sentAt ? formatDate(doc.sentAt) : "---"}</span>
                  <span className="text-[12px] text-text-tertiary">{doc.signedAt ? formatDate(doc.signedAt) : "---"}</span>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Create Template SlideOver */}
      <SlideOver open={createOpen} onClose={() => { setCreateOpen(false); resetForm(); }} title="Create Template">
        <div className="space-y-5">
          <Field label="Name" required>
            <input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="e.g. Service Agreement"
              className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10" />
          </Field>
          <Field label="Description">
            <input value={tplDesc} onChange={(e) => setTplDesc(e.target.value)} placeholder="Brief description..."
              className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10" />
          </Field>
          <Field label="Content">
            <textarea value={tplContent} onChange={(e) => setTplContent(e.target.value)} rows={6} placeholder="Document body text..."
              className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10 resize-none" />
          </Field>

          {/* Fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-medium text-foreground">Fields</label>
              <button onClick={addField} className="text-[12px] font-medium text-text-secondary hover:text-foreground cursor-pointer">
                + Add Field
              </button>
            </div>
            {tplFields.map((field, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <select value={field.type} onChange={(e) => {
                  const next = [...tplFields]; next[i] = { ...field, type: e.target.value as DocumentField["type"] }; setTplFields(next);
                }} className="px-2 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground outline-none w-28">
                  {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input value={field.label} onChange={(e) => {
                  const next = [...tplFields]; next[i] = { ...field, label: e.target.value }; setTplFields(next);
                }} placeholder="Field label..."
                  className="flex-1 px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10" />
                <label className="flex items-center gap-1 text-[12px] text-text-secondary cursor-pointer whitespace-nowrap">
                  <input type="checkbox" checked={field.required} onChange={(e) => {
                    const next = [...tplFields]; next[i] = { ...field, required: e.target.checked }; setTplFields(next);
                  }} className="rounded border-border-light" />
                  Req
                </label>
                <button onClick={() => setTplFields(tplFields.filter((_, j) => j !== i))}
                  className="p-1.5 text-text-tertiary hover:text-red-500 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border-light">
            <Button variant="ghost" onClick={() => { setCreateOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleCreateTemplate}><Plus className="w-4 h-4 mr-1.5" /> Create Template</Button>
          </div>
        </div>
      </SlideOver>

      {/* Send Document SlideOver */}
      <SlideOver open={sendOpen} onClose={() => { setSendOpen(false); setSendTemplateId(""); setSendClientId(""); }} title="Send Document">
        <div className="space-y-5">
          <Field label="Template" required>
            <select value={sendTemplateId} onChange={(e) => setSendTemplateId(e.target.value)}
              className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10">
              <option value="">Select template...</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="Client" required>
            <select value={sendClientId} onChange={(e) => setSendClientId(e.target.value)}
              className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10">
              <option value="">Select client...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <div className="flex justify-end gap-2 pt-4 border-t border-border-light">
            <Button variant="ghost" onClick={() => { setSendOpen(false); setSendTemplateId(""); setSendClientId(""); }}>Cancel</Button>
            <Button onClick={handleSendDocument}><Send className="w-4 h-4 mr-1.5" /> Send</Button>
          </div>
        </div>
      </SlideOver>

      {/* Sent Document Detail SlideOver */}
      <SlideOver open={!!detailDoc} onClose={() => setDetailDocId(null)} title="Document Details">
        {detailDoc && (
          <div className="space-y-6">
            <div className="bg-surface rounded-xl p-5 text-center">
              <p className="text-[15px] font-semibold text-foreground">{detailDoc.templateName}</p>
              <p className="text-[13px] text-text-secondary mt-0.5">Sent to {detailDoc.clientName}</p>
              <div className="mt-2"><StatusBadge status={detailDoc.status} /></div>
            </div>

            <div className="space-y-3">
              <DetailRow label="Template" value={detailDoc.templateName} />
              <DetailRow label="Client" value={detailDoc.clientName} />
              <DetailRow label="Status" value={detailDoc.status} />
              {detailDoc.sentAt && <DetailRow label="Sent" value={formatDate(detailDoc.sentAt)} />}
              {detailDoc.viewedAt && <DetailRow label="Viewed" value={formatDate(detailDoc.viewedAt)} />}
              {detailDoc.signedAt && <DetailRow label="Signed" value={formatDate(detailDoc.signedAt)} />}
              {detailDoc.signatureName && <DetailRow label="Signed By" value={detailDoc.signatureName} />}
            </div>

            {/* Fields */}
            {detailDoc.fields.length > 0 && (
              <div>
                <p className="text-[13px] font-medium text-foreground mb-3">Fields</p>
                <div className="space-y-2">
                  {detailDoc.fields.map((field) => (
                    <div key={field.id} className="flex items-center justify-between bg-surface rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={field.type} />
                        <span className="text-[13px] text-foreground">{field.label}</span>
                        {field.required && <span className="text-[10px] text-red-500">*</span>}
                      </div>
                      <span className="text-[13px] text-text-secondary">
                        {field.type === "checkbox"
                          ? (field.value === "true" ? "Yes" : "No")
                          : field.type === "signature"
                          ? (field.value ? "Signed" : "Pending")
                          : (field.value || "---")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-3 border-t border-border-light">
              {detailDoc.status !== "signed" && (
                <>
                  <Button variant="secondary" className="w-full justify-start" onClick={() => {
                    updateSentDocument(detailDoc.id, { status: "sent", sentAt: new Date().toISOString() });
                    toast("Document resent");
                  }}>
                    <RotateCcw className="w-4 h-4 mr-2" /> Resend
                  </Button>
                  <Button variant="secondary" className="w-full justify-start" onClick={() => {
                    updateSentDocument(detailDoc.id, {
                      status: "signed",
                      signedAt: new Date().toISOString(),
                      signatureName: detailDoc.clientName,
                    });
                    toast("Document marked as signed");
                  }}>
                    <Award className="w-4 h-4 mr-2" /> Mark as Signed
                  </Button>
                </>
              )}
              {detailDoc.status === "signed" && (
                <div className="bg-surface rounded-xl p-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-[14px] font-medium text-foreground">Document Signed</p>
                  <p className="text-[12px] text-text-tertiary mt-0.5">
                    Signed by {detailDoc.signatureName} on {detailDoc.signedAt ? formatDate(detailDoc.signedAt) : "---"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}

// ── Helpers ──

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
