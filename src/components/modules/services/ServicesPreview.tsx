"use client";

import { useMemo, useState } from "react";
import { Maximize2, Palette } from "lucide-react";

import { useServicesStore } from "@/store/services";
import { useTeamStore } from "@/store/team";
import { useSettingsStore } from "@/store/settings";
import { useLocationsStore } from "@/store/locations";
import { useAuth } from "@/hooks/useAuth";
import { SlideOver } from "@/components/ui/SlideOver";
import {
  PublicBookingFlow,
  type PublicBookingSubmitResult,
} from "@/components/modules/bookings/public/PublicBookingFlow";
import type { FontPairingId } from "@/components/ui/FontPairing";

import { StylePanel } from "./preview/StylePanel";
import { NarrowStyleDrawer, LeftPreviewPanel, FullscreenShell } from "./preview/Shells";
import {
  serviceToPublic,
  memberToPublic,
  locationToPublic,
  workingHoursToAvailability,
  buildMemberServiceMap,
} from "./preview/adapter";

interface ServicesPreviewProps {
  open: boolean;
  onClose: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}

/**
 * Dashboard preview for the public booking page. Mounts the EXACT same
 * <PublicBookingFlow> the live `/book/[slug]` page mounts; the only
 * differences are:
 *   - data is built from Zustand stores (so live edits in the drawer
 *     reflect without a save), via the shapes in preview/adapter.ts
 *   - onSubmit is stubbed (no real booking is created)
 *   - showChrome is false (the slideover provides its own chrome)
 *   - previewMode banner explains what's stubbed
 *
 * Availability is real: TimePicker hits `/api/public/availability/basket`
 * with the workspace's slug, so the operator sees the same slots / blockers
 * a customer would see right now.
 */
