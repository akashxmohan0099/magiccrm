import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DocumentTemplate, SentDocument } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";

const DEFAULT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "tpl-general-waiver",
    workspaceId: "",
    name: "General Waiver",
    description: "Standard liability waiver for beauty and wellness services.",
    content:
      "I, the undersigned, acknowledge that I am voluntarily participating in beauty and wellness services. I understand that these services carry inherent risks, and I assume full responsibility for any results. I release the service provider from any liability arising from the services rendered.",
    fields: [
      { id: "f1", type: "text", label: "Full Name", required: true },
      { id: "f2", type: "date", label: "Date", required: true },
      { id: "f3", type: "checkbox", label: "I agree to the terms above", required: true },
      { id: "f4", type: "signature", label: "Signature", required: true },
    ],
    isDefault: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "tpl-consent-form",
    workspaceId: "",
    name: "Consent Form",
    description: "Treatment consent form for specific procedures.",
    content:
      "I consent to the treatment(s) described by my service provider. I have been informed of the potential risks, benefits, and alternatives. I confirm that I have disclosed all relevant medical history and current medications.",
    fields: [
      { id: "f5", type: "text", label: "Full Name", required: true },
      { id: "f6", type: "text", label: "Treatment Description", required: true },
      { id: "f7", type: "checkbox", label: "I have disclosed all medical conditions", required: true },
      { id: "f8", type: "date", label: "Date", required: true },
      { id: "f9", type: "signature", label: "Signature", required: true },
    ],
    isDefault: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

interface DocumentsStore {
  templates: DocumentTemplate[];
  sentDocuments: SentDocument[];
  addTemplate: (data: Omit<DocumentTemplate, "id" | "createdAt" | "updatedAt">) => DocumentTemplate;
  updateTemplate: (id: string, data: Partial<DocumentTemplate>) => void;
  deleteTemplate: (id: string) => void;
  sendDocument: (templateId: string, clientId: string, clientName: string) => SentDocument | null;
  updateSentDocument: (id: string, data: Partial<SentDocument>) => void;
}

export const useDocumentsStore = create<DocumentsStore>()(
  persist(
    (set, get) => ({
      templates: DEFAULT_TEMPLATES,
      sentDocuments: [],

      addTemplate: (data) => {
        const now = new Date().toISOString();
        const template: DocumentTemplate = {
          id: generateId(),
          createdAt: now,
          updatedAt: now,
          ...data,
        };
        set((s) => ({ templates: [template, ...s.templates] }));
        toast(`Template "${template.name}" created`);
        return template;
      },

      updateTemplate: (id, data) => {
        const now = new Date().toISOString();
        set((s) => ({
          templates: s.templates.map((t) =>
            t.id === id ? { ...t, ...data, updatedAt: now } : t
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
        toast("Template deleted");
      },

      sendDocument: (templateId, clientId, clientName) => {
        const template = get().templates.find((t) => t.id === templateId);
        if (!template) return null;
        const now = new Date().toISOString();
        const doc: SentDocument = {
          id: generateId(),
          workspaceId: template.workspaceId,
          templateId,
          templateName: template.name,
          clientId,
          clientName,
          status: "sent",
          fields: template.fields.map((f) => ({ ...f, value: undefined })),
          sentAt: now,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ sentDocuments: [doc, ...s.sentDocuments] }));
        toast(`Document sent to ${clientName}`);
        return doc;
      },

      updateSentDocument: (id, data) => {
        const now = new Date().toISOString();
        set((s) => ({
          sentDocuments: s.sentDocuments.map((d) =>
            d.id === id ? { ...d, ...data, updatedAt: now } : d
          ),
        }));
      },
    }),
    { name: "magic-crm-documents", version: 1 }
  )
);
