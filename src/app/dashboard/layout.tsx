"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Calendar, Inbox,
  FolderKanban, MessageCircle, CreditCard, Zap, Package,
  Settings, Bell, Search, Command, Menu,
  FileText, UsersRound, Megaphone, BarChart3, Ticket,
  Gift, Lightbulb, UserCheck, ScrollText, Crown, FileSignature,
  LogOut, Loader2, User, Puzzle,
} from "lucide-react";
import { useSettingsStore } from "@/store/settings";
import { ADDON_MODULES } from "@/lib/addon-modules";
import { useHydration } from "@/hooks/useHydration";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase";
import { ToastContainer } from "@/components/ui/Toast";
import { AppPreloader } from "@/components/ui/AppPreloader";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { seedAllStores } from "@/lib/seed-data";

// ── Icon map for addon modules ──
const ADDON_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3, Megaphone, Ticket, Gift, Lightbulb, UserCheck, ScrollText, Crown, FileSignature,
};

// ── Fixed navigation groups ────────────────────────────────
const navGroups: NavGroup[] = [
  {
    label: "",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Daily Workflow",
    items: [
      { href: "/dashboard/communications", label: "Communications", icon: MessageCircle },
      { href: "/dashboard/inquiries", label: "Inquiries", icon: Inbox },
      { href: "/dashboard/bookings", label: "Bookings", icon: FolderKanban },
      { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
      { href: "/dashboard/clients", label: "Clients", icon: Users },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
    ],
  },
  {
    label: "Setup",
    items: [
      { href: "/dashboard/services", label: "Services", icon: Package },
      { href: "/dashboard/forms", label: "Forms", icon: FileText },
      { href: "/dashboard/automations", label: "Automations", icon: Zap },
      { href: "/dashboard/teams", label: "Teams", icon: UsersRound },
    ],
  },
];

const bottomItems: NavItem[] = [
  { href: "/dashboard/addons", label: "Modules", icon: Puzzle },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const mobileNavItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/communications", label: "Messages", icon: MessageCircle },
  { href: "/dashboard/bookings", label: "Bookings", icon: FolderKanban },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
];

// ── Types ──────────────────────────────────────────────────
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// ── Root layout ────────────────────────────────────────────
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

// ── Shell ──────────────────────────────────────────────────
function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const pathname = usePathname();
  const settings = useSettingsStore((s) => s.settings);
  const businessName = settings?.businessName || "Magic";
  const { user, workspaceId, loading: authLoading, signOut, refreshMember } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [repairingWorkspace, setRepairingWorkspace] = useState(false);
  const [repairWorkspaceError, setRepairWorkspaceError] = useState("");
  const { syncing } = useSupabaseSync({ workspaceId, authLoading });

  useRealtimeSync({
    workspaceId,
    enabled: !authLoading && !syncing && !!workspaceId,
  });

  // Seed sample data when no authenticated workspace exists.
  // Runs immediately — seedAllStores() checks if stores are already populated.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    // Wait for auth to settle
    if (authLoading) return;
    // If we have a real authenticated workspace, don't seed
    if (workspaceId && user) return;
    // No real workspace — seed demo data immediately
    seeded.current = true;
    seedAllStores();
  }, [authLoading, user, workspaceId]);

  const handleWorkspaceRepair = async () => {
    if (repairingWorkspace) return;

    setRepairWorkspaceError("");
    setRepairingWorkspace(true);

    try {
      const res = await fetch("/api/auth/bootstrap-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceName: businessName }),
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
  const [graceExpired, setGraceExpired] = useState(false);
  useEffect(() => {
    if (workspaceId) return;
    const t = setTimeout(() => setGraceExpired(true), 4000);
    return () => clearTimeout(t);
  }, [workspaceId]);

  // Demo mode: no authenticated user and no workspace from Supabase.
  // This covers incognito, first visit, and local dev without Supabase.
  const isDemoMode = !workspaceId && !user && !authLoading;

  // Show preloader while anything is still resolving
  if (authLoading || syncing || (!workspaceId && !graceExpired && !isDemoMode)) {
    return <AppPreloader />;
  }

  // If user has no workspace after grace period, show setup prompt (skip in demo mode)
  if (!workspaceId && !isDemoMode) {
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[240px] sidebar-glass border-r border-border-light flex-col fixed h-full z-20">
        <SidebarContent
          businessName={businessName}
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
                businessName={businessName}
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
            <div className={`relative transition-all duration-200 w-full max-w-[calc(100vw-140px)] sm:max-w-none lg:w-auto ${searchFocused ? "lg:w-80" : "lg:w-60"}`}>
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${searchFocused ? "text-foreground" : "text-text-secondary"}`} />
              <input
                type="text"
                placeholder="Search clients, bookings, payments..."
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
                  <div className="absolute right-0 top-full mt-1 w-[calc(100vw-2rem)] sm:w-72 max-w-sm bg-card-bg border border-border-light rounded-xl shadow-lg z-40 overflow-hidden">
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
                  <div className="absolute right-0 top-full mt-1 w-56 max-w-[calc(100vw-2rem)] bg-card-bg border border-border-light rounded-xl shadow-lg z-40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border-light">
                      <p className="text-[13px] font-semibold text-foreground truncate">
                        {user?.user_metadata?.full_name || businessName || "Account"}
                      </p>
                      <p className="text-[11px] text-text-tertiary truncate">{user?.email || (isDemoMode ? "Demo Mode" : "")}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setAvatarMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-text-secondary hover:text-foreground hover:bg-surface transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <button
                        onClick={async () => {
                          setAvatarMenuOpen(false);
                          if (user) {
                            await signOut();
                          } else {
                            window.location.href = "/login";
                          }
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
          {mobileNavItems.map((item) => {
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

// ── Sidebar ────────────────────────────────────────────────
function SidebarContent({
  businessName,
  pathname,
  onNavClick,
}: {
  businessName: string;
  pathname: string;
  onNavClick: () => void;
}) {
  const teamSize = useSettingsStore((s) => s.settings?.teamSize);
  const enabledAddons = useSettingsStore((s) => s.enabledAddons);
  const activeAddons = ADDON_MODULES.filter((addon) =>
    enabledAddons.includes(addon.id)
  );
  const showTeams = teamSize ? teamSize !== "solo" : true;
  const displayGroups = navGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => showTeams || item.href !== "/dashboard/teams"),
  }));

  return (
    <>
      {/* Logo */}
      <div className="px-5 py-4 border-b border-border-light">
        <Link href="/dashboard" className="flex items-center gap-2.5 group" onClick={onNavClick}>
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--logo-green)" }}>
            <div className="w-3 h-3 bg-card-bg rounded-[3px]" />
          </div>
          <h1 className="font-bold text-foreground text-[14px] tracking-tight leading-tight">
            {businessName}
          </h1>
        </Link>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto relative">
        {displayGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-6" : ""}>
            {group.label && (
              <p className="px-3 mb-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
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
                    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150 group ${
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
                    <item.icon className="w-[17px] h-[17px] relative z-10 flex-shrink-0" />
                    <span className="relative z-10 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        {/* Addon modules (dynamic) */}
        {activeAddons.length > 0 && (
          <div className="mt-6">
            <p className="px-3 mb-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
              Add-ons
            </p>
            <div className="space-y-1">
              {activeAddons.map((addon) => {
                const href = `/dashboard/${addon.route}`;
                const isActive = pathname.startsWith(href);
                const Icon = ADDON_ICON_MAP[addon.icon] || Puzzle;
                return (
                  <Link
                    key={addon.id}
                    href={href}
                    onClick={onNavClick}
                    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150 group ${
                      isActive ? "text-foreground" : "text-text-secondary hover:text-foreground"
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
                    <Icon className="w-[17px] h-[17px] relative z-10 flex-shrink-0" />
                    <span className="relative z-10 truncate">{addon.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom: Settings */}
      <div className="px-3 py-3 border-t border-border-light space-y-0.5">
        {bottomItems.map((item) => {
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
        })}
      </div>
    </>
  );
}
