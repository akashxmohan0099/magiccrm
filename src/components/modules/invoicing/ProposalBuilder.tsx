"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Type,
  Table,
  FileText,
  PenTool,
  Minus,
  LayoutTemplate,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  X,
  ScrollText,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProposalsStore } from "@/store/proposals";
import { useClientsStore } from "@/store/clients";
import { useOnboardingStore } from "@/store/onboarding";
import { useAuth } from "@/hooks/useAuth";
import { ProposalSection, LineItem } from "@/types/models";
import { generateId } from "@/lib/id";
import { PROPOSAL_STYLES, getProposalStyle } from "@/lib/proposal-styles";
import type { ProposalDesignStyle } from "@/lib/proposal-styles";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { DateField } from "@/components/ui/DateField";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import { LineItemEditor } from "@/components/ui/LineItemEditor";

// ── Types ──

interface ProposalBuilderProps {
  open: boolean;
  onClose: () => void;
}

type BuilderStep = "template" | "design" | "editor";

// ── Constants ──

const SECTION_TYPES = [
  { value: "text", label: "Text", icon: Type },
  { value: "pricing-table", label: "Pricing Table", icon: Table },
  { value: "terms", label: "Terms", icon: FileText },
  { value: "signature", label: "Signature", icon: PenTool },
  { value: "divider", label: "Divider", icon: Minus },
] as const;

type AddableSectionType = (typeof SECTION_TYPES)[number]["value"];

const TYPE_BADGE_COLORS: Record<string, string> = {
  text: "bg-blue-100 text-blue-700",
  "pricing-table": "bg-emerald-100 text-emerald-700",
  terms: "bg-amber-100 text-amber-700",
  signature: "bg-purple-100 text-purple-700",
  divider: "bg-gray-100 text-gray-500",
  services: "bg-teal-100 text-teal-700",
  image: "bg-pink-100 text-pink-700",
};

const BUILT_IN_TEMPLATES = [
  {
    name: "Service Proposal",
    description: "Standard proposal with intro, pricing, terms, and signature.",
    icon: "service" as const,
    sections: [
      { type: "text" as const, title: "About Us", content: "Thank you for considering us for your project. We are excited to work with you and deliver exceptional results.", order: 0 },
      { type: "text" as const, title: "Scope of Work", content: "Below is a summary of the services we will provide:\n\n- [Describe service 1]\n- [Describe service 2]\n- [Describe service 3]", order: 1 },
      { type: "pricing-table" as const, title: "Pricing", lineItems: [{ id: "tpl-1", description: "Service package", quantity: 1, unitPrice: 0 }], order: 2 },
      { type: "text" as const, title: "Timeline", content: "Estimated project timeline: [X weeks/months]\n\nKey milestones:\n- Week 1: Kickoff & discovery\n- Week 2-3: Delivery\n- Week 4: Review & refinement", order: 3 },
      { type: "terms" as const, title: "Terms & Conditions", content: "- Payment: 50% deposit upon acceptance, balance on completion\n- Validity: This proposal is valid for 30 days\n- Revisions: [X] rounds of revisions included", order: 4 },
      { type: "signature" as const, order: 5 },
    ],
  },
  {
    name: "Project Quote",
    description: "Pricing-focused with itemized breakdown and deposit terms.",
    icon: "quote" as const,
    sections: [
      { type: "text" as const, title: "Project Overview", content: "We are pleased to provide this quote for your upcoming project.", order: 0 },
      { type: "pricing-table" as const, title: "Itemized Pricing", lineItems: [{ id: "tpl-2", description: "Item 1", quantity: 1, unitPrice: 0 }, { id: "tpl-3", description: "Item 2", quantity: 1, unitPrice: 0 }], order: 1 },
      { type: "terms" as const, title: "Payment Terms", content: "- 50% deposit required to secure your booking\n- Balance due upon completion\n- Late payments subject to a 5% surcharge", order: 2 },
      { type: "signature" as const, order: 3 },
    ],
  },
  {
    name: "Event Package",
    description: "Perfect for weddings, events, and experience-based services.",
    icon: "event" as const,
    sections: [
      { type: "text" as const, title: "Welcome", content: "We are thrilled to be part of your special day! Here is what we have in store for you.", order: 0 },
      { type: "text" as const, title: "What's Included", content: "Your package includes:\n\n- [Package item 1]\n- [Package item 2]\n- [Package item 3]\n- [Package item 4]", order: 1 },
      { type: "pricing-table" as const, title: "Package Pricing", lineItems: [{ id: "tpl-4", description: "Package", quantity: 1, unitPrice: 0 }], order: 2 },
      { type: "text" as const, title: "How It Works", content: "1. Confirm your booking with a signed proposal and deposit\n2. We will schedule a consultation to finalize details\n3. On the day, we handle everything\n4. Deliverables within [X] days", order: 3 },
      { type: "terms" as const, title: "Terms", content: "- Non-refundable deposit of 30% to secure your date\n- Balance due 14 days before the event\n- Cancellation policy: 30 days notice required for full refund (less deposit)", order: 4 },
      { type: "signature" as const, order: 5 },
    ],
  },
  {
    name: "Retainer Agreement",
    description: "For ongoing services with monthly billing.",
    icon: "retainer" as const,
    sections: [
      { type: "text" as const, title: "Engagement Overview", content: "This retainer agreement covers ongoing services as outlined below.", order: 0 },
      { type: "text" as const, title: "Services Included", content: "Monthly retainer includes:\n\n- [X] hours of service per month\n- [Describe deliverable 1]\n- [Describe deliverable 2]\n- Priority response within 24 hours", order: 1 },
      { type: "pricing-table" as const, title: "Monthly Fee", lineItems: [{ id: "tpl-5", description: "Monthly retainer", quantity: 1, unitPrice: 0 }], order: 2 },
      { type: "terms" as const, title: "Agreement Terms", content: "- Billing: Monthly, due on the 1st\n- Minimum commitment: 3 months\n- Unused hours do not roll over\n- Either party may terminate with 30 days written notice", order: 3 },
      { type: "signature" as const, order: 4 },
    ],
  },
];

