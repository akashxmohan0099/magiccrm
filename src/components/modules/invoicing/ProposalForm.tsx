"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, Type, Table, FileText, PenTool, Minus, LayoutTemplate, ArrowRight, ArrowLeft, Sparkles, Check, Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProposalsStore } from "@/store/proposals";
import { useClientsStore } from "@/store/clients";
import { useOnboardingStore } from "@/store/onboarding";
import { useAuth } from "@/hooks/useAuth";
import { Proposal, ProposalSection } from "@/types/models";
import { generateId } from "@/lib/id";
import { PROPOSAL_STYLES, getProposalStyle } from "@/lib/proposal-styles";
import type { ProposalDesignStyle } from "@/lib/proposal-styles";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { DateField } from "@/components/ui/DateField";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import { LineItemEditor } from "@/components/ui/LineItemEditor";

interface ProposalFormProps {
  open: boolean;
  onClose: () => void;
  proposal?: Proposal;
}

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

// ── Built-in proposal templates ──

const BUILT_IN_TEMPLATES: { name: string; description: string; icon: string; sections: Omit<ProposalSection, "id">[] }[] = [
  {
    name: "Service Proposal",
    description: "Standard proposal with intro, pricing, terms, and signature.",
    icon: "service",
    sections: [
      { type: "text", title: "About Us", content: "Thank you for considering us for your project. We are excited to work with you and deliver exceptional results.", order: 0 },
      { type: "text", title: "Scope of Work", content: "Below is a summary of the services we will provide:\n\n- [Describe service 1]\n- [Describe service 2]\n- [Describe service 3]", order: 1 },
      { type: "pricing-table", title: "Pricing", lineItems: [{ id: "tpl-1", description: "Service package", quantity: 1, unitPrice: 0 }], order: 2 },
      { type: "text", title: "Timeline", content: "Estimated project timeline: [X weeks/months]\n\nKey milestones:\n- Week 1: Kickoff & discovery\n- Week 2-3: Delivery\n- Week 4: Review & refinement", order: 3 },
      { type: "terms", title: "Terms & Conditions", content: "- Payment: 50% deposit upon acceptance, balance on completion\n- Validity: This proposal is valid for 30 days\n- Revisions: [X] rounds of revisions included", order: 4 },
      { type: "signature", order: 5 },
    ],
  },
  {
    name: "Project Quote",
    description: "Pricing-focused with itemized breakdown and deposit terms.",
    icon: "quote",
    sections: [
      { type: "text", title: "Project Overview", content: "We are pleased to provide this quote for your upcoming project.", order: 0 },
      { type: "pricing-table", title: "Itemized Pricing", lineItems: [{ id: "tpl-2", description: "Item 1", quantity: 1, unitPrice: 0 }, { id: "tpl-3", description: "Item 2", quantity: 1, unitPrice: 0 }], order: 1 },
      { type: "terms", title: "Payment Terms", content: "- 50% deposit required to secure your booking\n- Balance due upon completion\n- Late payments subject to a 5% surcharge", order: 2 },
      { type: "signature", order: 3 },
    ],
  },
  {
    name: "Event Package",
    description: "Perfect for weddings, events, and experience-based services.",
    icon: "event",
    sections: [
      { type: "text", title: "Welcome", content: "We are thrilled to be part of your special day! Here is what we have in store for you.", order: 0 },
      { type: "text", title: "What's Included", content: "Your package includes:\n\n- [Package item 1]\n- [Package item 2]\n- [Package item 3]\n- [Package item 4]", order: 1 },
      { type: "pricing-table", title: "Package Pricing", lineItems: [{ id: "tpl-4", description: "Package", quantity: 1, unitPrice: 0 }], order: 2 },
      { type: "text", title: "How It Works", content: "1. Confirm your booking with a signed proposal and deposit\n2. We will schedule a consultation to finalize details\n3. On the day, we handle everything\n4. Deliverables within [X] days", order: 3 },
      { type: "terms", title: "Terms", content: "- Non-refundable deposit of 30% to secure your date\n- Balance due 14 days before the event\n- Cancellation policy: 30 days notice required for full refund (less deposit)", order: 4 },
      { type: "signature", order: 5 },
    ],
  },
  {
    name: "Retainer Agreement",
    description: "For ongoing services with monthly billing.",
    icon: "retainer",
    sections: [
      { type: "text", title: "Engagement Overview", content: "This retainer agreement covers ongoing services as outlined below.", order: 0 },
      { type: "text", title: "Services Included", content: "Monthly retainer includes:\n\n- [X] hours of service per month\n- [Describe deliverable 1]\n- [Describe deliverable 2]\n- Priority response within 24 hours", order: 1 },
      { type: "pricing-table", title: "Monthly Fee", lineItems: [{ id: "tpl-5", description: "Monthly retainer", quantity: 1, unitPrice: 0 }], order: 2 },
      { type: "terms", title: "Agreement Terms", content: "- Billing: Monthly, due on the 1st\n- Minimum commitment: 3 months\n- Unused hours do not roll over\n- Either party may terminate with 30 days written notice", order: 3 },
      { type: "signature", order: 4 },
    ],
  },
  {
    name: "Blank Proposal",
    description: "Start from scratch with an empty canvas.",
    icon: "blank",
    sections: [],
  },
];

