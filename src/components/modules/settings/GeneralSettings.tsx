"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Camera,
  Building2,
  Palette,
  MapPin,
  Briefcase,
  Check,
  Sparkles,
  X,
  ImagePlus,
  FileText,
} from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import {
  useBrandSettingsStore,
  PRESET_COLORS,
} from "@/store/brand-settings";
import { INVOICE_TEMPLATES } from "@/lib/invoice-templates";
import { INDUSTRIES } from "@/types/onboarding";
import { SelectField } from "@/components/ui/SelectField";
import { Button } from "@/components/ui/Button";

const INDUSTRY_OPTIONS = [
  { value: "", label: "Select industry..." },
  ...INDUSTRIES.map((i) => ({ value: i, label: i })),
];

// --- Hex validation ---
function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 52, g: 211, b: 153 };
}

function getContrastColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#111111" : "#FFFFFF";
}

// ============================================================
// Section wrapper
// ============================================================
function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className="bg-card-bg border border-border-light rounded-2xl p-6 sm:p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center">
          <Icon className="w-[18px] h-[18px] text-text-secondary" />
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

// ============================================================
// Logo Upload
// ============================================================
function LogoUpload() {
  const { logoBase64, setLogoBase64, clearLogo } = useBrandSettingsStore();
  const { brandColor } = useBrandSettingsStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 5 * 1024 * 1024) return; // 5MB limit
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setLogoBase64(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    },
    [setLogoBase64]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="flex items-center gap-6">
      {/* Upload zone */}
      <div
        className="relative group cursor-pointer"
        onClick={() => fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div
          className={`w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-200 overflow-hidden ${
            isDragging
              ? "border-foreground bg-surface scale-105"
              : logoBase64
              ? "border-transparent"
              : "border-border-warm hover:border-foreground/30 bg-surface hover:bg-surface/80"
          }`}
        >
          {logoBase64 ? (
            <>
              <img
                src={logoBase64}
                alt="Business logo"
                className="w-full h-full object-cover"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <ImagePlus className="w-6 h-6 text-text-tertiary" />
            </div>
          )}
        </div>

        {/* Remove button */}
        {logoBase64 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearLogo();
            }}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-card-bg border border-border-light shadow-sm flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3 text-text-tertiary hover:text-red-500" />
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-foreground">
          {logoBase64 ? "Logo uploaded" : "Upload your logo"}
        </p>
        <p className="text-xs text-text-tertiary mt-0.5">
          Drag & drop or click to browse. PNG, JPG up to 5MB.
        </p>
        {logoBase64 && (
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs font-medium mt-1.5 cursor-pointer transition-colors"
            style={{ color: brandColor }}
          >
            Change logo
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Color Picker
// ============================================================
function ColorPicker() {
  const { brandColor, setBrandColor } = useBrandSettingsStore();
  const isPreset = PRESET_COLORS.some((c) => c.hex === brandColor);
  const [customHex, setCustomHex] = useState(() => (isPreset ? "" : brandColor));
  const [customMode, setCustomMode] = useState(() => !isPreset);
  const showCustom = customMode || !isPreset;
  const customHexValue = customHex || (!isPreset ? brandColor : "");

  const handleCustomSubmit = () => {
    let hex = customHexValue.trim();
    if (!hex.startsWith("#")) hex = "#" + hex;
    if (isValidHex(hex)) {
      setBrandColor(hex);
      setCustomHex(hex);
      setCustomMode(true);
    }
  };

  return (
    <div className="space-y-5">
      {/* Preset swatches */}
      <div>
        <p className="text-xs font-medium text-text-secondary mb-3">
          Choose a preset
        </p>
        <div className="flex flex-wrap gap-3">
          {PRESET_COLORS.map((color) => {
            const isSelected = brandColor === color.hex;
            return (
              <button
                key={color.id}
                onClick={() => {
                  setBrandColor(color.hex);
                  setCustomMode(false);
                  setCustomHex("");
                }}
                className="group relative cursor-pointer"
                title={color.label}
              >
                <div
                  className={`w-9 h-9 rounded-full transition-all duration-200 flex items-center justify-center ${
                    isSelected
                      ? "ring-2 ring-offset-2 ring-offset-card-bg scale-110"
                      : "hover:scale-110"
                  }`}
                  style={{
                    backgroundColor: color.hex,
                    ...(isSelected ? { ringColor: color.hex } : {}),
                    boxShadow: isSelected
                      ? `0 0 0 2px var(--card-bg), 0 0 0 4px ${color.hex}`
                      : undefined,
                  }}
                >
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Check
                          className="w-4 h-4"
                          style={{ color: getContrastColor(color.hex) }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* Tooltip */}
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {color.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom color */}
      <div>
        {!showCustom ? (
          <button
            onClick={() => {
              setCustomMode(true);
              if (!customHexValue) setCustomHex(brandColor);
            }}
            className="text-xs font-medium text-text-tertiary hover:text-foreground transition-colors cursor-pointer"
          >
            + Custom color
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex items-center gap-2"
          >
            <div
              className="w-9 h-9 rounded-full border border-border-light flex-shrink-0"
              style={{
                backgroundColor:
                  isValidHex(customHexValue) || isValidHex("#" + customHexValue)
                    ? customHexValue.startsWith("#")
                      ? customHexValue
                      : "#" + customHexValue
                    : "#E5E5E5",
              }}
            />
            <input
              type="text"
              value={customHexValue}
              onChange={(e) => setCustomHex(e.target.value)}
              onBlur={handleCustomSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
              placeholder="#FF5733"
              className="w-28 px-3 py-2 bg-surface border border-border-light rounded-xl text-sm text-foreground font-mono placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
            <button
              onClick={() => {
                setCustomMode(false);
                setCustomHex("");
                if (!isPreset) setBrandColor(PRESET_COLORS[0].hex);
              }}
              className="text-xs text-text-tertiary hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Live Preview Card
// ============================================================
function BrandPreview() {
  const { brandColor } = useBrandSettingsStore();
  const contrastColor = getContrastColor(brandColor);

  return (
    <div className="border border-border-light rounded-xl p-5 bg-surface/50">
      <p className="text-xs font-medium text-text-tertiary mb-3 flex items-center gap-1.5">
        <Sparkles className="w-3 h-3" />
        Live preview
      </p>
      <div className="space-y-3">
        {/* Button preview */}
        <div className="flex items-center gap-3">
          <span
            className="px-5 py-2 rounded-full text-xs font-semibold transition-colors"
            style={{ backgroundColor: brandColor, color: contrastColor }}
          >
            Send Invoice
          </span>
          <span
            className="px-5 py-2 rounded-full text-xs font-semibold border transition-colors"
            style={{ borderColor: brandColor, color: brandColor }}
          >
            View Details
          </span>
        </div>

        {/* Badge preview */}
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{
              backgroundColor: brandColor + "18",
              color: brandColor,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: brandColor }}
            />
            Active
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{
              backgroundColor: brandColor + "18",
              color: brandColor,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: brandColor }}
            />
            Confirmed
          </span>
        </div>

        {/* Heading preview */}
        <p
          className="text-sm font-bold tracking-tight"
          style={{ color: brandColor }}
        >
          Dashboard Heading
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Invoice Template Picker
// ============================================================
function InvoiceTemplatePicker() {
  const { invoiceTemplate, setInvoiceTemplate, brandColor } = useBrandSettingsStore();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {INVOICE_TEMPLATES.map((t) => {
        const isSelected = invoiceTemplate === t.id;
        const previewAccent = t.id === "clean" || t.id === "bold" ? brandColor : t.preview.accentBg;
        const headerBg = t.id === "bold" ? brandColor : t.preview.headerBg;
        return (
          <button
            key={t.id}
            onClick={() => setInvoiceTemplate(t.id)}
            className={`group relative rounded-xl border-2 p-1 transition-all cursor-pointer ${
              isSelected
                ? "border-foreground shadow-sm"
                : "border-border-light hover:border-foreground/20"
            }`}
          >
            {/* Mini preview */}
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-white">
              {/* Header area */}
              <div
                className="h-[28%] flex items-center justify-between px-3"
                style={{ backgroundColor: headerBg }}
              >
                <div className="flex flex-col gap-1">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: 28,
                      backgroundColor: headerBg === "#111111" || headerBg === brandColor ? "#fff" : "#333",
                      opacity: 0.7,
                    }}
                  />
                  <div
                    className="h-1 rounded-full"
                    style={{
                      width: 18,
                      backgroundColor: headerBg === "#111111" || headerBg === brandColor ? "#fff" : "#999",
                      opacity: 0.4,
                    }}
                  />
                </div>
                <div
                  className="h-2.5 rounded"
                  style={{
                    width: 20,
                    backgroundColor: previewAccent,
                    opacity: headerBg === brandColor ? 0.3 : 0.8,
                  }}
                />
              </div>
              {/* Body lines */}
              <div className="px-3 pt-2 space-y-1.5">
                <div className="h-1 bg-gray-200 rounded-full w-full" />
                <div className="h-1 bg-gray-100 rounded-full w-3/4" />
                <div className="h-1 bg-gray-100 rounded-full w-5/6" />
                <div className="h-1 bg-gray-100 rounded-full w-2/3" />
                <div className="mt-2 h-1 rounded-full w-1/3 ml-auto" style={{ backgroundColor: previewAccent, opacity: 0.6 }} />
              </div>
            </div>
            {/* Label */}
            <div className="mt-2 mb-1 text-center">
              <p className={`text-xs font-medium ${isSelected ? "text-foreground" : "text-text-secondary"}`}>
                {t.name}
              </p>
              <p className="text-[10px] text-text-tertiary leading-tight">{t.description}</p>
            </div>
            {/* Selected check */}
            {isSelected && (
              <div
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: brandColor }}
              >
                <Check className="w-3 h-3" style={{ color: getContrastColor(brandColor) }} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Main GeneralSettings
// ============================================================
export function GeneralSettings() {
  const { businessContext, setBusinessContext } = useOnboardingStore();
  const { brandColor, tagline, setTagline } = useBrandSettingsStore();

  const [form, setForm] = useState({
    businessName: "",
    businessDescription: "",
    industry: "",
    location: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      businessName: businessContext.businessName,
      businessDescription: businessContext.businessDescription,
      industry: businessContext.industry,
      location: businessContext.location,
    });
  }, [businessContext]);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (saved) setSaved(false);
  };

  const handleSave = () => {
    setBusinessContext({
      businessName: form.businessName.trim(),
      businessDescription: form.businessDescription.trim(),
      industry: form.industry,
      location: form.location.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass =
    "w-full px-4 py-3 bg-card-bg border border-border-light rounded-xl text-[15px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground transition-all";

  return (
    <div className="max-w-2xl space-y-5">
      {/* ── Hero banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{
          background: `linear-gradient(135deg, ${brandColor}08 0%, ${brandColor}15 50%, ${brandColor}05 100%)`,
        }}
      >
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            Brand & Settings
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Make your workspace feel uniquely yours
          </p>
        </div>
        {/* Decorative circles */}
        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-[0.07]"
          style={{ backgroundColor: brandColor }}
        />
        <div
          className="absolute -bottom-4 -right-16 w-24 h-24 rounded-full opacity-[0.05]"
          style={{ backgroundColor: brandColor }}
        />
      </motion.div>

      {/* ── Brand Identity Section ── */}
      <SettingsSection
        icon={Building2}
        title="Brand Identity"
        description="Your logo, name, and tagline"
        delay={0.05}
      >
        <div className="space-y-6">
          {/* Logo */}
          <LogoUpload />

          {/* Divider */}
          <div className="border-t border-border-light" />

          {/* Business name — large heading style */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Business Name
            </label>
            <input
              type="text"
              value={form.businessName}
              onChange={(e) => update("businessName", e.target.value)}
              placeholder="Your business name"
              className="w-full px-0 py-2 bg-transparent border-none text-xl font-bold text-foreground tracking-tight placeholder:text-text-tertiary/50 placeholder:font-normal focus:outline-none focus:ring-0"
            />
          </div>

          {/* Tagline / description */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Tagline
            </label>
            <textarea
              value={form.businessDescription}
              onChange={(e) => update("businessDescription", e.target.value)}
              placeholder="A short description of what you do..."
              rows={2}
              className="w-full px-4 py-3 bg-surface/50 border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground transition-all resize-none"
            />
          </div>
        </div>
      </SettingsSection>

      {/* ── Colors Section ── */}
      <SettingsSection
        icon={Palette}
        title="Brand Color"
        description="Choose a color that represents your brand"
        delay={0.1}
      >
        <div className="space-y-6">
          <ColorPicker />

          {/* Divider */}
          <div className="border-t border-border-light" />

          {/* Live preview */}
          <BrandPreview />
        </div>
      </SettingsSection>

      {/* ── Invoice Template Section ── */}
      <SettingsSection
        icon={FileText}
        title="Invoice Template"
        description="Choose how your invoices and quotes look"
        delay={0.12}
      >
        <InvoiceTemplatePicker />
      </SettingsSection>

      {/* ── Business Details Section ── */}
      <SettingsSection
        icon={Briefcase}
        title="Business Details"
        description="Industry and location information"
        delay={0.18}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Industry */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Industry
            </label>
            <SelectField
              options={INDUSTRY_OPTIONS}
              value={form.industry}
              onChange={(e) => update("industry", e.target.value)}
            />
          </div>

          {/* Location */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-2">
              <MapPin className="w-3 h-3" />
              Location
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="City, State or Country"
              className={inputClass}
            />
          </div>
        </div>
      </SettingsSection>

      {/* ── Save Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex items-center gap-3 pt-2 pb-4"
      >
        <Button onClick={handleSave} size="md">
          <Save className="w-4 h-4 mr-1.5" />
          Save Changes
        </Button>
        <AnimatePresence>
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm font-medium flex items-center gap-1.5"
              style={{ color: brandColor }}
            >
              <Check className="w-4 h-4" />
              Saved!
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