interface TemplateData {
  name: string;
  description: string;
  icon: string;
  sections: Omit<ProposalSection, "id">[];
}

const STYLE_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "minimal", label: "Minimal" },
  { value: "modern", label: "Modern" },
  { value: "bold", label: "Bold" },
  { value: "warm", label: "Warm" },
  { value: "elegant", label: "Elegant" },
] as const;

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  service: <FileText className="w-6 h-6" />,
  quote: <ScrollText className="w-6 h-6" />,
  event: <Calendar className="w-6 h-6" />,
  retainer: <RefreshCw className="w-6 h-6" />,
  saved: <LayoutTemplate className="w-6 h-6" />,
  blank: <Plus className="w-6 h-6" />,
};

// ── Rich Mini Preview ──

function ProposalTemplatePreview({
  style,
  accentOverride,
}: {
  style: ProposalDesignStyle;
  accentOverride?: string;
}) {
  const accent = accentOverride || style.accent;
  const isLight = isLightColor(style.bg);
  const textColor = style.text;
  const mutedColor = style.muted;

  return (
    <div
      style={{
        width: 340,
        height: 460,
        backgroundColor: style.bg,
        fontFamily: style.fontFamily,
        transform: "scale(0.62)",
        transformOrigin: "top left",
        borderRadius: 6,
        overflow: "hidden",
        border: `1px solid ${style.border}`,
      }}
    >
      {/* Header area */}
      <div
        style={{
          backgroundColor: style.headerBg,
          padding: "20px 24px 16px",
          borderBottom: `2px solid ${accent}`,
        }}
      >
        {/* Logo placeholder */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: accent,
              opacity: 0.85,
            }}
          />
          <div
            style={{
              height: 8,
              width: 70,
              borderRadius: 3,
              backgroundColor: isLightColor(style.headerBg) ? style.text : "#ffffff",
              opacity: 0.6,
            }}
          />
        </div>
        {/* Title */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: isLightColor(style.headerBg) ? textColor : "#ffffff",
            marginBottom: 4,
            letterSpacing: "-0.01em",
          }}
        >
          Proposal Title
        </div>
        <div
          style={{
            fontSize: 9,
            color: isLightColor(style.headerBg) ? mutedColor : "rgba(255,255,255,0.6)",
          }}
        >
          Prepared for Client Name
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 24px" }}>
        {/* About section */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: accent,
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            About Us
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ height: 5, width: "100%", borderRadius: 2, backgroundColor: mutedColor, opacity: 0.18 }} />
            <div style={{ height: 5, width: "85%", borderRadius: 2, backgroundColor: mutedColor, opacity: 0.14 }} />
            <div style={{ height: 5, width: "70%", borderRadius: 2, backgroundColor: mutedColor, opacity: 0.11 }} />
          </div>
        </div>

        {/* Pricing table */}
        <div
          style={{
            border: `1px solid ${style.border}`,
            borderRadius: 4,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "6px 10px",
              backgroundColor: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.05)",
              borderBottom: `1px solid ${style.border}`,
              fontSize: 8,
              fontWeight: 600,
              color: mutedColor,
            }}
          >
            <span style={{ flex: 1 }}>Item</span>
            <span style={{ width: 30, textAlign: "center" }}>Qty</span>
            <span style={{ width: 50, textAlign: "right" }}>Price</span>
          </div>
          {/* Row 1 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "5px 10px",
              borderBottom: `1px solid ${style.border}`,
              fontSize: 8,
              color: textColor,
            }}
          >
            <span style={{ flex: 1 }}>
              <span style={{ height: 5, width: 55, borderRadius: 2, backgroundColor: mutedColor, opacity: 0.2, display: "inline-block" }} />
            </span>
            <span style={{ width: 30, textAlign: "center", fontSize: 8 }}>1</span>
            <span style={{ width: 50, textAlign: "right", fontSize: 8 }}>$500</span>
          </div>
          {/* Row 2 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "5px 10px",
              borderBottom: `1px solid ${style.border}`,
              fontSize: 8,
              color: textColor,
            }}
          >
            <span style={{ flex: 1 }}>
              <span style={{ height: 5, width: 45, borderRadius: 2, backgroundColor: mutedColor, opacity: 0.2, display: "inline-block" }} />
            </span>
            <span style={{ width: 30, textAlign: "center", fontSize: 8 }}>1</span>
            <span style={{ width: 50, textAlign: "right", fontSize: 8 }}>$750</span>
          </div>
          {/* Total row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              padding: "6px 10px",
              backgroundColor: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)",
              fontSize: 9,
              fontWeight: 700,
              color: accent,
              gap: 12,
            }}
          >
            <span>Total</span>
            <span>$1,250</span>
          </div>
        </div>

        {/* Terms section */}
        <div
          style={{
            border: `1px solid ${style.border}`,
            borderRadius: 4,
            padding: "8px 10px",
            marginBottom: 16,
            borderLeft: `3px solid ${accent}`,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: textColor,
              marginBottom: 4,
            }}
          >
            Terms
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ height: 4, width: "90%", borderRadius: 2, backgroundColor: mutedColor, opacity: 0.15 }} />
            <div style={{ height: 4, width: "75%", borderRadius: 2, backgroundColor: mutedColor, opacity: 0.12 }} />
          </div>
        </div>

        {/* Signature */}
        <div style={{ textAlign: "center", paddingTop: 4 }}>
          <div
            style={{
              width: "60%",
              height: 1,
              backgroundColor: mutedColor,
              opacity: 0.3,
              margin: "0 auto 4px",
            }}
          />
          <div style={{ fontSize: 7, color: mutedColor, opacity: 0.6 }}>Sign here</div>
        </div>
      </div>
    </div>
  );
}

