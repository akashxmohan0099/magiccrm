"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Camera,
  Building2,
  Palette,
  MapPin,
  Check,
  Sparkles,
  X,
  ImagePlus,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useSettingsStore } from "@/store/settings";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import type { WorkspaceSettings } from "@/types/models";

// --- Preset brand colors ---
const PRESET_COLORS = [
  { id: "emerald", label: "Emerald", hex: "#34D399" },
  { id: "blue", label: "Blue", hex: "#3B82F6" },
  { id: "violet", label: "Violet", hex: "#8B5CF6" },
  { id: "rose", label: "Rose", hex: "#F43F5E" },
  { id: "amber", label: "Amber", hex: "#F59E0B" },
  { id: "teal", label: "Teal", hex: "#14B8A6" },
  { id: "pink", label: "Pink", hex: "#EC4899" },
  { id: "slate", label: "Slate", hex: "#475569" },
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
function LogoUpload({
  logoUrl,
  onLogoChange,
  onClearLogo,
  brandColor,
}: {
  logoUrl?: string;
  onLogoChange: (base64: string) => void;
  onClearLogo: () => void;
  brandColor: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onLogoChange(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    },
    [onLogoChange]
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

  return (
    <div className="flex items-center gap-6">
      <div
        className="relative group cursor-pointer"
        onClick={() => fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
      >
        <div
          className={`w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-200 overflow-hidden ${
            isDragging
              ? "border-foreground bg-surface scale-105"
              : logoUrl
              ? "border-transparent"
              : "border-border-warm hover:border-foreground/30 bg-surface hover:bg-surface/80"
          }`}
        >
          {logoUrl ? (
            <>
              {/* User-uploaded logo URL — domain unknown at build time, so
                  next/image would need wildcard remotePatterns. Plain <img>
                  for the avatar-sized preview is fine here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="Business logo" className="w-full h-full object-cover" />
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

        {logoUrl && (
          <button
            onClick={(e) => { e.stopPropagation(); onClearLogo(); }}
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
          {logoUrl ? "Logo uploaded" : "Upload your logo"}
        </p>
        <p className="text-xs text-text-tertiary mt-0.5">
          Drag & drop or click to browse. PNG, JPG up to 5MB.
        </p>
        {logoUrl && (
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
function ColorPicker({
  brandColor,
  onColorChange,
}: {
  brandColor: string;
  onColorChange: (hex: string) => void;
}) {
  const isPreset = PRESET_COLORS.some((c) => c.hex === brandColor);
  const [customHex, setCustomHex] = useState(() => (isPreset ? "" : brandColor));
  const [customMode, setCustomMode] = useState(() => !isPreset);
  const showCustom = customMode || !isPreset;
  const customHexValue = customHex || (!isPreset ? brandColor : "");

  const handleCustomSubmit = () => {
    let hex = customHexValue.trim();
    if (!hex.startsWith("#")) hex = "#" + hex;
    if (isValidHex(hex)) {
      onColorChange(hex);
      setCustomHex(hex);
      setCustomMode(true);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-text-secondary mb-3">Choose a preset</p>
        <div className="flex flex-wrap gap-3">
          {PRESET_COLORS.map((color) => {
            const isSelected = brandColor === color.hex;
            return (
              <button
                key={color.id}
                onClick={() => {
                  onColorChange(color.hex);
                  setCustomMode(false);
                  setCustomHex("");
                }}
                className="group relative cursor-pointer"
                title={color.label}
              >
                <div
                  className={`w-9 h-9 rounded-full transition-all duration-200 flex items-center justify-center ${
                    isSelected ? "ring-2 ring-offset-2 ring-offset-card-bg scale-110" : "hover:scale-110"
                  }`}
                  style={{
                    backgroundColor: color.hex,
                    boxShadow: isSelected ? `0 0 0 2px var(--card-bg), 0 0 0 4px ${color.hex}` : undefined,
                  }}
                >
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
                        <Check className="w-4 h-4" style={{ color: getContrastColor(color.hex) }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {color.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {!showCustom ? (
          <button
            onClick={() => { setCustomMode(true); if (!customHexValue) setCustomHex(brandColor); }}
            className="text-xs font-medium text-text-tertiary hover:text-foreground transition-colors cursor-pointer"
          >
            + Custom color
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-full border border-border-light flex-shrink-0"
              style={{
                backgroundColor:
                  isValidHex(customHexValue) || isValidHex("#" + customHexValue)
                    ? customHexValue.startsWith("#") ? customHexValue : "#" + customHexValue
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
              onClick={() => { setCustomMode(false); setCustomHex(""); if (!isPreset) onColorChange(PRESET_COLORS[0].hex); }}
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
function BrandPreview({ brandColor }: { brandColor: string }) {
  const contrastColor = getContrastColor(brandColor);

  return (
    <div className="border border-border-light rounded-xl p-5 bg-surface/50">
      <p className="text-xs font-medium text-text-tertiary mb-3 flex items-center gap-1.5">
        <Sparkles className="w-3 h-3" />
        Live preview
      </p>
      <div className="space-y-3">
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
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{ backgroundColor: brandColor + "18", color: brandColor }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: brandColor }} />
            Active
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{ backgroundColor: brandColor + "18", color: brandColor }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: brandColor }} />
            Confirmed
          </span>
        </div>
        <p className="text-sm font-bold tracking-tight" style={{ color: brandColor }}>
          Dashboard Heading
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Appearance Section
// ============================================================
function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: "light" as const, label: "Light", icon: Sun, desc: "Clean and bright" },
    { value: "dark" as const, label: "Dark", icon: Moon, desc: "Easy on the eyes" },
    { value: "system" as const, label: "System", icon: Monitor, desc: "Match your device" },
  ];

  return (
    <SettingsSection icon={Sun} title="Appearance" description="Choose your preferred theme" delay={0.15}>
      <div className="grid grid-cols-3 gap-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          const active = theme === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                active
                  ? "border-foreground bg-surface shadow-sm"
                  : "border-border-light hover:border-foreground/20"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-foreground" : "text-text-secondary"}`} />
              <span className={`text-[13px] font-medium ${active ? "text-foreground" : "text-text-secondary"}`}>{opt.label}</span>
              <span className="text-[11px] text-text-tertiary">{opt.desc}</span>
            </button>
          );
        })}
      </div>
    </SettingsSection>
  );
}

// ============================================================
// Main GeneralSettings
// ============================================================
export function GeneralSettings() {
  const { settings, updateSettings } = useSettingsStore();
  const { workspaceId } = useAuth();
  return (
    <GeneralSettingsContent
      key={`${settings?.workspaceId ?? "workspace"}:${settings?.updatedAt ?? "empty"}`}
      settings={settings}
      updateSettings={updateSettings}
      workspaceId={workspaceId ?? undefined}
    />
  );
}

function GeneralSettingsContent({
  settings,
  updateSettings,
  workspaceId,
}: {
  settings: WorkspaceSettings | null;
  updateSettings: (data: Partial<WorkspaceSettings>, workspaceId?: string) => void;
  workspaceId?: string;
}) {
  const brandColor = settings?.branding?.primaryColor || "#34D399";
  const [form, setForm] = useState(() => ({
    businessName: settings?.businessName || "",
    contactEmail: settings?.contactEmail || "",
    contactPhone: settings?.contactPhone || "",
    address: settings?.address || "",
  }));
  const [saved, setSaved] = useState(false);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (saved) setSaved(false);
  };

  const handleSave = () => {
    updateSettings(
      {
        businessName: form.businessName.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        address: form.address.trim(),
      },
      workspaceId
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleColorChange = (hex: string) => {
    updateSettings(
      { branding: { ...settings?.branding, primaryColor: hex } },
      workspaceId
    );
  };

  const handleLogoChange = (base64: string) => {
    updateSettings(
      { branding: { ...settings?.branding, logo: base64 } },
      workspaceId
    );
  };

  const handleClearLogo = () => {
    updateSettings(
      { branding: { ...settings?.branding, logo: undefined } },
      workspaceId
    );
  };

  const inputClass =
    "w-full px-4 py-3 bg-card-bg border border-border-light rounded-xl text-[15px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground transition-all";

  return (
    <div className="max-w-2xl space-y-5">
      {/* Hero banner */}
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
          <h2 className="text-xl font-bold text-foreground tracking-tight">Brand & Settings</h2>
          <p className="text-sm text-text-secondary mt-1">Make your workspace feel uniquely yours</p>
        </div>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-[0.07]" style={{ backgroundColor: brandColor }} />
        <div className="absolute -bottom-4 -right-16 w-24 h-24 rounded-full opacity-[0.05]" style={{ backgroundColor: brandColor }} />
      </motion.div>

      {/* Brand Identity Section */}
      <SettingsSection icon={Building2} title="Brand Identity" description="Your logo, name, and contact info" delay={0.05}>
        <div className="space-y-6">
          <LogoUpload
            logoUrl={settings?.branding?.logo || settings?.logoUrl}
            onLogoChange={handleLogoChange}
            onClearLogo={handleClearLogo}
            brandColor={brandColor}
          />
          <div className="border-t border-border-light" />
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">Business Name</label>
            <input
              type="text"
              value={form.businessName}
              onChange={(e) => update("businessName", e.target.value)}
              placeholder="Your business name"
              className="w-full px-0 py-2 bg-transparent border-none text-xl font-bold text-foreground tracking-tight placeholder:text-text-tertiary/50 placeholder:font-normal focus:outline-none focus:ring-0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">Contact Email</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => update("contactEmail", e.target.value)}
              placeholder="hello@yourbusiness.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">Contact Phone</label>
            <input
              type="tel"
              value={form.contactPhone}
              onChange={(e) => update("contactPhone", e.target.value)}
              placeholder="+1 (555) 123-4567"
              className={inputClass}
            />
          </div>
        </div>
      </SettingsSection>

      {/* Colors Section */}
      <SettingsSection icon={Palette} title="Brand Color" description="Choose a color that represents your brand" delay={0.1}>
        <div className="space-y-6">
          <ColorPicker brandColor={brandColor} onColorChange={handleColorChange} />
          <div className="border-t border-border-light" />
          <BrandPreview brandColor={brandColor} />
        </div>
      </SettingsSection>

      {/* Appearance Section */}
      <AppearanceSection />

      {/* Business Details Section */}
      <SettingsSection icon={MapPin} title="Business Address" description="Your business location" delay={0.18}>
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-2">
            <MapPin className="w-3 h-3" />
            Address
          </label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="123 Main St, City, State"
            className={inputClass}
          />
        </div>
      </SettingsSection>

      {/* Save Bar */}
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
