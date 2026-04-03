import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EmailTemplate, EmailTemplateCategory } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";

// ── Default templates (built-in, ready to use) ──

const DEFAULT_TEMPLATES: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Appointment Reminder",
    subject: "Reminder: Your appointment is tomorrow",
    body: `<p>Hi {{clientName}},</p>
<p>Just a friendly reminder that you have an appointment tomorrow:</p>
<p><strong>{{serviceName}}</strong><br/>{{bookingDate}} at {{bookingTime}}</p>
<p>If you need to reschedule, please let us know as soon as possible.</p>
<p>See you soon!<br/>{{businessName}}</p>`,
    category: "reminders",
    variables: ["clientName", "serviceName", "bookingDate", "bookingTime", "businessName"],
    isDefault: true,
    enabled: true,
  },
  {
    name: "Booking Confirmation",
    subject: "Booking confirmed — {{serviceName}}",
    body: `<p>Hi {{clientName}},</p>
<p>Your booking has been confirmed!</p>
<p><strong>{{serviceName}}</strong><br/>{{bookingDate}} at {{bookingTime}}</p>
<p>We look forward to seeing you.</p>
<p>{{businessName}}</p>`,
    category: "reminders",
    variables: ["clientName", "serviceName", "bookingDate", "bookingTime", "businessName"],
    isDefault: true,
    enabled: true,
  },
  {
    name: "Aftercare Instructions",
    subject: "Your aftercare guide — {{serviceName}}",
    body: `<p>Hi {{clientName}},</p>
<p>Thanks for visiting us today! Here are your aftercare instructions:</p>
<p>{{aftercareInstructions}}</p>
<p>If you have any questions, don't hesitate to reach out.</p>
<p>{{businessName}}</p>`,
    category: "aftercare",
    variables: ["clientName", "serviceName", "aftercareInstructions", "businessName"],
    isDefault: true,
    enabled: true,
  },
  {
    name: "Review Request",
    subject: "How was your experience?",
    body: `<p>Hi {{clientName}},</p>
<p>We hope you loved your {{serviceName}}!</p>
<p>If you have a moment, we'd really appreciate a quick review. It helps other people find us and means the world to our team.</p>
<p>Thank you for choosing {{businessName}}!</p>`,
    category: "review-request",
    variables: ["clientName", "serviceName", "businessName"],
    isDefault: true,
    enabled: true,
  },
  {
    name: "Invoice Sent",
    subject: "Invoice {{invoiceNumber}} from {{businessName}}",
    body: `<p>Hi {{clientName}},</p>
<p>Please find your invoice below:</p>
<p><strong>Invoice #{{invoiceNumber}}</strong><br/>Amount: {{invoiceTotal}}<br/>Due: {{invoiceDueDate}}</p>
<p>Thank you for your business!</p>
<p>{{businessName}}</p>`,
    category: "invoicing",
    variables: ["clientName", "invoiceNumber", "invoiceTotal", "invoiceDueDate", "businessName"],
    isDefault: true,
    enabled: true,
  },
  {
    name: "Rebooking Reminder",
    subject: "Time to rebook your {{serviceName}}?",
    body: `<p>Hi {{clientName}},</p>
<p>It's been a while since your last {{serviceName}}. Based on your usual schedule, you might be due for another one!</p>
<p>Would you like to book your next appointment?</p>
<p>{{businessName}}</p>`,
    category: "follow-up",
    variables: ["clientName", "serviceName", "businessName"],
    isDefault: true,
    enabled: true,
  },
  {
    name: "We Miss You",
    subject: "We miss you, {{clientName}}!",
    body: `<p>Hi {{clientName}},</p>
<p>We noticed it's been a while since your last visit. We'd love to see you again!</p>
<p>Book your next appointment and let us take care of you.</p>
<p>{{businessName}}</p>`,
    category: "follow-up",
    variables: ["clientName", "businessName"],
    isDefault: true,
    enabled: true,
  },
  {
    name: "Payment Reminder",
    subject: "Payment reminder — Invoice {{invoiceNumber}}",
    body: `<p>Hi {{clientName}},</p>
<p>This is a friendly reminder that invoice #{{invoiceNumber}} for {{invoiceTotal}} is now overdue.</p>
<p>Please let us know if you have any questions about the invoice.</p>
<p>{{businessName}}</p>`,
    category: "invoicing",
    variables: ["clientName", "invoiceNumber", "invoiceTotal", "businessName"],
    isDefault: true,
    enabled: true,
  },
];