const STYLE_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "minimal", label: "Minimal" },
  { value: "modern", label: "Modern" },
  { value: "bold", label: "Bold" },
  { value: "warm", label: "Warm" },
  { value: "elegant", label: "Elegant" },
] as const;

// ── Mini-preview component for a design style ──

function StyleMiniPreview({ style, accentOverride }: { style: ProposalDesignStyle; accentOverride?: string }) {
  const accent = accentOverride || style.accent;
  return (
    <div
      className="w-full rounded-lg overflow-hidden border"
      style={{
        backgroundColor: style.bg,
        borderColor: style.border,
        minHeight: 160,
        fontFamily: style.fontFamily,
      }}
    >
      {/* Header bar */}
      <div style={{ backgroundColor: style.headerBg, height: 32 }} />

      {/* Body content simulation */}
      <div className="p-3 space-y-2.5">
        {/* Text lines + accent button row */}
        <div className="flex items-center gap-2">
          <div className="flex-1 space-y-1.5">
            <div
              className="rounded-sm"
              style={{ backgroundColor: style.muted, opacity: 0.35, height: 6, width: "80%" }}
            />
            <div
              className="rounded-sm"
              style={{ backgroundColor: style.muted, opacity: 0.25, height: 6, width: "60%" }}
            />
          </div>
          <div
            className="rounded"
            style={{ backgroundColor: accent, height: 16, width: 36, flexShrink: 0 }}
          />
        </div>

        {/* Short text line */}
        <div
          className="rounded-sm"
          style={{ backgroundColor: style.muted, opacity: 0.2, height: 5, width: "45%" }}
        />

        {/* Divider */}
        <div style={{ backgroundColor: style.border, height: 1 }} />

        {/* Pricing row simulation */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div
              className="rounded-sm"
              style={{ backgroundColor: style.muted, opacity: 0.3, height: 5, width: 50 }}
            />
            <div
              className="rounded-sm"
              style={{ backgroundColor: style.muted, opacity: 0.2, height: 5, width: 36 }}
            />
          </div>
          <div
            className="rounded"
            style={{ backgroundColor: accent, height: 14, width: 48, opacity: 0.9 }}
          />
        </div>

        {/* Signature area */}
        <div className="flex items-center justify-center pt-1">
          <div
            className="rounded-sm"
            style={{ backgroundColor: style.muted, opacity: 0.15, height: 4, width: "55%" }}
          />
        </div>
      </div>
    </div>
  );
}

export function ProposalForm({ open, onClose, proposal }: ProposalFormProps) {
  const { addProposal, updateProposal, templates: savedTemplates } = useProposalsStore();
  const { clients } = useClientsStore();
  const businessName = useOnboardingStore((s) => s.businessContext.businessName);
  const { workspaceId } = useAuth();

  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  // ── Template picker state ──
  const [templateStep, setTemplateStep] = useState<"type" | "design" | null>("type");
  const [selectedTemplateData, setSelectedTemplateData] = useState<typeof BUILT_IN_TEMPLATES[number] | null>(null);
  const [selectedStyleId, setSelectedStyleId] = useState("classic");
  const [selectedPaletteId, setSelectedPaletteId] = useState("slate");
  const [styleFilter, setStyleFilter] = useState<string>("all");

  // Branding design state
  const [brandingDesignStyle, setBrandingDesignStyle] = useState<string | undefined>(undefined);
  const [brandingPalette, setBrandingPalette] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (open) {
      if (proposal) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTitle(proposal.title);
        setClientId(proposal.clientId ?? "");
        setValidUntil(proposal.validUntil ?? "");
        setSections([...proposal.sections]);
        setNotes(proposal.notes);
        setTemplateStep(null);
        setBrandingDesignStyle(proposal.branding?.designStyle);
        setBrandingPalette(proposal.branding?.palette);
      } else {
        setTitle("");
        setClientId("");
        setValidUntil("");
        setSections([]);
        setNotes("");
        setTemplateStep("type");
        setSelectedTemplateData(null);
        setSelectedStyleId("classic");
        setSelectedPaletteId("slate");
        setStyleFilter("all");
        setBrandingDesignStyle(undefined);
        setBrandingPalette(undefined);
      }
      setAddMenuOpen(false);
    }
  }, [open, proposal]);

  // When style changes, reset palette to the first palette of that style
  useEffect(() => {
    const style = PROPOSAL_STYLES.find((s) => s.id === selectedStyleId);
    if (style && style.palettes.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPaletteId(style.palettes[0].id);
    }
  }, [selectedStyleId]);

  const _activeStyle = useMemo(() => getProposalStyle(selectedStyleId, selectedPaletteId), [selectedStyleId, selectedPaletteId]);

  const filteredStyles = useMemo(() => {
    if (styleFilter === "all") return PROPOSAL_STYLES;
    return PROPOSAL_STYLES.filter((s) => s.category === styleFilter);
  }, [styleFilter]);

  const handleSelectTemplate = (tpl: typeof BUILT_IN_TEMPLATES[number]) => {
    if (tpl.name === "Blank Proposal") {
      // Skip design selection, go straight to form
      setTitle("");
      setSections([]);
      setSelectedTemplateData(null);
      setTemplateStep(null);
      return;
    }
    setSelectedTemplateData(tpl);
    setTemplateStep("design");
  };

  const handleApplyDesign = () => {
    if (selectedTemplateData) {
      setTitle(selectedTemplateData.name);
      setSections(
        selectedTemplateData.sections.map((s) => ({
          ...s,
          id: generateId(),
          content: s.content?.replace(/\{business_name\}/g, businessName || "Your Business"),
          lineItems: s.lineItems?.map((li) => ({ ...li, id: generateId() })),
        }))
      );
    }
    setBrandingDesignStyle(selectedStyleId);
    setBrandingPalette(selectedPaletteId);
    setTemplateStep(null);
  };

  const clientOptions = [
    { value: "", label: "Select a client..." },
    ...clients.map((c) => ({ value: c.id, label: c.name })),
  ];

  const addSection = (type: AddableSectionType) => {
    const newSection: ProposalSection = {
      id: generateId(),
      type,
      title: "",
      content: type === "signature" ? "" : "",
      lineItems: type === "pricing-table" ? [{ id: generateId(), description: "", quantity: 1, unitPrice: 0 }] : undefined,
      order: sections.length,
    };
    setSections([...sections, newSection]);
    setAddMenuOpen(false);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sections.length - 1) return;
    const newSections = [...sections];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]];
    setSections(newSections.map((s, i) => ({ ...s, order: i })));
  };

  const updateSection = (id: string, updates: Partial<ProposalSection>) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleSubmit = () => {
    if (saving) return;
    if (!title.trim()) return;
    setSaving(true);

    const clientName = clients.find((c) => c.id === clientId)?.name;

    if (proposal) {
      updateProposal(proposal.id, {
        title,
        clientId: clientId || undefined,
        clientName,
        validUntil: validUntil || undefined,
        sections,
        notes,
        branding: {
          ...proposal.branding,
          designStyle: brandingDesignStyle,
          palette: brandingPalette,
        },
      }, workspaceId ?? undefined);
    } else {
      addProposal({
        title,
        clientId: clientId || undefined,
        clientName,
        sections,
        status: "draft",
        validUntil: validUntil || undefined,
        branding: {
          designStyle: brandingDesignStyle,
          palette: brandingPalette,
        },
        notes,
      }, workspaceId ?? undefined);
    }

    onClose();
    setSaving(false);
  };

  const renderSectionContent = (section: ProposalSection) => {
    switch (section.type) {
      case "text":
        return (
          <TextArea
            value={section.content ?? ""}
            onChange={(e) => updateSection(section.id, { content: e.target.value })}
            placeholder="Enter text content..."
          />
        );

      case "pricing-table":
        return (
          <LineItemEditor
            items={section.lineItems ?? []}
            onChange={(items) => updateSection(section.id, { lineItems: items })}
          />
        );

      case "terms":
        return (
          <TextArea
            value={section.content ?? ""}
            onChange={(e) => updateSection(section.id, { content: e.target.value })}
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
            onChange={(e) => updateSection(section.id, { content: e.target.value })}
            placeholder="Enter content..."
          />
        );
    }
  };

  return (
    <SlideOver open={open} onClose={onClose} title={proposal ? "Edit Proposal" : "New Proposal"} wide>
      <div className="space-y-1">
        {/* ── Phase 1: Template Type Selection ── */}
        <AnimatePresence mode="wait">
          {templateStep === "type" && !proposal && (
            <motion.div
              key="template-type"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="mb-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <LayoutTemplate className="w-4 h-4 text-text-secondary" />
                <h3 className="text-sm font-semibold text-foreground">Start from a template</h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {BUILT_IN_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.name}
                    onClick={() => handleSelectTemplate(tpl)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border-light hover:border-primary/30 hover:bg-primary/5 transition-all text-left cursor-pointer group"
                  >
                    <div className="w-9 h-9 bg-surface rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                      {tpl.icon === "blank" ? (
                        <Plus className="w-4 h-4 text-text-secondary group-hover:text-primary" />
                      ) : (
                        <FileText className="w-4 h-4 text-text-secondary group-hover:text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground">{tpl.name}</p>
                      <p className="text-[11px] text-text-tertiary">{tpl.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-primary flex-shrink-0 transition-colors" />
                  </button>
                ))}

                {/* Saved templates */}
                {savedTemplates.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mt-3 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-text-tertiary" />
                      <span className="text-[11px] text-text-tertiary font-medium uppercase tracking-wider">Your Templates</span>
                    </div>
                    {savedTemplates.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => {
                          setSelectedTemplateData({
                            name: tpl.name,
                            description: tpl.description,
                            icon: "saved",
                            sections: tpl.sections.map(({ id: _id, ...rest }) => rest),
                          });
                          setTemplateStep("design");
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border-light hover:border-primary/30 hover:bg-primary/5 transition-all text-left cursor-pointer group"
                      >
                        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <LayoutTemplate className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-foreground">{tpl.name}</p>
                          <p className="text-[11px] text-text-tertiary">{tpl.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-primary flex-shrink-0" />
                      </button>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Phase 2: Design Style Selection ── */}
          {templateStep === "design" && !proposal && (
            <motion.div
              key="template-design"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="mb-6"
            >
              {/* Header with back button */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setTemplateStep("type")}
                  className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-foreground transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <Palette className="w-4 h-4 text-text-secondary" />
                <h3 className="text-sm font-semibold text-foreground">Choose a design</h3>
                {selectedTemplateData && (
                  <span className="ml-auto text-[11px] text-text-tertiary bg-surface px-2 py-0.5 rounded-full">
                    {selectedTemplateData.name}
                  </span>
                )}
              </div>

              {/* Category filter pills */}
              <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                {STYLE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setStyleFilter(cat.value)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                      styleFilter === cat.value
                        ? "bg-primary text-white"
                        : "bg-surface text-text-secondary hover:bg-surface/80 hover:text-foreground"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Style grid - 2 columns */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {filteredStyles.map((style) => {
                  const isActive = selectedStyleId === style.id;
                  const previewAccent = isActive
                    ? (style.palettes.find((p) => p.id === selectedPaletteId)?.accent || style.accent)
                    : style.accent;

                  return (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyleId(style.id)}
                      className={`rounded-xl border-2 overflow-hidden transition-all text-left cursor-pointer ${
                        isActive
                          ? "border-primary shadow-[0_0_0_2px_rgba(var(--primary-rgb,99,102,241),0.15)]"
                          : "border-border-light hover:border-primary/20"
                      }`}
                    >
                      {/* Mini-preview */}
                      <div className="relative">
                        <StyleMiniPreview style={style} accentOverride={previewAccent} />
                        {isActive && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      {/* Style info */}
                      <div className="px-3 py-2.5 bg-card-bg">
                        <p className="text-xs font-semibold text-foreground">{style.name}</p>
                        <p className="text-[10px] text-text-tertiary">{style.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Palette color picker */}
              <div className="mb-5">
                <p className="text-[11px] text-text-secondary font-medium mb-2">Accent colour</p>
                <div className="flex items-center gap-2">
                  {(PROPOSAL_STYLES.find((s) => s.id === selectedStyleId)?.palettes ?? []).map((pal) => {
                    const isActivePalette = selectedPaletteId === pal.id;
                    return (
                      <button
                        key={pal.id}
                        onClick={() => setSelectedPaletteId(pal.id)}
                        title={pal.name}
                        className={`relative w-8 h-8 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                          isActivePalette
                            ? "border-primary scale-110"
                            : "border-transparent hover:scale-105"
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: pal.accent }}
                        />
                        {isActivePalette && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="w-3 h-3" style={{ color: isLightColor(pal.accent) ? "#000" : "#fff" }} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                  <span className="text-[11px] text-text-tertiary ml-1">
                    {PROPOSAL_STYLES.find((s) => s.id === selectedStyleId)?.palettes.find((p) => p.id === selectedPaletteId)?.name ?? ""}
                  </span>
                </div>
              </div>

              {/* Use this design button */}
              <Button onClick={handleApplyDesign} className="w-full">
                Use this design
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Form editor (shown when templateStep is null) ── */}
        {templateStep === null && (
          <>
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
              <DateField value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </FormField>

            {/* Sections Builder */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-foreground">Sections</label>
                <div className="relative">
                  <Button variant="secondary" size="sm" onClick={() => setAddMenuOpen(!addMenuOpen)}>
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
                  <p className="text-sm text-text-tertiary">No sections yet. Add a section to get started.</p>
                </div>
              )}

              <div className="space-y-3">
                {sections.map((section, index) => (
                  <div
                    key={section.id}
                    className="bg-surface/30 border border-border-light rounded-xl p-4"
                  >
                    {/* Section header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${TYPE_BADGE_COLORS[section.type] ?? "bg-gray-100 text-gray-600"}`}>
                        {section.type}
                      </span>

                      {section.type !== "divider" && section.type !== "signature" && (
                        <input
                          type="text"
                          value={section.title ?? ""}
                          onChange={(e) => updateSection(section.id, { title: e.target.value })}
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

                    {/* Section content */}
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

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border-light">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button loading={saving} onClick={handleSubmit}>
                {proposal ? "Update Proposal" : "Create Proposal"}
              </Button>
            </div>
          </>
        )}
      </div>
    </SlideOver>
  );
}

// Utility: determine if a hex color is "light" for contrast purposes
function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}