// ── Live Preview for Editor ──

function LiveProposalPreview({
  title,
  clientName,
  businessName,
  sections,
  styleId,
  paletteId,
}: {
  title: string;
  clientName: string;
  businessName: string;
  sections: ProposalSection[];
  styleId: string;
  paletteId: string;
}) {
  const style = useMemo(() => getProposalStyle(styleId, paletteId), [styleId, paletteId]);
  const isHeaderLight = isLightColor(style.headerBg);
  const headerTextColor = isHeaderLight ? style.text : "#ffffff";
  const headerMutedColor = isHeaderLight ? style.muted : "rgba(255,255,255,0.6)";

  const getTotal = (items: LineItem[]) =>
    items.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);

  return (
    <div
      className="rounded-xl overflow-hidden shadow-sm border"
      style={{
        backgroundColor: style.bg,
        borderColor: style.border,
        fontFamily: style.fontFamily,
        minHeight: 400,
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: style.headerBg,
          padding: "24px 28px 20px",
          borderBottom: `3px solid ${style.activeAccent}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: style.activeAccent,
              opacity: 0.85,
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: headerTextColor,
              opacity: 0.8,
            }}
          >
            {businessName || "Your Business"}
          </span>
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: headerTextColor,
            marginBottom: 4,
          }}
        >
          {title || "Untitled Proposal"}
        </div>
        <div style={{ fontSize: 12, color: headerMutedColor }}>
          Prepared for {clientName || "Client"}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 28px 28px" }}>
        {sections.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: style.muted,
              fontSize: 13,
            }}
          >
            Add sections to see them here
          </div>
        )}

        {sections.map((section) => {
          switch (section.type) {
            case "text":
              return (
                <div key={section.id} style={{ marginBottom: 20 }}>
                  {section.title && (
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: style.activeAccent,
                        marginBottom: 6,
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                      }}
                    >
                      {section.title}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 12,
                      lineHeight: 1.7,
                      color: style.text,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {section.content || (
                      <span style={{ color: style.muted, fontStyle: "italic" }}>
                        No content yet...
                      </span>
                    )}
                  </div>
                </div>
              );

            case "pricing-table": {
              const items = section.lineItems ?? [];
              return (
                <div key={section.id} style={{ marginBottom: 20 }}>
                  {section.title && (
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: style.activeAccent,
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                      }}
                    >
                      {section.title}
                    </div>
                  )}
                  <div
                    style={{
                      border: `1px solid ${style.border}`,
                      borderRadius: 6,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        padding: "8px 14px",
                        backgroundColor: isLightColor(style.bg) ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.05)",
                        borderBottom: `1px solid ${style.border}`,
                        fontSize: 11,
                        fontWeight: 600,
                        color: style.muted,
                      }}
                    >
                      <span style={{ flex: 1 }}>Item</span>
                      <span style={{ width: 50, textAlign: "center" }}>Qty</span>
                      <span style={{ width: 80, textAlign: "right" }}>Price</span>
                    </div>
                    {items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          padding: "7px 14px",
                          borderBottom: `1px solid ${style.border}`,
                          fontSize: 11,
                          color: style.text,
                        }}
                      >
                        <span style={{ flex: 1 }}>
                          {item.description || "—"}
                        </span>
                        <span style={{ width: 50, textAlign: "center" }}>
                          {item.quantity}
                        </span>
                        <span style={{ width: 80, textAlign: "right" }}>
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        padding: "8px 14px",
                        fontSize: 12,
                        fontWeight: 700,
                        color: style.activeAccent,
                        gap: 16,
                        backgroundColor: isLightColor(style.bg) ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <span>Total</span>
                      <span>${getTotal(items).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            }

            case "terms":
              return (
                <div key={section.id} style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      border: `1px solid ${style.border}`,
                      borderRadius: 6,
                      padding: "12px 16px",
                      borderLeft: `4px solid ${style.activeAccent}`,
                    }}
                  >
                    {section.title && (
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: style.text,
                          marginBottom: 6,
                        }}
                      >
                        {section.title}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 11,
                        lineHeight: 1.7,
                        color: style.muted,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {section.content || "No terms specified..."}
                    </div>
                  </div>
                </div>
              );

            case "signature":
              return (
                <div key={section.id} style={{ marginBottom: 20, textAlign: "center", paddingTop: 8 }}>
                  <div
                    style={{
                      width: "50%",
                      height: 1,
                      backgroundColor: style.muted,
                      opacity: 0.4,
                      margin: "0 auto 8px",
                    }}
                  />
                  <div style={{ fontSize: 10, color: style.muted }}>Sign here</div>
                </div>
              );

            case "divider":
              return (
                <div key={section.id} style={{ marginBottom: 20 }}>
                  <hr style={{ border: "none", borderTop: `1px solid ${style.border}` }} />
                </div>
              );

            default:
              return (
                <div key={section.id} style={{ marginBottom: 20 }}>
                  {section.title && (
                    <div style={{ fontSize: 13, fontWeight: 600, color: style.activeAccent, marginBottom: 6 }}>
                      {section.title}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: style.text, whiteSpace: "pre-wrap" }}>
                    {section.content || ""}
                  </div>
                </div>
              );
          }
        })}
      </div>
    </div>
  );
}

// ── Main Builder Component ──

export function ProposalBuilder({ open, onClose }: ProposalBuilderProps) {
  const { addProposal, templates: savedTemplates } = useProposalsStore();
  const { clients } = useClientsStore();
  const businessName = useOnboardingStore((s) => s.businessContext.businessName);
  const { workspaceId } = useAuth();

  // Step state
  const [step, setStep] = useState<BuilderStep>("template");

  // Template + design state
  const [selectedTemplateData, setSelectedTemplateData] = useState<TemplateData | null>(null);
  const [selectedStyleId, setSelectedStyleId] = useState("classic");
  const [selectedPaletteId, setSelectedPaletteId] = useState("slate");
  const [styleFilter, setStyleFilter] = useState("all");

  // Form state
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  // Reset when opened
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep("template");
      setSelectedTemplateData(null);
      setSelectedStyleId("classic");
      setSelectedPaletteId("slate");
      setStyleFilter("all");
      setTitle("");
      setClientId("");
      setValidUntil("");
      setSections([]);
      setNotes("");
      setAddMenuOpen(false);
    }
  }, [open]);

  // Reset palette when style changes
  useEffect(() => {
    const style = PROPOSAL_STYLES.find((s) => s.id === selectedStyleId);
    if (style && style.palettes.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPaletteId(style.palettes[0].id);
    }
  }, [selectedStyleId]);

  const activeStyle = useMemo(
    () => getProposalStyle(selectedStyleId, selectedPaletteId),
    [selectedStyleId, selectedPaletteId]
  );

  const filteredStyles = useMemo(() => {
    if (styleFilter === "all") return PROPOSAL_STYLES;
    return PROPOSAL_STYLES.filter((s) => s.category === styleFilter);
  }, [styleFilter]);

  const clientOptions = useMemo(
    () => [
      { value: "", label: "Select a client..." },
      ...clients.map((c) => ({ value: c.id, label: c.name })),
    ],
    [clients]
  );

  const selectedClientName = useMemo(
    () => clients.find((c) => c.id === clientId)?.name ?? "",
    [clients, clientId]
  );

  // ── Step 1: Template Selection ──

  const handleSelectTemplate = useCallback(
    (tpl: TemplateData) => {
      setSelectedTemplateData(tpl);
      setStep("design");
    },
    []
  );

  const handleSelectBlank = useCallback(() => {
    setSelectedTemplateData(null);
    setTitle("");
    setSections([]);
    // Skip design for blank, go to editor
    setStep("design");
  }, []);

  // ── Step 2: Design Selection ──

  const handleApplyDesign = useCallback(() => {
    if (selectedTemplateData) {
      setTitle(selectedTemplateData.name);
      setSections(
        selectedTemplateData.sections.map((s) => ({
          ...s,
          id: generateId(),
          content: s.content?.replace(
            /\{business_name\}/g,
            businessName || "Your Business"
          ),
          lineItems: s.lineItems?.map((li) => ({ ...li, id: generateId() })),
        }))
      );
    }
    setStep("editor");
  }, [selectedTemplateData, businessName]);

  // ── Step 3: Editor helpers ──

  const addSection = useCallback(
    (type: AddableSectionType) => {
      const newSection: ProposalSection = {
        id: generateId(),
        type,
        title: "",
        content: type === "signature" ? "" : "",
        lineItems:
          type === "pricing-table"
            ? [{ id: generateId(), description: "", quantity: 1, unitPrice: 0 }]
            : undefined,
        order: sections.length,
      };
      setSections((prev) => [...prev, newSection]);
      setAddMenuOpen(false);
    },
    [sections.length]
  );

  const removeSection = useCallback((id: string) => {
    setSections((prev) =>
      prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i }))
    );
  }, []);

  const moveSection = useCallback(
    (index: number, direction: "up" | "down") => {
      setSections((prev) => {
        if (direction === "up" && index === 0) return prev;
        if (direction === "down" && index === prev.length - 1) return prev;
        const newSections = [...prev];
        const swapIndex = direction === "up" ? index - 1 : index + 1;
        [newSections[index], newSections[swapIndex]] = [
          newSections[swapIndex],
          newSections[index],
        ];
        return newSections.map((s, i) => ({ ...s, order: i }));
      });
    },
    []
  );

  const updateSection = useCallback(
    (id: string, updates: Partial<ProposalSection>) => {
      setSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
    },
    []
  );

  const handleSubmit = useCallback(() => {
    if (saving) return;
    if (!title.trim()) return;
    setSaving(true);

    const clientName = clients.find((c) => c.id === clientId)?.name;

    addProposal({
      title,
      clientId: clientId || undefined,
      clientName,
      sections,
      status: "draft",
      validUntil: validUntil || undefined,
      branding: {
        designStyle: selectedStyleId,
        palette: selectedPaletteId,
      },
      notes,
    }, workspaceId ?? undefined);

    setSaving(false);
    onClose();
  }, [
    saving,
    title,
    clients,
    clientId,
    sections,
    validUntil,
    selectedStyleId,
    selectedPaletteId,
    notes,
    addProposal,
    onClose,
    workspaceId,
  ]);

  const renderSectionContent = (section: ProposalSection) => {
    switch (section.type) {
      case "text":
        return (
          <TextArea
            value={section.content ?? ""}
            onChange={(e) =>
              updateSection(section.id, { content: e.target.value })
            }
            placeholder="Enter text content..."
          />
        );
      case "pricing-table":
        return (
          <div className="space-y-3">
            <LineItemEditor
              items={section.lineItems ?? []}
              onChange={(items) =>
                updateSection(section.id, { lineItems: items })
              }
            />
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={section.interactive ?? false}
                onChange={(e) =>
                  updateSection(section.id, { interactive: e.target.checked })
                }
                className="w-4 h-4 rounded border-border-light text-primary focus:ring-primary/20 cursor-pointer"
              />
              <span className="text-xs text-text-secondary group-hover:text-foreground transition-colors">
                Make pricing interactive
              </span>
              <span className="text-[10px] text-text-tertiary">
                — client can select/deselect line items
              </span>
            </label>
          </div>
        );
      case "terms":
        return (
          <TextArea
            value={section.content ?? ""}
            onChange={(e) =>
              updateSection(section.id, { content: e.target.value })
            }
            placeholder="Enter terms and conditions..."
          />
        );
      case "signature":
        return (
          <div className="px-4 py-3 bg-surface/50 rounded-lg border border-border-light text-sm text-text-secondary italic">
            Client will sign here
          </div>
        );
      case "divider":
        return <hr className="border-border-light my-1" />;
      default:
        return (
          <TextArea
            value={section.content ?? ""}
            onChange={(e) =>
              updateSection(section.id, { content: e.target.value })
            }
            placeholder="Enter content..."
          />
        );
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex-shrink-0 h-14 border-b border-border-light bg-card-bg flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="h-5 w-px bg-border-light" />
          <h1 className="text-[15px] font-semibold text-foreground">
            New Proposal
          </h1>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2">
          {(["template", "design", "editor"] as BuilderStep[]).map(
            (s, i) => {
              const labels = ["Template", "Design", "Editor"];
              const isActive = s === step;
              const isPast =
                (s === "template" && (step === "design" || step === "editor")) ||
                (s === "design" && step === "editor");
              return (
                <div key={s} className="flex items-center gap-2">
                  {i > 0 && (
                    <div
                      className={`w-6 h-px ${
                        isPast ? "bg-primary" : "bg-border-light"
                      }`}
                    />
                  )}
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors ${
                        isActive
                          ? "bg-primary text-white"
                          : isPast
                          ? "bg-primary/10 text-primary"
                          : "bg-surface text-text-tertiary"
                      }`}
                    >
                      {isPast ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium hidden sm:inline ${
                        isActive
                          ? "text-foreground"
                          : isPast
                          ? "text-primary"
                          : "text-text-tertiary"
                      }`}
                    >
                      {labels[i]}
                    </span>
                  </div>
                </div>
              );
            }
          )}
        </div>

        <div className="w-20" />
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* ── STEP 1: Choose Template ── */}
          {step === "template" && (
            <motion.div
              key="step-template"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl mx-auto py-10 px-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Choose a template
                </h2>
                <p className="text-sm text-text-secondary">
                  Start with a pre-built structure or create from scratch.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {BUILT_IN_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.name}
                    onClick={() => handleSelectTemplate(tpl)}
                    className="flex flex-col items-start gap-3 p-5 rounded-xl border border-border-light hover:border-primary/30 hover:bg-primary/5 transition-all text-left cursor-pointer group bg-card-bg"
                  >
                    <div className="w-11 h-11 bg-surface rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors text-text-secondary group-hover:text-primary">
                      {TEMPLATE_ICONS[tpl.icon] ?? <FileText className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground mb-1">
                        {tpl.name}
                      </p>
                      <p className="text-xs text-text-tertiary leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-text-tertiary bg-surface px-2 py-0.5 rounded-full">
                        {tpl.sections.length} section{tpl.sections.length !== 1 ? "s" : ""}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-text-tertiary group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                ))}

                {/* Blank proposal */}
                <button
                  onClick={handleSelectBlank}
                  className="flex flex-col items-start gap-3 p-5 rounded-xl border-2 border-dashed border-border-light hover:border-primary/30 hover:bg-primary/5 transition-all text-left cursor-pointer group"
                >
                  <div className="w-11 h-11 bg-surface rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors text-text-secondary group-hover:text-primary">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground mb-1">
                      Blank Proposal
                    </p>
                    <p className="text-xs text-text-tertiary leading-relaxed">
                      Start from scratch with an empty canvas.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-text-tertiary bg-surface px-2 py-0.5 rounded-full">
                      0 sections
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-text-tertiary group-hover:text-primary transition-colors" />
                  </div>
                </button>
              </div>

              {/* Saved templates */}
              {savedTemplates.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-text-tertiary" />
                    <span className="text-xs text-text-tertiary font-semibold uppercase tracking-wider">
                      Your Templates
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedTemplates.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => {
                          const templateData: TemplateData = {
                            name: tpl.name,
                            description: tpl.description,
                            icon: "saved",
                            sections: tpl.sections.map(
                              ({ id: __id, ...rest }) => rest
                            ),
                          };
                          handleSelectTemplate(templateData);
                        }}
                        className="flex flex-col items-start gap-3 p-5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all text-left cursor-pointer group"
                      >
                        <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 text-primary">
                          <LayoutTemplate className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground mb-1">
                            {tpl.name}
                          </p>
                          <p className="text-xs text-text-tertiary leading-relaxed">
                            {tpl.description}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-text-tertiary group-hover:text-primary transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── STEP 2: Choose Design ── */}
          {step === "design" && (
            <motion.div
              key="step-design"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2 }}
              className="max-w-5xl mx-auto py-10 px-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setStep("template")}
                  className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-foreground transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Choose a design
                  </h2>
                  <p className="text-sm text-text-secondary">
                    Pick a visual style for your proposal.
                    {selectedTemplateData && (
                      <span className="ml-2 text-text-tertiary">
                        Template: {selectedTemplateData.name}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Category filter pills */}
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                {STYLE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setStyleFilter(cat.value)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      styleFilter === cat.value
                        ? "bg-primary text-white"
                        : "bg-surface text-text-secondary hover:bg-surface/80 hover:text-foreground"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Design grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                {filteredStyles.map((style) => {
                  const isActive = selectedStyleId === style.id;
                  const previewAccent = isActive
                    ? style.palettes.find((p) => p.id === selectedPaletteId)
                        ?.accent || style.accent
                    : style.accent;

                  return (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyleId(style.id)}
                      className={`rounded-xl border-2 overflow-hidden transition-all text-left cursor-pointer ${
                        isActive
                          ? "border-primary shadow-[0_0_0_3px_rgba(var(--primary-rgb,99,102,241),0.15)]"
                          : "border-border-light hover:border-primary/20 hover:shadow-sm"
                      }`}
                    >
                      {/* Rich mini preview */}
                      <div
                        className="relative"
                        style={{
                          width: "100%",
                          height: 280,
                          overflow: "hidden",
                        }}
                      >
                        <ProposalTemplatePreview
                          style={style}
                          accentOverride={previewAccent}
                        />
                        {isActive && (
                          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-sm">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </div>
                      {/* Style info */}
                      <div className="px-4 py-3 bg-card-bg border-t border-border-light">
                        <p className="text-[13px] font-semibold text-foreground">
                          {style.name}
                        </p>
                        <p className="text-[11px] text-text-tertiary">
                          {style.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Palette picker */}
              <div className="bg-card-bg border border-border-light rounded-xl p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">
                      Accent colour
                    </p>
                    <p className="text-[11px] text-text-tertiary">
                      Choose a colour for headings, buttons, and highlights.
                    </p>
                  </div>
                  <span className="text-[11px] text-text-tertiary bg-surface px-2.5 py-1 rounded-full">
                    {PROPOSAL_STYLES.find((s) => s.id === selectedStyleId)
                      ?.palettes.find((p) => p.id === selectedPaletteId)
                      ?.name ?? ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {(
                    PROPOSAL_STYLES.find((s) => s.id === selectedStyleId)
                      ?.palettes ?? []
                  ).map((pal) => {
                    const isActivePalette = selectedPaletteId === pal.id;
                    return (
                      <button
                        key={pal.id}
                        onClick={() => setSelectedPaletteId(pal.id)}
                        title={pal.name}
                        className={`relative w-10 h-10 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                          isActivePalette
                            ? "border-primary scale-110"
                            : "border-transparent hover:scale-105"
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full"
                          style={{ backgroundColor: pal.accent }}
                        />
                        {isActivePalette && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check
                              className="w-3.5 h-3.5"
                              style={{
                                color: isLightColor(pal.accent)
                                  ? "#000"
                                  : "#fff",
                              }}
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button onClick={handleApplyDesign} className="w-full" size="lg">
                Use this design
              </Button>
            </motion.div>
          )}

          {/* ── STEP 3: Edit Proposal ── */}
          {step === "editor" && (
            <motion.div
              key="step-editor"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)]">
                {/* Left panel: editor */}
                <div className="w-full lg:w-[55%] border-r border-border-light overflow-y-auto p-6 space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => setStep("design")}
                      className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-foreground transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h2 className="text-[16px] font-bold text-foreground">
                      Edit Proposal
                    </h2>
                  </div>

                  <FormField label="Title">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Website Redesign Proposal"
                      className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                    />
                  </FormField>

                  <FormField label="Client">
                    <SelectField
                      options={clientOptions}
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                    />
                  </FormField>

                  <FormField label="Valid Until">
                    <DateField
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                    />
                  </FormField>

                  {/* Sections Builder */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-foreground">
                        Sections
                      </label>
                      <div className="relative">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setAddMenuOpen(!addMenuOpen)}
                        >
                          <Plus className="w-4 h-4" /> Add Section
                        </Button>
                        {addMenuOpen && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-card-bg border border-border-light rounded-xl shadow-lg z-10 py-1 overflow-hidden">
                            {SECTION_TYPES.map((st) => (
                              <button
                                key={st.value}
                                onClick={() => addSection(st.value)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface/50 cursor-pointer transition-colors"
                              >
                                <st.icon className="w-4 h-4 text-text-secondary" />
                                {st.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {sections.length === 0 && (
                      <div className="text-center py-8 border border-dashed border-border-light rounded-xl">
                        <p className="text-sm text-text-tertiary">
                          No sections yet. Add a section to get started.
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      {sections.map((section, index) => (
                        <div
                          key={section.id}
                          className="bg-surface/30 border border-border-light rounded-xl p-4"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                                TYPE_BADGE_COLORS[section.type] ??
                                "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {section.type}
                            </span>

                            {section.type !== "divider" &&
                              section.type !== "signature" && (
                                <input
                                  type="text"
                                  value={section.title ?? ""}
                                  onChange={(e) =>
                                    updateSection(section.id, {
                                      title: e.target.value,
                                    })
                                  }
                                  placeholder="Section title (optional)"
                                  className="flex-1 px-2 py-1 bg-transparent border-b border-border-light text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:border-primary/30"
                                />
                              )}

                            <div className="flex items-center gap-0.5 ml-auto">
                              <button
                                onClick={() => moveSection(index, "up")}
                                disabled={index === 0}
                                className="p-1 rounded hover:bg-surface text-text-secondary disabled:opacity-30 cursor-pointer disabled:cursor-default"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => moveSection(index, "down")}
                                disabled={index === sections.length - 1}
                                className="p-1 rounded hover:bg-surface text-text-secondary disabled:opacity-30 cursor-pointer disabled:cursor-default"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeSection(section.id)}
                                className="p-1 rounded hover:bg-red-50 text-text-secondary hover:text-red-500 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {renderSectionContent(section)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <FormField label="Notes">
                    <TextArea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Internal notes (not visible to client)..."
                    />
                  </FormField>

                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-border-light pb-6">
                    <Button variant="ghost" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button loading={saving} onClick={handleSubmit}>
                      Create Proposal
                    </Button>
                  </div>
                </div>

                {/* Right panel: live preview */}
                <div className="hidden lg:block lg:w-[45%] overflow-y-auto bg-surface/30 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[13px] font-semibold text-text-secondary uppercase tracking-wide">
                      Live Preview
                    </h3>
                    <span className="text-[11px] text-text-tertiary bg-surface px-2 py-0.5 rounded-full">
                      {activeStyle.name}
                    </span>
                  </div>
                  <LiveProposalPreview
                    title={title}
                    clientName={selectedClientName}
                    businessName={businessName || ""}
                    sections={sections}
                    styleId={selectedStyleId}
                    paletteId={selectedPaletteId}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Utility ──

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length < 6) return true;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}