// ── Available template variables ──

export const TEMPLATE_VARIABLES: { key: string; label: string; example: string }[] = [
  { key: "clientName", label: "Client Name", example: "Sarah M." },
  { key: "clientEmail", label: "Client Email", example: "sarah@example.com" },
  { key: "businessName", label: "Business Name", example: "Glow Studio" },
  { key: "serviceName", label: "Service Name", example: "Gel Manicure" },
  { key: "bookingDate", label: "Booking Date", example: "Monday, 15 April" },
  { key: "bookingTime", label: "Booking Time", example: "2:00 PM" },
  { key: "invoiceNumber", label: "Invoice Number", example: "INV-001" },
  { key: "invoiceTotal", label: "Invoice Total", example: "$150.00" },
  { key: "invoiceDueDate", label: "Invoice Due Date", example: "30 April 2026" },
  { key: "aftercareInstructions", label: "Aftercare Instructions", example: "Avoid water for 24 hours..." },
];

// ── Store ──

interface EmailTemplatesStore {
  templates: EmailTemplate[];
  addTemplate: (data: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">) => EmailTemplate;
  updateTemplate: (id: string, data: Partial<EmailTemplate>) => void;
  deleteTemplate: (id: string) => void;
  toggleTemplate: (id: string) => void;
  getByCategory: (category: EmailTemplateCategory) => EmailTemplate[];
  renderTemplate: (templateId: string, variables: Record<string, string>) => { subject: string; body: string } | null;
}

function initDefaults(): EmailTemplate[] {
  const now = new Date().toISOString();
  return DEFAULT_TEMPLATES.map((t) => ({
    ...t,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }));
}

export const useEmailTemplatesStore = create<EmailTemplatesStore>()(
  persist(
    (set, get) => ({
      templates: initDefaults(),

      addTemplate: (data) => {
        const now = new Date().toISOString();
        const template: EmailTemplate = { ...data, id: generateId(), createdAt: now, updatedAt: now };
        set((s) => ({ templates: [...s.templates, template] }));
        logActivity("create", "email-templates", `Created template: ${data.name}`);
        toast(`Template "${data.name}" created`);
        return template;
      },

      updateTemplate: (id, data) => {
        set((s) => ({
          templates: s.templates.map((t) =>
            t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
          ),
        }));
        toast("Template updated");
      },

      deleteTemplate: (id) => {
        const template = get().templates.find((t) => t.id === id);
        if (template?.isDefault) {
          toast("Cannot delete built-in templates", "error");
          return;
        }
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
        logActivity("delete", "email-templates", "Deleted email template");
        toast("Template deleted", "info");
      },

      toggleTemplate: (id) => {
        set((s) => ({
          templates: s.templates.map((t) =>
            t.id === id ? { ...t, enabled: !t.enabled, updatedAt: new Date().toISOString() } : t
          ),
        }));
      },

      getByCategory: (category) => {
        return get().templates.filter((t) => t.category === category);
      },

      renderTemplate: (templateId, variables) => {
        const template = get().templates.find((t) => t.id === templateId);
        if (!template) return null;

        let subject = template.subject;
        let body = template.body;

        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
          subject = subject.replace(regex, value);
          body = body.replace(regex, value);
        });

        return { subject, body };
      },
    }),
    {
      name: "magic-crm-email-templates",
      version: 1,
    }
  )
);
