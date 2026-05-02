"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Users,
  Sparkles,
  Check,
  X,
  Maximize2,
  Minimize2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Palette,
} from "lucide-react";
import { useServicesStore } from "@/store/services";
import { resolveServiceCategoryName } from "@/lib/services/category";
import { useTeamStore } from "@/store/team";
import { useSettingsStore } from "@/store/settings";
import { useAuth } from "@/hooks/useAuth";
import {
  Service,
  TeamMember,
  ServiceAddon,
  ServiceIntakeQuestion,
} from "@/types/models";
import {
  resolvePrice,
  resolveDuration,
  isPromoActive,
} from "@/lib/services/price";
import { SlideOver } from "@/components/ui/SlideOver";
import { ColorField } from "@/components/ui/ColorField";
import { LogoUpload } from "@/components/ui/LogoUpload";
import { CoverImageUpload } from "@/components/ui/CoverImageUpload";
import {
  FontPairingPicker,
  fontClassesFor,
  type FontPairingId,
} from "@/components/ui/FontPairing";
import {
  UNCATEGORIZED,
  useMounted,
  slugify,
  nameColor,
  minutesToHHMM,
  chainItems,
  addMinutes,
  formatDate,
} from "./preview/helpers";
import { ArtistChip } from "./preview/ArtistChip";
import { PriceDisplay } from "./preview/PriceDisplay";
import { AddPill } from "./preview/AddPill";
import { AddonRow } from "./preview/AddonRow";
import type { Layout, Step } from "./preview/types";
import { Header } from "./preview/Header";
import { BackBar } from "./preview/BackBar";
import { CartArtistPicker } from "./preview/CartArtistPicker";
import { CategoryAnchors } from "./preview/CategoryAnchors";

interface ServicesPreviewProps {
  open: boolean;
  onClose: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}


export function ServicesPreview({ open, onClose, fullscreen, onToggleFullscreen }: ServicesPreviewProps) {
  const [styleMode, setStyleMode] = useState(false);
  const [layout, setLayout] = useState<Layout>("classic");
  const { settings, updateSettings } = useSettingsStore();
  const { workspaceId } = useAuth();

  const primaryColor = settings?.branding?.primaryColor || "#10b981";
  const logoUrl = settings?.logoUrl || settings?.branding?.logo || "";
  const coverImage = settings?.branding?.coverImage || "";
  const fontPairing = settings?.branding?.fontPairing || "modern";

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

  // The preview renders a self-contained mock of the booking flow — its
  // availability, pricing, and validation paths intentionally diverge from
  // the live `/book/[slug]` route. We surface a banner + "open the real
  // page" link so operators know to verify the actual customer experience
  // out-of-band. Long-term this preview should converge on the real
  // public components; until then the banner is the honesty layer.
  const liveBookingHref = settings?.bookingPageSlug
    ? `/book/${settings.bookingPageSlug}`
    : null;
  const flow = (
    <div>
      <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-[12px] text-amber-900 flex items-center justify-between gap-3">
        <span>
          Preview only — uses mock availability + pricing. Test the real flow
          for accurate slot times, deposits, and gating.
        </span>
        {liveBookingHref ? (
          <a
            href={liveBookingHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline shrink-0"
          >
            Open live page →
          </a>
        ) : null}
      </div>
      <BookingFlow
        layout={layout}
        coverImage={coverImage}
        fontPairing={fontPairing}
      />
    </div>
  );
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
      layout={layout}
      onLayoutChange={setLayout}
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
  // Drawer mode has two shapes:
  //  - Style off: a single SlideOver showing the booking-flow preview
  //  - Style on:  a 360px style panel on the right + a left-anchored
  //               live preview, matching the fullscreen split layout
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

function NarrowStyleDrawer({
  open,
  onClose,
  styleMode,
  onToggleStyleMode,
  onToggleFullscreen,
  children,
}: {
  open: boolean;
  onClose: () => void;
  styleMode: boolean;
  onToggleStyleMode: () => void;
  onToggleFullscreen: () => void;
  children: React.ReactNode;
}) {
  const mounted = useMounted();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%", opacity: 0.5 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 280, mass: 0.8 }}
          className="fixed top-0 bottom-0 right-0 w-[360px] max-w-[360px] z-[62] bg-card-bg border-l border-border-light shadow-2xl shadow-black/8 flex flex-col"
        >
          <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-border-light">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-text-secondary" />
              <p className="text-[14px] font-semibold text-foreground">Style</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onToggleStyleMode}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-colors ${
                  styleMode ? "bg-primary/10 text-primary" : "text-text-secondary hover:text-foreground hover:bg-surface"
                }`}
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
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-surface text-text-secondary cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}

function LeftPreviewPanel({
  slideOverWidth,
  primaryColor,
  children,
}: {
  slideOverWidth: number;
  primaryColor: string;
  children: React.ReactNode;
}) {
  const mounted = useMounted();
  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed top-0 bottom-0 left-0 bg-surface border-r border-border-light z-[61] overflow-y-auto"
      style={{
        right: `min(${slideOverWidth}px, 100vw)`,
        background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${primaryColor}1A, transparent 60%), var(--surface)`,
      }}
    >
      <div className="px-6 py-4 bg-card-bg/80 backdrop-blur-sm border-b border-border-light flex items-center gap-2">
        <div className="flex items-center gap-2 text-[12px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
          <Sparkles className="w-3.5 h-3.5" />
          Live preview
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
    </motion.div>
  );
  if (!mounted) return null;
  return createPortal(content, document.body);
}

