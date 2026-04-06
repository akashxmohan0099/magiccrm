"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Calendar, Receipt, Inbox,
  FolderKanban, Megaphone, Headphones, FileText,
  MessageCircle, CreditCard, Zap, BarChart3, Package,
  Wand2, Settings, Bell, Search, Command, Menu, Sparkles, SlidersHorizontal,
  Crown, Camera, FileInput, ClipboardList, Gift, UserCheck,
  Store, Globe, Lightbulb, Puzzle, UsersRound,
  Ticket, CalendarRange, Building2, ScrollText, Wrench, Banknote, ImagePlus, ListOrdered,
  NotebookPen, LogOut, Loader2, User, Sun, Moon, Monitor,
} from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { useClientsStore } from "@/store/clients";
import { useBookingsStore } from "@/store/bookings";
import { useLeadsStore } from "@/store/leads";
import { useInvoicesStore } from "@/store/invoices";
import { useJobsStore } from "@/store/jobs";
import { useProductsStore } from "@/store/products";
import { useTeamStore } from "@/store/team";
import { computeEnabledModuleIds } from "@/lib/module-registry";
import { generateSampleData } from "@/lib/sample-data-generator";
import { useEnabledModules, useEnabledAddons } from "@/hooks/useFeature";
import { useEffectivePresentation } from "@/hooks/useResolvedWorkspace";
import { useHydration } from "@/hooks/useHydration";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { useVocabulary } from "@/hooks/useVocabulary";
import { ALWAYS_ON_MODULES, getModuleDisplayName, getModuleBySlug } from "@/lib/module-registry";
import { ModuleConfigurator } from "@/components/ui/ModuleConfigurator";
import { ToastContainer } from "@/components/ui/Toast";
import { useTheme } from "@/hooks/useTheme";
import { AppPreloader } from "@/components/ui/AppPreloader";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { CommandPalette } from "@/components/ui/CommandPalette";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, Calendar, Receipt, Inbox, FolderKanban,
  Megaphone, Headphones, FileText, MessageCircle,
  CreditCard, Zap, BarChart3, Package, Wand2,
  Crown, Camera, FileInput, ClipboardList, Gift, UserCheck,
  Store, Globe, Lightbulb, Puzzle, UsersRound,
  Ticket, CalendarRange, Building2, ScrollText, Wrench, Banknote, ImagePlus, ListOrdered,
  NotebookPen,
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const hydrated = useHydration();

  if (!hydrated) {
    return <AppPreloader />;
  }

  return (
    <>
      <DashboardShell>{children}</DashboardShell>
      <ToastContainer />
    </>
  );
}

