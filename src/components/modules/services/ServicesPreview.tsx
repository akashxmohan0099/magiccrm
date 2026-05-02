"use client";

import { useState, useMemo } from "react";
import { Maximize2, Palette } from "lucide-react";
import { useServicesStore } from "@/store/services";
import { resolveServiceCategoryName } from "@/lib/services/category";
import { useTeamStore } from "@/store/team";
import { useSettingsStore } from "@/store/settings";
import { useAuth } from "@/hooks/useAuth";
import {
  Service,
  TeamMember,
  ServiceIntakeQuestion,
} from "@/types/models";
import {
  resolvePrice,
  resolveDuration,
  isPromoActive,
} from "@/lib/services/price";
import { SlideOver } from "@/components/ui/SlideOver";
import {
  fontClassesFor,
  type FontPairingId,
} from "@/components/ui/FontPairing";
import { UNCATEGORIZED } from "./preview/helpers";
import type { Layout, Step, FlowState } from "./preview/types";
import { Header } from "./preview/Header";
import { BackBar } from "./preview/BackBar";
import { CategoryAnchors } from "./preview/CategoryAnchors";
import { FeaturedRow } from "./preview/FeaturedRow";
import { BasketArtistPicker } from "./preview/steps/BasketArtistPicker";
import { Schedule } from "./preview/steps/Schedule";
import { DetailsForm } from "./preview/steps/DetailsForm";
import { ConfirmScreen } from "./preview/steps/ConfirmScreen";
import { ConfigureServiceModal } from "./preview/ConfigureServiceModal";
import { CartSidebar } from "./preview/CartSidebar";
import { ServiceMenu } from "./preview/ServiceMenu";
import { StylePanel } from "./preview/StylePanel";
import {
  NarrowStyleDrawer,
  LeftPreviewPanel,
  FullscreenShell,
} from "./preview/Shells";

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

  const flow = (
    <BookingFlow
      layout={layout}
      coverImage={coverImage}
      fontPairing={fontPairing}
    />
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




// ── Booking flow ────────────────────────────────────────────────────




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
          // Pass startAt once the operator picks a slot so dynamic-pricing
          // rules (off-peak / premium hours) actually kick in inside the
          // preview — matching the real public flow.
          startAt:
            flow.date && flow.time ? `${flow.date}T${flow.time}:00` : undefined,
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
    [
      basketResolved,
      flow.artist,
      flow.useArtistPerService,
      flow.date,
      flow.time,
      getMemberPriceOverride,
    ],
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

  // Per-service booking-window gates (mirrors /book/[slug]/page.tsx). The
  // basket binds the operator's preview to the most restrictive value:
  // MAX of minNoticeHours (latest "earliest bookable") and MIN of
  // maxAdvanceDays (earliest "latest bookable").
  const previewMinDate = useMemo<Date | undefined>(() => {
    if (basketServices.length === 0) return undefined;
    let maxNotice = 0;
    for (const svc of basketServices) {
      const n = svc.minNoticeHours;
      if (typeof n === "number" && n > maxNotice) maxNotice = n;
    }
    if (maxNotice <= 0) return undefined;
    const d = new Date();
    d.setHours(d.getHours() + maxNotice);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [basketServices]);

  const previewMaxDate = useMemo<Date | undefined>(() => {
    if (basketServices.length === 0) return undefined;
    let minAdvance = Infinity;
    for (const svc of basketServices) {
      const a = svc.maxAdvanceDays;
      if (typeof a === "number" && a > 0 && a < minAdvance) minAdvance = a;
    }
    if (!Number.isFinite(minAdvance)) return undefined;
    const d = new Date();
    d.setDate(d.getDate() + minAdvance);
    d.setHours(0, 0, 0, 0);
    return d;
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
      setStep("schedule");
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
              else if (step === "schedule") {
                setStep(eligibleArtists.length <= 1 ? "menu" : "artist");
              } else if (step === "details") setStep("schedule");
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
                setStep("schedule");
              }}
              onContinuePerService={() => setStep("schedule")}
              onBackToMenu={() => setStep("menu")}
            />
          )}

          {step === "schedule" && (
            <Schedule
              primaryColor={primaryColor}
              duration={totalDuration}
              selectedDate={flow.date}
              selectedTime={flow.time}
              allowedWeekdays={allowedWeekdays}
              minDate={previewMinDate}
              maxDate={previewMaxDate}
              onPickDate={(date) => {
                // Picking a new date in the calendar resets any pre-existing
                // time so the operator doesn't carry a stale slot through.
                setFlow((f) => ({ ...f, date, time: null }));
              }}
              onPickTime={(time) => {
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
              basketServices={basketServices}
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




// ── Style panel + alternative card layouts ──────────────────────────