function FullscreenShell({
  open,
  onClose,
  onToggleFullscreen,
  styleMode,
  onToggleStyleMode,
  sidePanel,
  primaryColor,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onToggleFullscreen: () => void;
  styleMode: boolean;
  onToggleStyleMode: () => void;
  sidePanel?: React.ReactNode;
  primaryColor: string;
  children: React.ReactNode;
}) {
  const mounted = useMounted();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] bg-surface flex flex-col"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between gap-3 px-6 py-3 bg-card-bg border-b border-border-light">
            <div className="flex items-center gap-2 text-[12px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
              <Sparkles className="w-3.5 h-3.5" />
              Preview
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onToggleStyleMode}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer transition-colors ${
                  styleMode ? "bg-primary/10 text-primary" : "text-text-secondary hover:text-foreground hover:bg-surface"
                }`}
              >
                <Palette className="w-4 h-4" />
                Style
              </button>
              <button
                onClick={onToggleFullscreen}
                className="p-2 rounded-lg hover:bg-surface text-text-secondary cursor-pointer"
                title="Exit full screen"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-surface text-text-secondary cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          {/* Body — split when a side panel is provided */}
          <div className="flex-1 flex min-h-0">
            <div
              className="flex-1 overflow-y-auto"
              style={{
                background: `radial-gradient(ellipse 80% 50% at 50% -5%, ${primaryColor}1A, transparent 60%), var(--surface)`,
              }}
            >
              <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
            </div>
            {sidePanel && (
              <motion.aside
                key="side-panel"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 40, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-[360px] max-w-[360px] flex-shrink-0 border-l border-border-light bg-card-bg overflow-y-auto"
              >
                <div className="px-5 py-4 border-b border-border-light flex items-center gap-2">
                  <Palette className="w-4 h-4 text-text-secondary" />
                  <p className="text-[14px] font-semibold text-foreground">Style</p>
                </div>
                <div className="p-5">{sidePanel}</div>
              </motion.aside>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}

// ── Booking flow ────────────────────────────────────────────────────


interface BasketItem {
  serviceId: string;
  variantId?: string;
  addonIds?: string[];
  /**
   * Per-service artist override (Pattern 1 opt-in). Only honoured when
   * flow.useArtistPerService is true. null = explicit "any" (engine picks).
   */
  artistId?: string | null;
}

interface FlowState {
  basket: BasketItem[];
  /** Basket-wide artist (Pattern 3 default). One artist for the whole chain. */
  artist: TeamMember | null;
  /**
   * Opt-in: each basket item carries its own artistId. When true, the
   * artist step is skipped and the cart shows per-row pickers.
   */
  useArtistPerService: boolean;
  date: string | null; // ISO date
  time: string | null; // "10:30"
  name: string;
  email: string;
  phone: string;
  intakeAnswers: Record<string, string>; // questionId -> answer
}

const initialFlow: FlowState = {
  basket: [],
  artist: null,
  useArtistPerService: false,
  date: null,
  time: null,
  name: "",
  email: "",
  phone: "",
  intakeAnswers: {},
};

function BookingFlow({
  layout,
  coverImage,
  fontPairing,
}: {
  layout: Layout;
  coverImage: string;
  fontPairing: string;
}) {
  const fonts = fontClassesFor(fontPairing);
  const { services, getServiceMembers, getMemberPriceOverride, categories: storeCategories } = useServicesStore();
  const { members } = useTeamStore();
  const { settings } = useSettingsStore();

  const [step, setStep] = useState<Step>("menu");
  const [flow, setFlow] = useState<FlowState>(initialFlow);

  const businessName = settings?.businessName || "Your Business";
  const primaryColor = settings?.branding?.primaryColor || "#10b981";
  const logoUrl = settings?.logoUrl || settings?.branding?.logo;

  const allActiveServices = useMemo(
    () => services.filter((s) => s.enabled).sort((a, b) => a.sortOrder - b.sortOrder),
    [services],
  );

  // Featured services that are currently in promo range (or always-on featured).
  const featuredServices = useMemo(
    () => allActiveServices.filter((s) => s.featured && isPromoActive(s)),
    [allActiveServices],
  );

  const activeServices = allActiveServices;

  const categoryNames = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const s of activeServices) {
      const cat = resolveServiceCategoryName(s, storeCategories) || UNCATEGORIZED;
      if (!seen.has(cat)) {
        seen.add(cat);
        out.push(cat);
      }
    }
    return out;
  }, [activeServices, storeCategories]);

  // Resolve basket items into { service, variantId, addonIds, artistId }.
  // Filter against activeServices so a stale id (service deactivated
  // mid-flow) gets dropped silently.
  const basketResolved = useMemo(() => {
    type R = {
      service: Service;
      variantId: string | undefined;
      addonIds: string[];
      artistId: string | null | undefined;
    };
    const out: R[] = [];
    for (const item of flow.basket) {
      const svc = activeServices.find((s) => s.id === item.serviceId);
      if (svc)
        out.push({
          service: svc,
          variantId: item.variantId,
          addonIds: item.addonIds ?? [],
          artistId: item.artistId,
        });
    }
    return out;
  }, [flow.basket, activeServices]);
  const basketServices = useMemo(
    () => basketResolved.map((b) => b.service),
    [basketResolved],
  );

  // Per-item resolved price/duration. The artist that drives tier pricing +
  // per-staff override comes from EITHER the basket-wide flow.artist
  // (Pattern 3 default) OR the per-item artistId (Pattern 1 opt-in).
  const resolvedItems = useMemo(
    () =>
      basketResolved.map(({ service, variantId, addonIds, artistId }) => {
        const memberId = flow.useArtistPerService
          ? (artistId ?? null)
          : (flow.artist?.id ?? null);
        const memberOverride =
          memberId != null ? getMemberPriceOverride(service.id, memberId) : undefined;
        const basePrice = resolvePrice(service, {
          memberId,
          memberPriceOverride: memberOverride,
          variantId,
        });
        const baseDuration = resolveDuration(service, { variantId, memberId });
        const selectedAddons = (service.addons ?? []).filter((a) =>
          addonIds.includes(a.id),
        );
        const addonPrice = selectedAddons.reduce((s, a) => s + a.price, 0);
        const addonDuration = selectedAddons.reduce((s, a) => s + a.duration, 0);
        return {
          service,
          variantId,
          addonIds,
          artistId: memberId,
          addons: selectedAddons,
          price: basePrice + addonPrice,
          basePrice,
          duration: baseDuration + addonDuration,
          baseDuration,
        };
      }),
    [basketResolved, flow.artist, flow.useArtistPerService, getMemberPriceOverride],
  );
  const totalDuration = resolvedItems.reduce((sum, i) => sum + i.duration, 0);
  const totalPrice = resolvedItems.reduce((sum, i) => sum + i.price, 0);

  // Allowed weekdays = intersection of every service's availableWeekdays.
  // A service with no list (or empty) imposes no restriction.
  const allowedWeekdays: number[] | null = useMemo(() => {
    const lists = basketServices
      .map((s) => s.availableWeekdays)
      .filter((w): w is number[] => Array.isArray(w) && w.length > 0);
    if (lists.length === 0) return null; // any day
    return lists.reduce<number[]>(
      (acc, w) => acc.filter((d) => w.includes(d)),
      lists[0],
    );
  }, [basketServices]);

  // Aggregated intake questions across the basket. Order: per service in
  // basket order, with each service's questions in their own order.
  const intakeQuestions: { service: Service; question: ServiceIntakeQuestion }[] = useMemo(() => {
    const out: { service: Service; question: ServiceIntakeQuestion }[] = [];
    for (const svc of basketServices) {
      const qs = (svc.intakeQuestions ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
      for (const q of qs) out.push({ service: svc, question: q });
    }
    return out;
  }, [basketServices]);

  // Eligible artists for the whole basket = intersection of each service's
  // assigned set. "Anyone" services contribute all active members.
  const activeMembers = useMemo(
    () => members.filter((m) => m.status !== "inactive"),
    [members],
  );
  const eligibleArtists = useMemo(() => {
    if (basketServices.length === 0) return activeMembers;
    let pool: TeamMember[] = activeMembers;
    for (const svc of basketServices) {
      const assignedIds = getServiceMembers(svc.id);
      if (assignedIds.length === 0) continue; // anyone → no narrowing
      pool = pool.filter((m) => assignedIds.includes(m.id));
    }
    return pool;
  }, [basketServices, activeMembers, getServiceMembers]);

  // Variant picker state — when a variant-priced service is added, we
  // pause to ask the client which variant before committing to the basket.
  const [pendingVariantPick, setPendingVariantPick] = useState<Service | null>(null);

  if (activeServices.length === 0) {
    return (
      <div className="text-center py-16 text-text-tertiary">
        <p className="text-sm">No active services to preview yet.</p>
        <p className="text-xs mt-1">Add services or mark some active to see them here.</p>
      </div>
    );
  }

  const reset = () => {
    setFlow(initialFlow);
    setStep("menu");
  };

  const inBasket = (serviceId: string) =>
    flow.basket.some((b) => b.serviceId === serviceId);

  const removeFromBasket = (serviceId: string) =>
    setFlow((f) => ({ ...f, basket: f.basket.filter((b) => b.serviceId !== serviceId) }));

  const addToBasket = (serviceId: string, variantId?: string, addonIds?: string[]) =>
    setFlow((f) => ({
      ...f,
      basket: [...f.basket, { serviceId, variantId, addonIds }],
    }));

  const toggleService = (service: Service) => {
    if (inBasket(service.id)) {
      removeFromBasket(service.id);
      return;
    }
    const hasVariants = service.priceType === "variants" && (service.variants?.length ?? 0) > 0;
    const hasAddons = (service.addons?.length ?? 0) > 0;
    if (hasVariants || hasAddons) {
      setPendingVariantPick(service);
      return;
    }
    addToBasket(service.id);
  };

  // Per-service stylist picker — each cart row gets its own artistId.
  const setItemArtist = (serviceId: string, artistId: string | null) => {
    setFlow((f) => ({
      ...f,
      basket: f.basket.map((b) =>
        b.serviceId === serviceId ? { ...b, artistId } : b,
      ),
    }));
  };

  // Toggle the Pattern 1 opt-in. When turning ON, propagate the existing
  // basket-wide artist (if any) into each row so the user doesn't lose
  // context. When turning OFF, clear per-row artists so the basket-wide
  // pick takes over again.
  const toggleArtistPerService = () => {
    setFlow((f) => {
      const enabling = !f.useArtistPerService;
      if (enabling) {
        const seedArtistId = f.artist?.id ?? null;
        return {
          ...f,
          useArtistPerService: true,
          basket: f.basket.map((b) => ({
            ...b,
            artistId: b.artistId === undefined ? seedArtistId : b.artistId,
          })),
          artist: null,
        };
      }
      return {
        ...f,
        useArtistPerService: false,
        basket: f.basket.map((b) => ({ ...b, artistId: undefined })),
      };
    });
  };

  const continueFromMenu = () => {
    if (basketServices.length === 0) return;
    // Skip the artist step only for single-service baskets with one (or
    // zero) eligible artist — there is nothing to choose. Multi-service
    // baskets always land on the artist step so the per-service option
    // is reachable.
    if (basketServices.length === 1 && eligibleArtists.length <= 1) {
      setFlow((f) => ({ ...f, artist: eligibleArtists[0] ?? null }));
      setStep("date");
      return;
    }
    setStep("artist");
  };

  return (
    <div className={`space-y-4 ${fonts.body}`}>
      {step !== "menu" && step !== "confirm" && (
        <div className="max-w-2xl mx-auto">
          <BackBar
            step={step}
            basketServices={basketServices}
            artist={flow.artist}
            date={flow.date}
            time={flow.time}
            businessName={businessName}
            onBack={() => {
              if (step === "artist") setStep("menu");
              else if (step === "date") {
                setStep(eligibleArtists.length <= 1 ? "menu" : "artist");
              } else if (step === "time") setStep("date");
              else if (step === "details") setStep("time");
            }}
          />
        </div>
      )}

      {step === "menu" && (
        basketServices.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            <div className="min-w-0 max-w-2xl">
              <Header
                businessName={businessName}
                primaryColor={primaryColor}
                logoUrl={logoUrl}
                coverImage={coverImage}
                headingClass={fonts.heading}
              />
              <FeaturedRow
                services={featuredServices}
                getServiceMembers={getServiceMembers}
                members={members}
                primaryColor={primaryColor}
                selectedIds={flow.basket.map((b) => b.serviceId)}
                onToggle={toggleService}
                headingClass={fonts.heading}
              />
              <CategoryAnchors categories={categoryNames} primaryColor={primaryColor} />
              <ServiceMenu
                services={activeServices}
                getServiceMembers={getServiceMembers}
                members={members}
                primaryColor={primaryColor}
                layout={layout}
                selectedIds={flow.basket.map((b) => b.serviceId)}
                onToggle={toggleService}
                headingClass={fonts.heading}
              />
            </div>
            <CartSidebar
              items={resolvedItems}
              totalPrice={totalPrice}
              totalDuration={totalDuration}
              primaryColor={primaryColor}
              onRemove={(s) => toggleService(s)}
              onContinue={continueFromMenu}
            />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <Header
              businessName={businessName}
              primaryColor={primaryColor}
              logoUrl={logoUrl}
              headingClass={fonts.heading}
            />
            <CategoryAnchors categories={categoryNames} primaryColor={primaryColor} />
            <ServiceMenu
              services={activeServices}
              getServiceMembers={getServiceMembers}
              members={members}
              primaryColor={primaryColor}
              layout={layout}
              selectedIds={flow.basket.map((b) => b.serviceId)}
              onToggle={toggleService}
              headingClass={fonts.heading}
            />
          </div>
        )
      )}

      {step !== "menu" && (
        <div className="max-w-2xl mx-auto">
          {step === "artist" && (
            <BasketArtistPicker
              eligible={eligibleArtists}
              primaryColor={primaryColor}
              basketServices={basketServices}
              activeMembers={activeMembers}
              getServiceMembers={getServiceMembers}
              perServiceMode={flow.useArtistPerService}
              perServiceArtistIds={Object.fromEntries(
                flow.basket.map((b) => [b.serviceId, b.artistId ?? null]),
              )}
              onTogglePerService={toggleArtistPerService}
              onChangeItemArtist={setItemArtist}
              onPick={(artist) => {
                setFlow((f) => ({ ...f, artist }));
                setStep("date");
              }}
              onContinuePerService={() => setStep("date")}
              onBackToMenu={() => setStep("menu")}
            />
          )}

          {step === "date" && (
            <DatePicker
              primaryColor={primaryColor}
              selected={flow.date}
              allowedWeekdays={allowedWeekdays}
              onPick={(date) => {
                setFlow((f) => ({ ...f, date }));
                setStep("time");
              }}
            />
          )}

          {step === "time" && flow.date && (
            <TimePicker
              primaryColor={primaryColor}
              duration={totalDuration}
              onPick={(time) => {
                setFlow((f) => ({ ...f, time }));
                setStep("details");
              }}
            />
          )}

          {step === "details" && flow.date && flow.time && (
            <DetailsForm
              flow={flow}
              primaryColor={primaryColor}
              intakeQuestions={intakeQuestions}
              onChange={(patch) => setFlow((f) => ({ ...f, ...patch }))}
              onIntakeChange={(qid, value) =>
                setFlow((f) => ({
                  ...f,
                  intakeAnswers: { ...f.intakeAnswers, [qid]: value },
                }))
              }
              onSubmit={() => setStep("confirm")}
            />
          )}

          {step === "confirm" && (
            <ConfirmScreen
              items={resolvedItems}
              totalPrice={totalPrice}
              totalDuration={totalDuration}
              flow={flow}
              businessName={businessName}
              primaryColor={primaryColor}
              members={members}
              onReset={reset}
            />
          )}
        </div>
      )}

      {step === "menu" && basketServices.length === 0 && (
        <p className="text-center text-[11px] text-text-tertiary pt-4">
          Powered by Magic
        </p>
      )}

      {/* Configure modal — opens when adding a service that has variants or add-ons */}
      {pendingVariantPick && (
        <ConfigureServiceModal
          service={pendingVariantPick}
          primaryColor={primaryColor}
          onCancel={() => setPendingVariantPick(null)}
          onAdd={(variantId, addonIds) => {
            addToBasket(pendingVariantPick.id, variantId, addonIds);
            setPendingVariantPick(null);
          }}
        />
      )}
    </div>
  );
}


function ConfigureServiceModal({
  service,
  primaryColor,
  onCancel,
  onAdd,
}: {
  service: Service;
  primaryColor: string;
  onCancel: () => void;
  onAdd: (variantId: string | undefined, addonIds: string[]) => void;
}) {
  const variants = service.variants ?? [];
  const addons = service.addons ?? [];
  const addonGroups = service.addonGroups ?? [];
  const hasVariants = variants.length > 0 && service.priceType === "variants";
  const hasAddons = addons.length > 0;

  const [variantId, setVariantId] = useState<string | undefined>(undefined);
  const [addonIds, setAddonIds] = useState<string[]>([]);

  const variantPrice = variants.find((v) => v.id === variantId)?.price ?? service.price;
  const variantDuration = variants.find((v) => v.id === variantId)?.duration ?? service.duration;
  const addonPriceTotal = addons
    .filter((a) => addonIds.includes(a.id))
    .reduce((s, a) => s + a.price, 0);
  const addonDurationTotal = addons
    .filter((a) => addonIds.includes(a.id))
    .reduce((s, a) => s + a.duration, 0);
  const totalPrice = variantPrice + addonPriceTotal;
  const totalDuration = variantDuration + addonDurationTotal;

  // Group enforcement: each group's selected count must satisfy minSelect.
  // The picker also blocks selections that would exceed maxSelect (handled in
  // the per-row click handler so the user gets visual feedback rather than
  // mysterious Add-button greying).
  const groupCounts = new Map<string, number>();
  for (const a of addons) {
    if (!a.groupId || !addonIds.includes(a.id)) continue;
    groupCounts.set(a.groupId, (groupCounts.get(a.groupId) ?? 0) + 1);
  }
  const failingGroups = addonGroups.filter(
    (g) => (groupCounts.get(g.id) ?? 0) < (g.minSelect ?? 0),
  );

  // The CTA is disabled until a variant is picked (when variants exist) AND
  // every required add-on group is satisfied.
  const canSubmit =
    (!hasVariants || variantId != null) && failingGroups.length === 0;

  const toggleAddon = (id: string) => {
    const a = addons.find((x) => x.id === id);
    if (!a) return;
    setAddonIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      // Group max guard. When a group caps at N and the user picks an N+1th,
      // we either reject (max=1 → swap) or block (max>1 → no-op).
      if (a.groupId) {
        const group = addonGroups.find((g) => g.id === a.groupId);
        if (group?.maxSelect != null) {
          const currentInGroup = prev.filter((x) => {
            const candidate = addons.find((y) => y.id === x);
            return candidate?.groupId === a.groupId;
          });
          if (currentInGroup.length >= group.maxSelect) {
            // Single-pick groups feel like radios — replace prior selection.
            if (group.maxSelect === 1) {
              return [...prev.filter((x) => !currentInGroup.includes(x)), id];
            }
            return prev;
          }
        }
      }
      return [...prev, id];
    });
  };

  // Helpers for rendering: the addons that belong to a specific group, and
  // the addons that are ungrouped (rendered as a flat optional list).
  const addonsByGroup = (groupId: string) => addons.filter((a) => a.groupId === groupId);
  const ungroupedAddons = addons.filter((a) => !a.groupId);

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/40 flex items-end sm:items-center justify-center"
      onClick={onCancel}
    >
      <div
        className="bg-card-bg rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <p className="text-[15px] font-bold text-foreground tracking-tight">
              {service.name}
            </p>
            {(hasVariants || hasAddons) && (
              <p className="text-[12px] text-text-tertiary">
                {hasVariants ? "Pick an option" : ""}
                {hasVariants && hasAddons ? " · " : ""}
                {hasAddons ? "add any extras" : ""}
              </p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-surface text-text-secondary cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 overflow-y-auto flex-1 space-y-5">
          {hasVariants && (
            <div>
              <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.1em] mb-2">
                Option
              </p>
              <div className="space-y-2">
                {variants.map((v) => {
                  const selected = variantId === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setVariantId(v.id)}
                      className={`w-full border rounded-2xl px-4 py-3 flex items-center justify-between text-left cursor-pointer transition-colors ${
                        selected
                          ? "bg-card-bg"
                          : "bg-surface border-border-light hover:border-foreground/20"
                      }`}
                      style={selected ? { borderColor: primaryColor, borderWidth: 2 } : undefined}
                    >
                      <div>
                        <p className="text-[14px] font-semibold text-foreground">{v.name}</p>
                        <p className="text-[11px] text-text-tertiary tabular-nums">
                          {v.duration} min
                        </p>
                      </div>
                      <p
                        className="text-[15px] font-bold tabular-nums"
                        style={{ color: primaryColor }}
                      >
                        ${v.price}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasAddons && (
            <div className="space-y-5">
              {addonGroups.map((g) => {
                const groupAddons = addonsByGroup(g.id);
                if (groupAddons.length === 0) return null;
                const count = groupCounts.get(g.id) ?? 0;
                const min = g.minSelect ?? 0;
                const max = g.maxSelect;
                const failing = count < min;
                const ruleText =
                  min > 0 && max != null && min === max
                    ? `Pick ${min}`
                    : min > 0 && max != null
                      ? `Pick ${min}–${max}`
                      : min > 0
                        ? `Pick at least ${min}`
                        : max != null
                          ? `Pick up to ${max}`
                          : "Optional";
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.1em]">
                        {g.name}{" "}
                        <span
                          className={`normal-case font-medium tracking-normal ${
                            failing ? "text-red-500" : "text-text-tertiary"
                          }`}
                        >
                          · {ruleText}
                        </span>
                      </p>
                      <p className="text-[10px] text-text-tertiary tabular-nums">
                        {count}/{max ?? "∞"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {groupAddons.map((a) => (
                        <AddonRow
                          key={a.id}
                          addon={a}
                          selected={addonIds.includes(a.id)}
                          onToggle={() => toggleAddon(a.id)}
                          primaryColor={primaryColor}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {ungroupedAddons.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.1em] mb-2">
                    Add-ons{" "}
                    <span className="text-text-tertiary normal-case font-normal tracking-normal">
                      (optional)
                    </span>
                  </p>
                  <div className="space-y-2">
                    {ungroupedAddons.map((a) => (
                      <AddonRow
                        key={a.id}
                        addon={a}
                        selected={addonIds.includes(a.id)}
                        onToggle={() => toggleAddon(a.id)}
                        primaryColor={primaryColor}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky footer with running total + Add CTA */}
        <div className="px-5 pt-3 pb-5 border-t border-border-light mt-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] text-text-tertiary tabular-nums">
              {totalDuration > 0 ? `${totalDuration} min · ` : ""}
              <span className="text-foreground font-semibold">${totalPrice}</span>
            </p>
          </div>
          <button
            onClick={() => onAdd(variantId, addonIds)}
            disabled={!canSubmit}
            className="w-full py-3 rounded-2xl text-[13px] font-semibold text-white cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
            }}
          >
            {hasVariants && !variantId
              ? "Pick an option"
              : failingGroups.length > 0
                ? `Pick ${failingGroups[0].name}`
                : "Add to booking"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CartSidebar({
  items,
  totalPrice,
  totalDuration,
  primaryColor,
  onRemove,
  onContinue,
}: {
  items: {
    service: Service;
    variantId?: string;
    artistId?: string | null;
    addons: ServiceAddon[];
    price: number;
    basePrice: number;
    duration: number;
    baseDuration: number;
  }[];
  totalPrice: number;
  totalDuration: number;
  primaryColor: string;
  onRemove: (s: Service) => void;
  onContinue: () => void;
}) {
  const continueGradient = `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`;
  const hours = Math.floor(totalDuration / 60);
  const mins = totalDuration % 60;
  const durationLabel =
    hours > 0
      ? mins > 0
        ? `${hours}h ${mins}m`
        : `${hours}h`
      : `${mins} min`;

  return (
    <aside className="lg:sticky lg:top-4 self-start">
      <div className="bg-card-bg border border-border-light rounded-3xl overflow-hidden shadow-[0_24px_60px_-20px_rgba(0,0,0,0.12)]">
        {/* Header — centered, with a small brand-tinted count chip */}
        <div className="px-5 pt-6 pb-4 text-center">
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.12em]">
            Your booking
          </p>
          <div
            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[11px] font-semibold"
            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
          >
            {items.length} {items.length === 1 ? "service" : "services"}
            <span className="opacity-50">·</span>
            <span className="tabular-nums">{durationLabel}</span>
          </div>
        </div>

        {/* Items */}
        <ul className="px-2 pb-2">
          {items.map((item) => {
            const variant = item.variantId
              ? item.service.variants?.find((v) => v.id === item.variantId)
              : null;
            return (
              <li
                key={item.service.id}
                className="group px-3 py-2.5 rounded-xl hover:bg-surface/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">
                      {item.service.name}
                      {variant && (
                        <span className="text-text-tertiary font-normal"> · {variant.name}</span>
                      )}
                    </p>
                    <p className="text-[11px] text-text-tertiary tabular-nums">
                      {item.baseDuration} min · ${item.basePrice}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemove(item.service)}
                    className="p-1.5 rounded-full text-text-tertiary hover:text-foreground hover:bg-card-bg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {item.addons.length > 0 && (
                  <ul className="mt-1.5 ml-2.5 pl-3 border-l border-border-light space-y-0.5">
                    {item.addons.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-baseline justify-between gap-2 text-[11px]"
                      >
                        <span className="text-text-secondary truncate">+ {a.name}</span>
                        <span className="text-text-tertiary tabular-nums whitespace-nowrap">
                          +${a.price}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        {/* Total — centered, bold, hero treatment */}
        <div className="px-5 py-5 border-t border-border-light text-center">
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.12em] mb-1">
            Total
          </p>
          <p className="text-[28px] font-bold text-foreground tabular-nums leading-none">
            ${totalPrice}
          </p>
        </div>

        {/* CTA */}
        <div className="px-4 pb-4">
          <button
            onClick={onContinue}
            className="w-full py-3 rounded-2xl text-[13px] font-semibold text-white cursor-pointer transition-all hover:opacity-90 hover:-translate-y-px shadow-[0_8px_20px_-8px_rgba(0,0,0,0.25)]"
            style={{ backgroundImage: continueGradient }}
          >
            Continue
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── Subcomponents ────────────────────────────────────────────────────




function FeaturedRow({
  services,
  getServiceMembers,
  members,
  primaryColor,
  selectedIds,
  onToggle,
  headingClass = "",
}: {
  services: Service[];
  getServiceMembers: (id: string) => string[];
  members: TeamMember[];
  primaryColor: string;
  selectedIds: string[];
  onToggle: (s: Service) => void;
  headingClass?: string;
}) {
  if (services.length === 0) return null;
  return (
    <div className="mb-8">
      <h3
        className={`text-[16px] font-bold text-foreground mb-3 tracking-tight flex items-center gap-2 ${headingClass}`}
      >
        <span
          className="w-1 h-4 rounded-full"
          style={{ backgroundColor: primaryColor }}
        />
        Today&apos;s offers
      </h3>
      <div className="space-y-3">
        {services.map((service) => {
          const assignedIds = getServiceMembers(service.id);
          const activeMembers = members.filter((m) => m.status !== "inactive");
          const isAnyone = assignedIds.length === 0;
          const providers = isAnyone
            ? activeMembers
            : activeMembers.filter((m) => assignedIds.includes(m.id));
          const selected = selectedIds.includes(service.id);
          return (
            <ServiceCardPreview
              key={`featured-${service.id}`}
              service={service}
              providers={providers}
              isAnyone={isAnyone}
              primaryColor={primaryColor}
              selected={selected}
              onToggle={() => onToggle(service)}
              headingClass={headingClass}
              hidePromoLabel
            />
          );
        })}
      </div>
    </div>
  );
}

function ServiceMenu({
  services,
  getServiceMembers,
  members,
  primaryColor,
  layout,
  selectedIds,
  onToggle,
  headingClass = "",
}: {
  services: Service[];
  getServiceMembers: (id: string) => string[];
  members: TeamMember[];
  primaryColor: string;
  layout: Layout;
  selectedIds: string[];
  onToggle: (s: Service) => void;
  headingClass?: string;
}) {
  // Pull category rows from the store so the canonical name wins over the
  // legacy free-text fallback. Same lookup pattern as the catalog view.
  const storeCategories = useServicesStore((s) => s.categories);
  const grouped = useMemo(() => {
    const m = new Map<string, Service[]>();
    for (const s of services) {
      const cat = resolveServiceCategoryName(s, storeCategories) || UNCATEGORIZED;
      if (!m.has(cat)) m.set(cat, []);
      m.get(cat)!.push(s);
    }
    return m;
  }, [services, storeCategories]);

  const containerClass =
    layout === "grid"
      ? "grid grid-cols-2 gap-3"
      : layout === "compact"
        ? "divide-y divide-border-light bg-card-bg border border-border-light rounded-2xl overflow-hidden"
        : "space-y-3";

  return (
    <div className="space-y-8">
      {Array.from(grouped.entries()).map(([cat, catServices]) => (
        <div key={cat} id={`cat-${slugify(cat)}`} style={{ scrollMarginTop: 16 }}>
          <h3 className={`text-[16px] font-bold text-foreground mb-3 tracking-tight flex items-center gap-2 ${headingClass}`}>
            <span
              className="w-1 h-4 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
            {cat}
          </h3>
          <div className={containerClass}>
            {catServices.map((service) => {
              const assignedIds = getServiceMembers(service.id);
              const activeMembers = members.filter((m) => m.status !== "inactive");
              const isAnyone = assignedIds.length === 0;
              const providers = isAnyone
                ? activeMembers
                : activeMembers.filter((m) => assignedIds.includes(m.id));
              const selected = selectedIds.includes(service.id);
              const cardProps = {
                service,
                providers,
                isAnyone,
                primaryColor,
                selected,
                onToggle: () => onToggle(service),
                headingClass,
              };
              if (layout === "compact")
                return <ServiceCardCompact key={service.id} {...cardProps} />;
              if (layout === "grid")
                return <ServiceCardGrid key={service.id} {...cardProps} />;
              return <ServiceCardPreview key={service.id} {...cardProps} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ServiceCardPreview({
  service,
  providers,
  isAnyone,
  primaryColor,
  selected,
  onToggle,
  headingClass = "",
  hidePromoLabel = false,
}: {
  service: Service;
  providers: TeamMember[];
  isAnyone: boolean;
  primaryColor: string;
  selected: boolean;
  onToggle: () => void;
  headingClass?: string;
  hidePromoLabel?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const initial = service.name.charAt(0).toUpperCase();
  const canExpand = !!service.description || providers.length > 0;

  return (
    <div
      onClick={canExpand ? () => setExpanded((v) => !v) : undefined}
      role={canExpand ? "button" : undefined}
      tabIndex={canExpand ? 0 : undefined}
      onKeyDown={(e) => {
        if (canExpand && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          setExpanded((v) => !v);
        }
      }}
      className={`bg-card-bg border border-border-light rounded-3xl overflow-hidden transition-all shadow-[0_4px_16px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_-10px_rgba(0,0,0,0.12)] ${
        canExpand ? "cursor-pointer" : ""
      } ${selected ? "" : "hover:border-foreground/20"}`}
      style={
        selected
          ? {
              boxShadow: `0 0 0 1.5px ${primaryColor}, 0 8px 24px -10px ${primaryColor}33`,
              backgroundImage: `linear-gradient(180deg, ${primaryColor}08 0%, transparent 60%)`,
            }
          : undefined
      }
    >
      <div className="p-4 flex items-center gap-4">
        {service.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={service.imageUrl}
            alt={service.name}
            className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
            style={{
              backgroundImage: `linear-gradient(135deg, ${primaryColor}22 0%, ${primaryColor}08 100%)`,
            }}
          >
            <span
              className={`text-[28px] font-light tracking-tight ${headingClass}`}
              style={{ color: `${primaryColor}` }}
            >
              {initial}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className={`text-[15px] font-semibold text-foreground truncate ${headingClass}`}>{service.name}</p>
            {!hidePromoLabel && service.promoLabel && isPromoActive(service) && (
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {service.promoLabel}
              </span>
            )}
            {service.requiresConfirmation && (
              <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                By approval
              </span>
            )}
          </div>
          {service.description && !expanded && (
            <p className="text-[12px] text-text-secondary line-clamp-2 mb-1.5">{service.description}</p>
          )}
          <div className="flex items-center gap-3 text-[12px] text-text-tertiary">
            <span className="flex items-center gap-1 tabular-nums">
              <Clock className="w-3 h-3" /> {service.duration} min
            </span>
            {providers.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {isAnyone ? "Any artist" : providers.length === 1 ? providers[0].name : `${providers.length} artists`}
              </span>
            )}
            {canExpand && (
              <span className="ml-auto text-text-tertiary" aria-hidden>
                {expanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <PriceDisplay service={service} className="text-[16px] font-bold text-foreground" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="cursor-pointer"
          >
            <AddPill selected={selected} primaryColor={primaryColor} />
          </button>
        </div>
      </div>

      {expanded && canExpand && (
        <div
          className="px-4 pb-4 pt-1 border-t border-border-light/60 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {service.description && (
            <p className="text-[13px] text-text-secondary leading-relaxed mb-3 mt-3">
              {service.description}
            </p>
          )}
          {providers.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.1em] mb-2">
                {isAnyone
                  ? "Available with any of"
                  : `Available with ${providers.length === 1 ? "" : `${providers.length} `}artist${providers.length === 1 ? "" : "s"}`}
              </p>
              <div className="flex flex-wrap gap-2">
                {providers.map((m) => (
                  <ArtistChip key={m.id} member={m} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function BasketArtistPicker({
  eligible,
  primaryColor,
  basketServices,
  activeMembers,
  getServiceMembers,
  perServiceMode,
  perServiceArtistIds,
  onTogglePerService,
  onChangeItemArtist,
  onPick,
  onContinuePerService,
  onBackToMenu,
}: {
  eligible: TeamMember[];
  primaryColor: string;
  basketServices: Service[];
  activeMembers: TeamMember[];
  getServiceMembers: (id: string) => string[];
  perServiceMode: boolean;
  perServiceArtistIds: Record<string, string | null>;
  onTogglePerService: () => void;
  onChangeItemArtist: (serviceId: string, artistId: string | null) => void;
  onPick: (m: TeamMember | null) => void;
  onContinuePerService: () => void;
  onBackToMenu: () => void;
}) {
  const basketSize = basketServices.length;
  const canPickPerService = basketSize >= 2;
  const continueGradient = `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`;

  // Per-service mode — one stylist row per cart item, with a Continue button.
  if (perServiceMode && canPickPerService) {
    return (
      <div className="space-y-2.5">
        <div className="bg-card-bg border border-border-light rounded-3xl p-5">
          <p className="text-[12px] text-text-tertiary text-center mb-4">
            Pick a stylist for each service
          </p>
          <ul className="space-y-3">
            {basketServices.map((svc) => (
              <li key={svc.id} className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-medium text-foreground truncate">
                  {svc.name}
                </p>
                <CartArtistPicker
                  service={svc}
                  artistId={perServiceArtistIds[svc.id] ?? null}
                  activeMembers={activeMembers}
                  getServiceMembers={getServiceMembers}
                  onChange={(id) => onChangeItemArtist(svc.id, id)}
                />
              </li>
            ))}
          </ul>
        </div>
        <div className="text-center pt-1">
          <button
            onClick={onTogglePerService}
            className="text-[12px] font-medium text-text-secondary hover:text-foreground cursor-pointer underline underline-offset-2"
          >
            Use one stylist for everything
          </button>
        </div>
        <button
          onClick={onContinuePerService}
          className="w-full py-3 rounded-2xl text-[13px] font-semibold text-white cursor-pointer transition-all hover:opacity-90 hover:-translate-y-px shadow-[0_8px_20px_-8px_rgba(0,0,0,0.25)]"
          style={{ backgroundImage: continueGradient }}
        >
          Continue
        </button>
      </div>
    );
  }

  // Empty intersection — at least one service in the basket is restricted
  // to a set of artists that doesn't overlap with the others. Surface this
  // explicitly instead of silently leaving the user with no options.
  if (eligible.length === 0) {
    return (
      <div className="bg-card-bg border border-amber-200 rounded-3xl p-6 text-center space-y-3">
        <div
          className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
          style={{ backgroundColor: "#fef3c7" }}
        >
          <Users className="w-5 h-5 text-amber-700" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-foreground">No single artist can do all of these</h3>
          <p className="text-[13px] text-text-secondary mt-1.5 leading-snug max-w-md mx-auto">
            Pick a different stylist for each service, or remove a service to keep one artist on the booking.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <button
            onClick={onTogglePerService}
            className="px-5 py-2 rounded-full text-[13px] font-semibold text-white cursor-pointer"
            style={{
              backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
            }}
          >
            Pick per service
          </button>
          <button
            onClick={onBackToMenu}
            className="px-5 py-2 rounded-full text-[13px] font-semibold text-foreground bg-surface hover:bg-card-bg border border-border-light cursor-pointer"
          >
            Back to services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <button
        onClick={() => onPick(null)}
        className="w-full bg-card-bg border border-border-light rounded-2xl p-4 flex items-center gap-3 text-left hover:border-foreground/20 transition-colors cursor-pointer"
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Users className="w-5 h-5" style={{ color: primaryColor }} />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-foreground">No preference</p>
          <p className="text-[12px] text-text-tertiary">We&apos;ll match you with the next available artist</p>
        </div>
      </button>
      {eligible.map((m) => (
        <button
          key={m.id}
          onClick={() => onPick(m)}
          className="w-full bg-card-bg border border-border-light rounded-2xl p-4 flex items-center gap-3 text-left hover:border-foreground/20 transition-colors cursor-pointer"
        >
          {m.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.avatarUrl} alt={m.name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-semibold text-foreground/70"
              style={{ backgroundColor: nameColor(m.name) }}
            >
              {m.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-foreground">{m.name}</p>
            <p className="text-[12px] text-text-tertiary capitalize">{m.role}</p>
          </div>
        </button>
      ))}

      {canPickPerService && (
        <div className="text-center pt-2">
          <button
            onClick={onTogglePerService}
            className="text-[12px] font-medium text-text-secondary hover:text-foreground cursor-pointer underline underline-offset-2"
          >
            Different stylists for each service?
          </button>
        </div>
      )}
    </div>
  );
}

function DatePicker({
  primaryColor,
  selected,
  allowedWeekdays,
  onPick,
}: {
  primaryColor: string;
  selected: string | null;
  allowedWeekdays: number[] | null;
  onPick: (iso: string) => void;
}) {
  const [monthOffset, setMonthOffset] = useState(0);

  const { days, monthLabel } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const month = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const year = month.getFullYear();
    const monthIdx = month.getMonth();
    const first = new Date(year, monthIdx, 1);
    const startDay = first.getDay(); // 0=Sun
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
    const cells: { iso: string | null; day: number | null; past: boolean; today: boolean; disabled: boolean }[] = [];
    for (let i = 0; i < startDay; i++)
      cells.push({ iso: null, day: null, past: false, today: false, disabled: false });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, monthIdx, d);
      const iso = date.toISOString().slice(0, 10);
      const past = date < today;
      const isToday = date.getTime() === today.getTime();
      const weekday = date.getDay();
      const blockedByWeekday =
        allowedWeekdays != null && !allowedWeekdays.includes(weekday);
      cells.push({ iso, day: d, past, today: isToday, disabled: past || blockedByWeekday });
    }
    return {
      days: cells,
      monthLabel: month.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    };
  }, [monthOffset, allowedWeekdays]);

  return (
    <div className="bg-card-bg border border-border-light rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setMonthOffset((v) => Math.max(0, v - 1))}
          disabled={monthOffset === 0}
          className="p-1.5 rounded-lg text-text-secondary hover:bg-surface disabled:opacity-30 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-[14px] font-semibold text-foreground">{monthLabel}</p>
        <button
          onClick={() => setMonthOffset((v) => v + 1)}
          className="p-1.5 rounded-lg text-text-secondary hover:bg-surface cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[11px] text-text-tertiary mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((cell, i) => {
          if (!cell.iso) return <div key={i} />;
          const isSelected = selected === cell.iso;
          return (
            <button
              key={i}
              disabled={cell.disabled}
              onClick={() => onPick(cell.iso!)}
              className={`aspect-square rounded-lg text-[13px] font-medium tabular-nums cursor-pointer transition-colors relative ${
                isSelected
                  ? "text-white"
                  : cell.disabled
                    ? "text-text-tertiary/40 cursor-not-allowed"
                    : cell.today
                      ? "text-foreground bg-surface"
                      : "text-foreground hover:bg-surface"
              }`}
              style={isSelected ? { backgroundColor: primaryColor } : undefined}
            >
              {cell.day}
              {cell.today && !isSelected && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimePicker({
  primaryColor,
  duration,
  onPick,
}: {
  primaryColor: string;
  duration: number;
  onPick: (time: string) => void;
}) {
  // Mock availability: 9:00–17:00 in 30-min increments, fully open.
  const slots = useMemo(() => {
    const out: string[] = [];
    for (let m = 9 * 60; m + duration <= 17 * 60; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      out.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
    }
    return out;
  }, [duration]);

  return (
    <div className="bg-card-bg border border-border-light rounded-2xl p-4">
      <div className="grid grid-cols-3 gap-2">
        {slots.map((s) => {
          const end = addMinutes(s, duration);
          return (
            <button
              key={s}
              onClick={() => onPick(s)}
              className="px-3 py-2 rounded-lg border border-border-light text-[13px] font-medium text-foreground hover:border-foreground/30 hover:bg-surface cursor-pointer transition-colors"
              style={{ borderColor: undefined }}
            >
              <span className="block tabular-nums">{s}</span>
              <span className="block text-[10px] text-text-tertiary tabular-nums">– {end}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-text-tertiary text-center mt-3">
        Mock availability — real slots will reflect staff schedules.
      </p>
      {/* Hidden style sink to satisfy the linter about the unused arg. */}
      <span className="hidden" style={{ color: primaryColor }} />
    </div>
  );
}

function DetailsForm({
  flow,
  primaryColor,
  intakeQuestions,
  onChange,
  onIntakeChange,
  onSubmit,
}: {
  flow: FlowState;
  primaryColor: string;
  intakeQuestions: { service: Service; question: ServiceIntakeQuestion }[];
  onChange: (patch: Partial<FlowState>) => void;
  onIntakeChange: (questionId: string, value: string) => void;
  onSubmit: () => void;
}) {
  const requiredAnswered = intakeQuestions.every(({ question }) => {
    if (!question.required) return true;
    const v = (flow.intakeAnswers[question.id] ?? "").trim();
    return v.length > 0;
  });
  const canSubmit =
    flow.name.trim() && flow.email.trim() && flow.phone.trim() && requiredAnswered;
  const inputClass =
    "w-full px-3.5 py-2.5 bg-card-bg border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  // Group intake questions by service so the operator's structure carries through.
  const grouped = useMemo(() => {
    const map = new Map<string, { service: Service; questions: ServiceIntakeQuestion[] }>();
    for (const { service, question } of intakeQuestions) {
      if (!map.has(service.id)) map.set(service.id, { service, questions: [] });
      map.get(service.id)!.questions.push(question);
    }
    return Array.from(map.values());
  }, [intakeQuestions]);

  return (
    <div className="space-y-4">
      <div className="bg-card-bg border border-border-light rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-[12px] font-medium text-foreground block mb-1.5">Full name</label>
          <input
            autoFocus
            value={flow.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Your name"
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-[12px] font-medium text-foreground block mb-1.5">Email</label>
          <input
            type="email"
            value={flow.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="you@email.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-[12px] font-medium text-foreground block mb-1.5">Phone</label>
          <input
            type="tel"
            value={flow.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="0400 000 000"
            className={inputClass}
          />
        </div>
      </div>

      {grouped.map(({ service, questions }) => (
        <div key={service.id} className="bg-card-bg border border-border-light rounded-2xl p-5">
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.1em] mb-3">
            For {service.name}
          </p>
          <div className="space-y-4">
            {questions.map((q) => (
              <IntakeField
                key={q.id}
                question={q}
                value={flow.intakeAnswers[q.id] ?? ""}
                onChange={(v) => onIntakeChange(q.id, v)}
                inputClass={inputClass}
              />
            ))}
          </div>
        </div>
      ))}

      <button
        disabled={!canSubmit}
        onClick={onSubmit}
        className="w-full py-3 rounded-xl text-[14px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-opacity"
        style={{ backgroundColor: primaryColor }}
      >
        Confirm booking
      </button>
      <p className="text-[11px] text-text-tertiary text-center">
        By confirming, you agree to the cancellation policy.
      </p>
    </div>
  );
}

function IntakeField({
  question,
  value,
  onChange,
  inputClass,
}: {
  question: ServiceIntakeQuestion;
  value: string;
  onChange: (v: string) => void;
  inputClass: string;
}) {
  const label = (
    <label className="text-[12px] font-medium text-foreground block mb-1.5">
      {question.label}
      {question.required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
  const hint = question.hint && (
    <p className="text-[11px] text-text-tertiary mt-1">{question.hint}</p>
  );

  if (question.type === "longtext") {
    return (
      <div>
        {label}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={`${inputClass} resize-none`}
        />
        {hint}
      </div>
    );
  }
  if (question.type === "select") {
    return (
      <div>
        {label}
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          <option value="">Pick one…</option>
          {(question.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {hint}
      </div>
    );
  }
  if (question.type === "yesno") {
    return (
      <div>
        {label}
        <div className="flex items-center gap-2">
          {["Yes", "No"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-medium border cursor-pointer transition-colors ${
                value === opt
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-text-secondary border-border-light hover:text-foreground"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {hint}
      </div>
    );
  }
  if (question.type === "date") {
    return (
      <div>
        {label}
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
        {hint}
      </div>
    );
  }
  if (question.type === "number") {
    return (
      <div>
        {label}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
        {hint}
      </div>
    );
  }
  return (
    <div>
      {label}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
      {hint}
    </div>
  );
}

function ConfirmScreen({
  items,
  totalPrice,
  totalDuration,
  flow,
  businessName,
  primaryColor,
  members,
  onReset,
}: {
  items: {
    service: Service;
    variantId?: string;
    artistId?: string | null;
    addons: ServiceAddon[];
    price: number;
    basePrice: number;
    duration: number;
    baseDuration: number;
  }[];
  totalPrice: number;
  totalDuration: number;
  flow: FlowState;
  businessName: string;
  primaryColor: string;
  members: TeamMember[];
  onReset: () => void;
}) {
  if (items.length === 0) return null;
  // Any service in the basket flagged "requires confirmation" puts the
  // whole booking into pending state. The PRD §5.1 calls this out — the
  // copy and tone need to match what actually happened on the back end.
  const needsApproval = items.some((i) => i.service.requiresConfirmation);
  return (
    <div className="text-center py-6 space-y-5">
      <div
        className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
        style={{
          backgroundColor: needsApproval ? "#fef3c7" : `${primaryColor}20`,
          boxShadow: needsApproval ? "0 0 0 4px #fef3c780" : `0 0 0 4px ${primaryColor}1a`,
        }}
      >
        <Check
          className="w-8 h-8"
          style={{ color: needsApproval ? "#b45309" : primaryColor }}
        />
      </div>
      <div>
        <h3 className="text-[20px] font-bold text-foreground">
          {needsApproval ? "Request received" : "You're booked!"}
        </h3>
        <p className="text-[13px] text-text-secondary mt-1">
          {needsApproval
            ? `${businessName} will confirm your booking shortly. We'll email ${flow.email || "you"} as soon as it's approved.`
            : `A confirmation has been sent to ${flow.email || "your email"}.`}
        </p>
      </div>

      <div className="bg-card-bg border border-border-light rounded-2xl p-5 text-left space-y-3 max-w-md mx-auto">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-text-tertiary mb-1.5">
            {items.length === 1 ? "Service" : "Services"}
          </p>
          <ul className="space-y-2">
            {chainItems(items, flow.time).map(({ item, startAt }) => {
              const variant = item.variantId
                ? item.service.variants?.find((v) => v.id === item.variantId)
                : null;
              const artist = item.artistId
                ? members.find((m) => m.id === item.artistId)
                : null;
              const showArtist = flow.useArtistPerService;
              return (
                <li key={item.service.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[14px] font-medium text-foreground truncate">
                      {showArtist && startAt !== null && (
                        <span className="text-text-tertiary font-normal tabular-nums mr-1.5">
                          {minutesToHHMM(startAt)}
                        </span>
                      )}
                      {item.service.name}
                      {variant && (
                        <span className="text-text-tertiary font-normal"> · {variant.name}</span>
                      )}
                    </span>
                    <span className="text-[12px] text-text-tertiary tabular-nums whitespace-nowrap">
                      {item.baseDuration} min · ${item.basePrice}
                    </span>
                  </div>
                  {showArtist && (
                    <p className="text-[11.5px] text-text-tertiary mt-0.5">
                      with {artist?.name ?? "any stylist"}
                    </p>
                  )}
                  {item.addons.length > 0 && (
                    <ul className="mt-1 ml-2 pl-3 border-l border-border-light space-y-0.5">
                      {item.addons.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-baseline justify-between gap-3 text-[12px]"
                        >
                          <span className="text-text-secondary truncate">+ {a.name}</span>
                          <span className="text-text-tertiary tabular-nums whitespace-nowrap">
                            {a.duration} min · +${a.price}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border-light">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-text-tertiary">When</p>
            <p className="text-[14px] font-semibold text-foreground">
              {flow.date ? formatDate(flow.date) : "—"}
            </p>
            <p className="text-[12px] text-text-secondary tabular-nums">
              {flow.time} · {totalDuration} min
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-text-tertiary">With</p>
            <p className="text-[14px] font-semibold text-foreground">
              {flow.artist?.name ?? "Any artist"}
            </p>
            <p className="text-[12px] text-text-secondary">{businessName}</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-border-light">
          <p className="text-[11px] uppercase tracking-wide text-text-tertiary">Total</p>
          <p className="text-[16px] font-bold text-foreground tabular-nums">${totalPrice}</p>
        </div>
      </div>

      <button
        onClick={onReset}
        className="text-[13px] font-medium text-text-secondary hover:text-foreground cursor-pointer flex items-center gap-1.5 mx-auto"
      >
        <CalendarIcon className="w-3.5 h-3.5" /> Book another
      </button>
    </div>
  );
}

// ── Style panel + alternative card layouts ──────────────────────────

function StylePanel({
  primaryColor,
  onPrimaryColorChange,
  logoUrl,
  onLogoUrlChange,
  coverImage,
  onCoverImageChange,
  fontPairing,
  onFontPairingChange,
  layout,
  onLayoutChange,
}: {
  primaryColor: string;
  onPrimaryColorChange: (hex: string) => void;
  logoUrl: string;
  onLogoUrlChange: (url: string) => void;
  coverImage: string;
  onCoverImageChange: (url: string) => void;
  fontPairing: string;
  onFontPairingChange: (id: FontPairingId) => void;
  layout: Layout;
  onLayoutChange: (l: Layout) => void;
}) {
  return (
    <div className="space-y-5">
      <ColorField
        label="Brand color"
        hint="Buttons, highlights, and selected states."
        value={primaryColor}
        onChange={onPrimaryColorChange}
      />

      <LogoUpload
        value={logoUrl}
        onChange={onLogoUrlChange}
        hint="Square image works best. Falls back to your business name initial."
      />

      <CoverImageUpload value={coverImage} onChange={onCoverImageChange} />

      <FontPairingPicker value={fontPairing} onChange={onFontPairingChange} />

      <div>
        <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
          Layout
        </p>
        <div className="space-y-2">
          {(["classic", "compact", "grid"] as const).map((l) => {
            const selected = layout === l;
            return (
              <button
                key={l}
                onClick={() => onLayoutChange(l)}
                className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-3 ${
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border-light hover:border-foreground/20"
                }`}
              >
                <div className="w-14 flex-shrink-0">
                  <LayoutSwatch kind={l} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-foreground capitalize">{l}</p>
                  <p className="text-[11px] text-text-tertiary">
                    {l === "classic" && "Image, info, price"}
                    {l === "compact" && "Tight list, no image"}
                    {l === "grid" && "Image-forward 2-col"}
                  </p>
                </div>
                {selected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LayoutSwatch({ kind }: { kind: Layout }) {
  if (kind === "compact") {
    return (
      <div className="h-12 bg-surface rounded space-y-1 p-1.5">
        <div className="h-1.5 bg-border-light rounded w-full" />
        <div className="h-1.5 bg-border-light rounded w-full" />
        <div className="h-1.5 bg-border-light rounded w-full" />
      </div>
    );
  }
  if (kind === "grid") {
    return (
      <div className="h-12 grid grid-cols-2 gap-1">
        <div className="bg-surface rounded" />
        <div className="bg-surface rounded" />
      </div>
    );
  }
  return (
    <div className="h-12 bg-surface rounded p-1.5 flex gap-1.5">
      <div className="w-6 h-full bg-border-light rounded" />
      <div className="flex-1 space-y-1 py-0.5">
        <div className="h-1.5 bg-border-light rounded w-3/4" />
        <div className="h-1 bg-border-light/60 rounded w-full" />
      </div>
    </div>
  );
}

function ServiceCardCompact({
  service,
  providers,
  isAnyone,
  primaryColor,
  selected,
  onToggle,
  headingClass = "",
}: {
  service: Service;
  providers: { id: string; name: string }[];
  isAnyone: boolean;
  primaryColor: string;
  selected: boolean;
  onToggle: () => void;
  headingClass?: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors cursor-pointer ${
        selected ? "" : "hover:bg-surface/40"
      }`}
      style={selected ? { backgroundColor: `${primaryColor}10` } : undefined}
    >
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] font-semibold text-foreground truncate ${headingClass}`}>{service.name}</p>
        <div className="flex items-center gap-3 text-[12px] text-text-tertiary mt-0.5">
          <span className="tabular-nums flex items-center gap-1">
            <Clock className="w-3 h-3" /> {service.duration} min
          </span>
          {providers.length > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {isAnyone ? "Any" : providers.length === 1 ? providers[0].name : `${providers.length}`}
            </span>
          )}
        </div>
      </div>
      <PriceDisplay service={service} className="text-[14px] font-bold text-foreground flex-shrink-0" />
      <AddPill selected={selected} primaryColor={primaryColor} />
    </button>
  );
}