export function ServicesPreview({
  open,
  onClose,
  fullscreen,
  onToggleFullscreen,
}: ServicesPreviewProps) {
  const [styleMode, setStyleMode] = useState(false);
  const { settings, updateSettings } = useSettingsStore();
  const { workspaceId } = useAuth();

  const primaryColor = settings?.branding?.primaryColor || "#10b981";
  const logoUrl = settings?.logoUrl || settings?.branding?.logo || "";
  const coverImage = settings?.branding?.coverImage || "";
  const fontPairing = (settings?.branding?.fontPairing || "modern") as FontPairingId;

  const setPrimaryColor = (hex: string) => {
    updateSettings(
      { branding: { ...(settings?.branding ?? {}), primaryColor: hex } },
      workspaceId || undefined,
    );
  };
  const setLogoUrl = (url: string) => {
    updateSettings({ logoUrl: url }, workspaceId || undefined);
  };
  const setCoverImage = (url: string) => {
    updateSettings(
      { branding: { ...(settings?.branding ?? {}), coverImage: url } },
      workspaceId || undefined,
    );
  };
  const setFontPairing = (id: FontPairingId) => {
    updateSettings(
      { branding: { ...(settings?.branding ?? {}), fontPairing: id } },
      workspaceId || undefined,
    );
  };

  const flow = <PreviewBookingFlow />;
  const panel = styleMode ? (
    <StylePanel
      primaryColor={primaryColor}
      onPrimaryColorChange={setPrimaryColor}
      logoUrl={logoUrl}
      onLogoUrlChange={setLogoUrl}
      coverImage={coverImage}
      onCoverImageChange={setCoverImage}
      fontPairing={fontPairing}
      onFontPairingChange={setFontPairing}
      // Layout switcher used to be wired to a parallel preview UI. The
      // shared flow has its own layout, so the picker is no-op'd until
      // the flow itself supports layout variants.
      layout="classic"
      onLayoutChange={() => {}}
    />
  ) : null;

  if (fullscreen) {
    return (
      <FullscreenShell
        open={open}
        onClose={onClose}
        onToggleFullscreen={onToggleFullscreen}
        styleMode={styleMode}
        onToggleStyleMode={() => setStyleMode((v) => !v)}
        sidePanel={panel}
        primaryColor={primaryColor}
      >
        {open ? flow : null}
      </FullscreenShell>
    );
  }

  if (styleMode) {
    return (
      <>
        {open && (
          <LeftPreviewPanel slideOverWidth={360} primaryColor={primaryColor}>
            {flow}
          </LeftPreviewPanel>
        )}
        <NarrowStyleDrawer
          open={open}
          onClose={onClose}
          styleMode={styleMode}
          onToggleStyleMode={() => setStyleMode((v) => !v)}
          onToggleFullscreen={onToggleFullscreen}
        >
          {panel}
        </NarrowStyleDrawer>
      </>
    );
  }

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Booking page preview"
      wide
      headerExtra={
        <div className="flex items-center gap-1">
          <button
            onClick={() => setStyleMode((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-colors text-text-secondary hover:text-foreground hover:bg-surface"
          >
            <Palette className="w-3.5 h-3.5" />
            Style
          </button>
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-surface text-text-secondary cursor-pointer"
            title="Expand to full screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      }
    >
      {open ? flow : null}
    </SlideOver>
  );
}

/**
 * The actual flow mount. Split out so the parent shell components can
 * conditionally render it (open=true) without re-running every Zustand
 * subscription when the slideover is closed.
 */
function PreviewBookingFlow() {
  const { services, getServiceMembers, categories } = useServicesStore();
  const { members } = useTeamStore();
  const { settings } = useSettingsStore();
  const { locations } = useLocationsStore();

  const slug = (settings?.bookingPageSlug ?? "").trim();
  const businessName = settings?.businessName || "Your Business";
  const brandColor = settings?.branding?.primaryColor || "#10b981";

  const activeServices = useMemo(
    () =>
      services
        .filter((s) => s.enabled)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [services],
  );

  // Adapter step: convert stored shapes to the PublicBookingFlow's expected
  // shapes. Re-runs whenever the underlying stores change so live edits in
  // the service drawer surface immediately in the preview.
  const publicServices = useMemo(
    () =>
      activeServices.map((s) =>
        serviceToPublic(s, { categories, allServices: services }),
      ),
    [activeServices, categories, services],
  );

  const publicMembers = useMemo(
    () =>
      members
        .filter((m) => m.status !== "inactive")
        .map((m) => memberToPublic(m)),
    [members],
  );

  const publicLocations = useMemo(
    () =>
      locations
        .filter((l) => l.enabled)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((l) => locationToPublic(l)),
    [locations],
  );

  const availability = useMemo(
    () => workingHoursToAvailability(settings?.workingHours ?? {}),
    [settings?.workingHours],
  );

  const memberServiceMap = useMemo(
    () => buildMemberServiceMap(activeServices, getServiceMembers),
    [activeServices, getServiceMembers],
  );

  // Stub submit. The real flow's confirmation screen still renders, with a
  // banner explaining nothing was actually booked. We don't fail because
  // the operator wants to see the full journey.
  const handlePreviewSubmit = async (): Promise<PublicBookingSubmitResult> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { ok: true };
  };

  if (!slug) {
    return (
      <div className="px-6 py-12 text-center max-w-md mx-auto">
        <p className="text-[14px] font-semibold text-foreground">
          Set a booking page slug first
        </p>
        <p className="text-[12px] text-text-secondary mt-2">
          The preview mounts the same flow customers see at{" "}
          <span className="font-mono">/book/&lt;slug&gt;</span>. Configure the
          workspace&apos;s booking page slug in Settings to enable it.
        </p>
      </div>
    );
  }

  if (activeServices.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-text-tertiary">
        <p className="text-sm">No active services to preview yet.</p>
        <p className="text-xs mt-1">
          Add services or mark some active to see them here.
        </p>
      </div>
    );
  }

  return (
    <PublicBookingFlow
      slug={slug}
      loading={false}
      error={null}
      businessName={businessName}
      brandColor={brandColor}
      services={publicServices}
      members={publicMembers}
      memberServiceMap={memberServiceMap}
      availability={availability}
      locations={publicLocations}
      onSubmit={handlePreviewSubmit}
      previewMode
      showChrome={false}
    />
  );
}
