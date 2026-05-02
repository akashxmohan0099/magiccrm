"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Building2,
  Palette,
  MapPin,
  Check,
  DollarSign,
} from "lucide-react";
import { useSettingsStore } from "@/store/settings";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import type { WorkspaceSettings } from "@/types/models";
import { CURRENCY_OPTIONS, LOCALE_OPTIONS } from "./general-helpers";
import { SettingsSection } from "./SettingsSection";
import { SettingsLogoUpload } from "./SettingsLogoUpload";
import { ColorPicker } from "./ColorPicker";
import { BrandPreview } from "./BrandPreview";
import { AppearanceSection } from "./AppearanceSection";







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
    currency: settings?.currency || "USD",
    locale: settings?.locale || "en-US",
    bookingPageSlug: settings?.bookingPageSlug || "",
  }));
  const [saved, setSaved] = useState(false);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (saved) setSaved(false);
  };

  // Same normalization as the workspace-bootstrap auto-slug — keep them
  // in sync so a manually entered slug round-trips identically.
  const normalizeSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48);

  const handleSave = () => {
    const cleanSlug = normalizeSlug(form.bookingPageSlug);
    updateSettings(
      {
        businessName: form.businessName.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        address: form.address.trim(),
        currency: form.currency,
        locale: form.locale,
        bookingPageSlug: cleanSlug || undefined,
      },
      workspaceId
    );
    if (cleanSlug !== form.bookingPageSlug) {
      setForm((prev) => ({ ...prev, bookingPageSlug: cleanSlug }));
    }
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
        transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
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
          <SettingsLogoUpload
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
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Public booking URL
            </label>
            <div className="flex items-center bg-card-bg border border-border-light rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-foreground/10 focus-within:border-foreground transition-all">
              <span className="px-3 py-3 text-[13px] text-text-tertiary bg-surface border-r border-border-light select-none">
                /book/
              </span>
              <input
                type="text"
                value={form.bookingPageSlug}
                onChange={(e) => update("bookingPageSlug", e.target.value)}
                onBlur={(e) => {
                  const cleaned = normalizeSlug(e.target.value);
                  if (cleaned !== form.bookingPageSlug) {
                    update("bookingPageSlug", cleaned);
                  }
                }}
                placeholder="your-business"
                className="flex-1 px-3 py-3 bg-transparent text-[15px] text-foreground placeholder:text-text-tertiary focus:outline-none"
                spellCheck={false}
                autoComplete="off"
              />
            </div>
            <p className="text-[11px] text-text-tertiary mt-1.5">
              Lowercase letters, numbers, and hyphens. This is the public link
              clients use to book with you. Save to apply.
            </p>
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

      {/* Currency & Locale Section */}
      <SettingsSection
        icon={DollarSign}
        title="Currency & Locale"
        description="Used for every price and money display in the dashboard"
        delay={0.16}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">Currency</label>
            <select
              value={form.currency}
              onChange={(e) => update("currency", e.target.value)}
              className={inputClass}
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">Locale</label>
            <select
              value={form.locale}
              onChange={(e) => update("locale", e.target.value)}
              className={inputClass}
            >
              {LOCALE_OPTIONS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SettingsSection>

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