function ServiceCardGrid({
  service,
  providers,
  isAnyone,
  primaryColor,
  selected,
  onToggle,
  headingClass = "",
}: {
  service: Service;
  providers: { id: string; name: string }[];
  isAnyone: boolean;
  primaryColor: string;
  selected: boolean;
  onToggle: () => void;
  headingClass?: string;
}) {
  const initial = service.name.charAt(0).toUpperCase();
  return (
    <button
      onClick={onToggle}
      className={`bg-card-bg border rounded-3xl overflow-hidden text-left transition-all cursor-pointer flex flex-col shadow-[0_4px_16px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_-10px_rgba(0,0,0,0.12)] ${
        selected ? "border-2" : "border-border-light hover:border-foreground/20"
      }`}
      style={selected ? { borderColor: primaryColor } : undefined}
    >
      {service.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={service.imageUrl}
          alt={service.name}
          className="w-full aspect-square object-cover"
        />
      ) : (
        <div
          className="w-full aspect-square flex items-center justify-center text-4xl font-bold text-foreground/50"
          style={{
            backgroundImage: `linear-gradient(135deg, ${primaryColor}30 0%, ${primaryColor}10 100%)`,
          }}
        >
          {initial}
        </div>
      )}
      <div className="p-3 flex-1 flex flex-col">
        <p className={`text-[14px] font-semibold text-foreground truncate ${headingClass}`}>{service.name}</p>
        <div className="flex items-center gap-2 text-[11px] text-text-tertiary mt-0.5">
          <span className="tabular-nums">{service.duration}min</span>
          <span>·</span>
          <span>
            {isAnyone ? "Any" : providers.length === 1 ? providers[0].name : `${providers.length}`}
          </span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <PriceDisplay service={service} className="text-[15px] font-bold text-foreground" />
          <AddPill selected={selected} primaryColor={primaryColor} />
        </div>
      </div>
    </button>
  );
}

// ── Category anchor pills ────────────────────────────────────────────