function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const pathname = usePathname();
  const businessContext = useOnboardingStore((s) => s.businessContext);
  const selectedPersona = useOnboardingStore((s) => s.selectedPersona);
  const enabledModules = useEnabledModules();
  const enabledAddons = useEnabledAddons();
  const presentation = useEffectivePresentation();
  const vocab = useVocabulary();
  const { user, workspaceId, loading: authLoading, signOut, refreshMember } = useAuth();
  const { syncing } = useSupabaseSync({ workspaceId, authLoading });
  const [searchFocused, setSearchFocused] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [repairingWorkspace, setRepairingWorkspace] = useState(false);
  const [repairWorkspaceError, setRepairWorkspaceError] = useState("");
  const teamSize = useOnboardingStore((s) => s.teamSize);
  const selectedIndustry = useOnboardingStore((s) => s.selectedIndustry);
  const needs = useOnboardingStore((s) => s.needs);
  const discoveryAnswers = useOnboardingStore((s) => s.discoveryAnswers);

  // Seed sample data when stores are empty — runs on any dashboard route.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    const allEmpty =
      !useClientsStore.getState().clients.length &&
      !useBookingsStore.getState().bookings.length;
    if (!allEmpty) return;
    seeded.current = true;

    const enabledIds = selectedIndustry
      ? Array.from(computeEnabledModuleIds(needs, discoveryAnswers))
      : ["client-database", "bookings-calendar", "communication", "quotes-invoicing", "leads-pipeline", "jobs-projects", "team"];

    const sample = generateSampleData({
      industryId: selectedIndustry || "generic",
      personaId: selectedPersona || "generic",
      businessName: businessContext.businessName || "My Business",
      enabledModuleIds: enabledIds,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = (x: unknown) => x as any;
    if (sample.clients.length && !useClientsStore.getState().clients.length) useClientsStore.setState({ clients: sample.clients.map(a) });
    if (sample.products.length && !useProductsStore.getState().products.length) useProductsStore.setState({ products: sample.products.map(a) });
    if (sample.leads.length && !useLeadsStore.getState().leads.length) useLeadsStore.setState({ leads: sample.leads.map(a) });
    if (sample.bookings.length && !useBookingsStore.getState().bookings.length) useBookingsStore.setState({ bookings: sample.bookings.map(a) });
    if (sample.invoices.length && !useInvoicesStore.getState().invoices.length) useInvoicesStore.setState({ invoices: sample.invoices.map(a) });
    if (sample.jobs.length && !useJobsStore.getState().jobs.length) useJobsStore.setState({ jobs: sample.jobs.map(a) });
    if (sample.team?.length && !useTeamStore.getState().members.length) useTeamStore.setState({ members: sample.team.map(a) });
  }, [selectedIndustry, selectedPersona, businessContext.businessName, needs, discoveryAnswers]);

  const handleWorkspaceRepair = async () => {
    if (repairingWorkspace) return;

    setRepairWorkspaceError("");
    setRepairingWorkspace(true);

    try {
      const res = await fetch("/api/auth/bootstrap-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceName: businessContext.businessName,
          industry: businessContext.industry,
          persona: selectedPersona,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setRepairWorkspaceError(result.error || "Failed to finish workspace setup.");
        return;
      }

      await refreshMember();
      router.refresh();
    } catch (_error) {
      setRepairWorkspaceError("Failed to finish workspace setup.");
    } finally {
      setRepairingWorkspace(false);
    }
  };

  // Grace period: don't show "Workspace not found" for 4 seconds after mount.
  // This covers auth init + member fetch retries without flashing the error screen.
  const [graceExpired, setGraceExpired] = useState(false);
  useEffect(() => {
    if (workspaceId) return; // No grace needed if workspace already found
    const t = setTimeout(() => setGraceExpired(true), 4000);
    return () => clearTimeout(t);
  }, [workspaceId]);

  // Show preloader while anything is still resolving
  if (syncing || authLoading || (!workspaceId && !graceExpired)) {
    return <AppPreloader />;
  }

  // If user has no workspace after grace period, show setup prompt.
  // All recovery actions use plain <a> tags or window.location to guarantee
  // navigation even if React state is broken.
  if (!workspaceId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-sm">
          <h2 className="text-lg font-semibold text-foreground mb-2">Workspace not found</h2>
          <p className="text-sm text-text-secondary mb-6">
            {user
              ? "Your workspace hasn't been set up yet. Let's fix that."
              : "Sign in or complete onboarding to access your workspace."}
          </p>
          {repairWorkspaceError && (
            <p className="text-sm text-red-600 mb-4">{repairWorkspaceError}</p>
          )}
          {user && (
            <div className="space-y-3">
              <button
                onClick={handleWorkspaceRepair}
                disabled={repairingWorkspace}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed w-full cursor-pointer"
              >
                {repairingWorkspace ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Finishing setup...
                  </>
                ) : (
                  "Finish setting up workspace"
                )}
              </button>
              <a
                href="/onboarding"
                className="inline-flex items-center justify-center px-6 py-3 border border-border-light rounded-xl text-sm font-medium text-foreground hover:bg-surface transition-colors w-full"
              >
                Start fresh with onboarding
              </a>
              <button
                onClick={() => {
                  // Use direct navigation as fallback — signOut may fail if session is broken
                  supabase.auth.signOut().finally(() => {
                    window.location.href = "/login";
                  });
                }}
                className="text-sm text-text-tertiary hover:text-foreground transition-colors cursor-pointer"
              >
                Sign out and try a different account
              </button>
            </div>
          )}
          {!user && (
            <a
              href="/login"
              className="text-sm text-text-secondary hover:text-foreground transition-colors"
            >
              Go to login
            </a>
          )}
        </div>
      </div>
    );
  }

  // ── All enabled modules in one list ──────────────────────
  const sidebarOrder = presentation?.sidebarOrder;
  const moduleItems = enabledModules.map((mod) => ({
    href: `/dashboard/${mod.slug}`,
    label: getModuleDisplayName(mod, vocab),
    icon: ICON_MAP[mod.icon] || LayoutDashboard,
    slug: mod.slug,
  }));

  // Sort by blueprint sidebar order when available
  if (sidebarOrder && sidebarOrder.length > 0) {
    moduleItems.sort((a, b) => {
      const ai = sidebarOrder.indexOf(a.slug);
      const bi = sidebarOrder.indexOf(b.slug);
      // Items not in sidebarOrder go to the end, preserving their relative order
      const aIdx = ai === -1 ? sidebarOrder.length : ai;
      const bIdx = bi === -1 ? sidebarOrder.length : bi;
      return aIdx - bIdx;
    });
  }

  // ── Enabled add-ons ──
  const addonItems = enabledAddons.map((mod) => ({
    href: `/dashboard/${mod.slug}`,
    label: getModuleDisplayName(mod, vocab),
    icon: ICON_MAP[mod.icon] || Puzzle,
    slug: mod.slug,
  }));

  // Sort add-ons by blueprint sidebar order when available
  if (sidebarOrder && sidebarOrder.length > 0) {
    addonItems.sort((a, b) => {
      const ai = sidebarOrder.indexOf(a.slug);
      const bi = sidebarOrder.indexOf(b.slug);
      const aIdx = ai === -1 ? sidebarOrder.length : ai;
      const bIdx = bi === -1 ? sidebarOrder.length : bi;
      return aIdx - bIdx;
    });
  }

  const navGroups = [
    { label: "", items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/ai", label: "MagicAI", icon: Sparkles },
    ] },
    { label: "", items: moduleItems },
    // Add-ons (only if user has enabled any)
    ...(addonItems.length > 0 ? [{ label: "Add-ons", items: addonItems }] : []),
    { label: "", items: [
      { href: "/dashboard/addons", label: "Modules & Add-ons", icon: Puzzle },
      { href: "/dashboard/builder", label: "Build Your Own", icon: Wand2 },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ], isBottom: true },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[240px] bg-card-bg border-r border-border-light flex-col fixed h-full z-20">
        <SidebarContent
          businessName={businessContext.businessName}
          navGroups={navGroups}
          pathname={pathname}
          onNavClick={() => {}}
        />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.1 }}
              className="fixed inset-y-0 left-0 w-[240px] bg-card-bg border-r border-border-light flex flex-col z-40 lg:hidden"
            >
              <SidebarContent
                businessName={businessContext.businessName}
                navGroups={navGroups}
                pathname={pathname}
                onNavClick={() => setSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex-1 ml-0 lg:ml-[240px] min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-background/50 backdrop-blur-sm border-b border-border-light px-4 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer transition-colors flex-shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className={`relative transition-all duration-200 w-full lg:w-auto ${searchFocused ? "lg:w-80" : "lg:w-60"}`}>
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${searchFocused ? "text-foreground" : "text-text-secondary"}`} />
              <input
                type="text"
                placeholder="Search contacts, invoices, projects..."
                readOnly
                onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full pl-10 pr-12 py-2.5 bg-surface border border-border-light rounded-[10px] text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 transition-all cursor-pointer"
              />
              {!searchFocused && (
                <kbd
                  onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded-lg bg-surface border border-border-light text-[11px] font-medium text-text-tertiary hover:bg-foreground/5 transition-colors cursor-pointer"
                >
                  <Command className="w-3 h-3" />K
                </kbd>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <NavBarConfigurator pathname={pathname} vocab={vocab} />
            <div className="relative">
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-2 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer transition-colors"
              >
                <Bell className="w-[17px] h-[17px]" />
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-72 bg-card-bg border border-border-light rounded-xl shadow-lg z-40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border-light">
                      <p className="text-[13px] font-semibold text-foreground">Notifications</p>
                    </div>
                    <div className="px-4 py-6 text-center">
                      <Bell className="w-6 h-6 text-text-tertiary mx-auto mb-2" />
                      <p className="text-[13px] text-text-tertiary">No new notifications</p>
                      <p className="text-[11px] text-text-tertiary mt-1">You&apos;re all caught up.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="w-px h-5 bg-border-light mx-1" />
            <div className="relative">
              <button
                onClick={() => setAvatarMenuOpen((o) => !o)}
                className="w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer shadow-[0_1px_3px_rgba(91,91,214,0.15)]"
              >
                <span className="text-[11px] font-bold text-white">
                  {(user?.user_metadata?.full_name || user?.email || "U")[0].toUpperCase()}
                </span>
              </button>
              {avatarMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setAvatarMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-card-bg border border-border-light rounded-xl shadow-lg z-40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border-light">
                      <p className="text-[13px] font-semibold text-foreground truncate">
                        {user?.user_metadata?.full_name || "Account"}
                      </p>
                      <p className="text-[11px] text-text-tertiary truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard/profile"
                        onClick={() => setAvatarMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-text-secondary hover:text-foreground hover:bg-surface transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      <button
                        onClick={async () => {
                          setAvatarMenuOpen(false);
                          await signOut();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-text-secondary hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <ErrorBoundary>
          <div className="p-4 lg:p-8 min-w-0 overflow-x-hidden">{children}</div>
        </ErrorBoundary>
        {/* Add bottom padding on mobile for bottom nav */}
        <div className="h-16 lg:hidden" />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card-bg border-t border-border-light z-20 lg:hidden">
        <div className="flex items-center justify-around h-14">
          {[
            { href: "/dashboard", label: "Home", icon: LayoutDashboard },
            { href: "/dashboard/clients", label: vocab.clients || "Clients", icon: Users },
            { href: "/dashboard/bookings", label: "Calendar", icon: Calendar },
            { href: "/dashboard/communication", label: "Messages", icon: MessageCircle },
            { href: "/dashboard/invoicing", label: "Invoices", icon: Receipt },
          ].map((item) => {
            const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 min-w-[56px] transition-colors ${
                  isActive ? "text-foreground" : "text-text-tertiary"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <CommandPalette />
    </div>
  );
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  isBottom?: boolean;
}

function SidebarContent({
  businessName,
  navGroups,
  pathname,
  onNavClick,
}: {
  businessName: string;
  navGroups: NavGroup[];
  pathname: string;
  onNavClick: () => void;
}) {
  const mainGroups = navGroups.filter((g) => !g.isBottom);
  const bottomGroups = navGroups.filter((g) => g.isBottom);

  return (
    <>
      {/* Logo */}
      <div className="px-5 py-4 border-b border-border-light">
        <Link href="/dashboard" className="flex items-center gap-2.5 group" onClick={onNavClick}>
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--logo-green)" }}>
            <div className="w-3 h-3 bg-card-bg rounded-[3px]" />
          </div>
          <h1 className="font-bold text-foreground text-[13px] tracking-tight leading-tight">
            {businessName || "Magic"}
          </h1>
        </Link>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {mainGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-5" : ""}>
            {group.label && (
              <p className="px-3 mb-1.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavClick}
                    className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 group ${
                      isActive
                        ? "text-foreground"
                        : "text-text-secondary hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 bg-primary-muted rounded-xl"
                        transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
                      />
                    )}
                    {isActive && (
                      <motion.div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary rounded-r-full"
                        layoutId="sidebar-indicator"
                        transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
                      />
                    )}
                    <item.icon className="w-[15px] h-[15px] relative z-10 flex-shrink-0" />
                    <span className="relative z-10 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: Settings + Create Your Own */}
      <div className="px-3 py-3 border-t border-border-light space-y-0.5">
        {bottomGroups.map((group) =>
          group.items.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavClick}
                className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                  isActive ? "text-foreground bg-surface" : "text-text-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="w-[15px] h-[15px] flex-shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto text-[10px] font-semibold bg-primary text-foreground px-1.5 py-0.5 rounded-full leading-none">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}

/** Renders the Customize button in the nav bar — auto-detects which module page you're on */
function NavBarConfigurator({ pathname, vocab }: { pathname: string; vocab: Parameters<typeof getModuleDisplayName>[1] }) {
  // Dashboard home — show Add Widget button
  if (pathname === "/dashboard") {
    return <DashboardCustomizeButton />;
  }

  // Extract slug from /dashboard/[slug] or /dashboard/[slug]/...
  const match = pathname.match(/^\/dashboard\/([a-z0-9-]+)/);
  if (!match) return null;

  const slug = match[1];
  // Skip non-module pages
  if (["settings", "builder", "addons"].includes(slug)) return null;

  const mod = getModuleBySlug(slug);
  if (!mod) return null;

  const displayName = getModuleDisplayName(mod, vocab);

  return <ModuleConfigurator moduleId={mod.id} moduleName={displayName} />;
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const options = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  const current = options.find((o) => o.value === theme) || options[2];
  const CurrentIcon = current.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-2 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer transition-colors"
        aria-label="Toggle theme"
      >
        <CurrentIcon className="w-[17px] h-[17px]" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-36 bg-card-bg border border-border-light rounded-xl shadow-lg z-40 overflow-hidden py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setTheme(opt.value); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2 text-[13px] transition-colors cursor-pointer ${
                  theme === opt.value
                    ? "text-foreground font-medium bg-surface"
                    : "text-text-secondary hover:text-foreground hover:bg-surface"
                }`}
              >
                <opt.icon className="w-4 h-4" />
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DashboardCustomizeButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("dashboard:toggle-edit"))}
      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface border border-border-light rounded-xl text-xs font-medium text-text-secondary hover:text-foreground hover:border-foreground/15 cursor-pointer transition-all"
    >
      <SlidersHorizontal className="w-3.5 h-3.5" /> Customize
    </button>
  );
}
