"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Calendar, Receipt, Inbox,
  FolderKanban, Megaphone, Headphones, FileText,
  MessageCircle, CreditCard, Zap, BarChart3,
  Wand2, Settings, Bell, Search, Command, Menu, X,
} from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { useEnabledModules } from "@/hooks/useFeature";
import { useHydration } from "@/hooks/useHydration";
import { ToastContainer } from "@/components/ui/Toast";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, Calendar, Receipt, Inbox, FolderKanban,
  Megaphone, Headphones, FileText, MessageCircle,
  CreditCard, Zap, BarChart3,
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const hydrated = useHydration();

  if (!hydrated) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <DashboardShell>{children}</DashboardShell>
      <ToastContainer />
    </>
  );
}

function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const businessContext = useOnboardingStore((s) => s.businessContext);
  const enabledModules = useEnabledModules();
  const [searchFocused, setSearchFocused] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...enabledModules.map((mod) => ({
      href: `/dashboard/${mod.slug}`,
      label: mod.name,
      icon: ICON_MAP[mod.icon] || LayoutDashboard,
    })),
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[240px] bg-card-bg border-r border-border-light flex-col fixed h-full z-20">
        <SidebarContent
          businessName={businessContext.businessName}
          navItems={navItems}
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
                navItems={navItems}
                pathname={pathname}
                onNavClick={() => setSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex-1 ml-0 lg:ml-[240px]">
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
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full pl-10 pr-12 py-2.5 bg-surface border border-border-light rounded-[10px] text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 transition-all"
              />
              {!searchFocused && (
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded-lg bg-surface border border-border-light text-[11px] font-medium text-text-tertiary hover:bg-foreground/5 transition-colors cursor-pointer">
                  <Command className="w-3 h-3" />K
                </kbd>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <button className="relative p-2 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer transition-colors">
              <Bell className="w-[17px] h-[17px]" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
            <div className="w-px h-5 bg-border-light mx-1" />
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer shadow-[0_1px_3px_rgba(91,91,214,0.15)]">
              <span className="text-[11px] font-bold text-white">
                {(businessContext.businessName || "U")[0].toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <ErrorBoundary>
          <div className="p-4 lg:p-8">{children}</div>
        </ErrorBoundary>
      </main>
    </div>
  );
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

function SidebarContent({
  businessName,
  navItems,
  pathname,
  onNavClick,
}: {
  businessName: string;
  navItems: NavItem[];
  pathname: string;
  onNavClick: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="px-5 py-4 border-b border-border-light">
        <Link href="/dashboard" className="flex items-center gap-2.5 group" onClick={onNavClick}>
          <div className="w-7 h-7 bg-primary rounded-[8px] flex items-center justify-center shadow-[0_1px_3px_rgba(91,91,214,0.2)]">
            <div className="w-3 h-3 bg-white rounded-[3px]" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-[13px] tracking-tight leading-tight">
              {businessName || "Magic CRM"}
            </h1>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const isSettings = item.href === "/dashboard/settings";
          return (
            <div key={item.href}>
              {isSettings && (
                <div className="my-2 border-t border-border-light" />
              )}
              <Link
                href={item.href}
                onClick={onNavClick}
                className={`relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 group ${
                  isActive
                    ? "text-foreground"
                    : "text-text-secondary hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-surface rounded-lg"
                    transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
                  />
                )}
                {isActive && (
                  <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full"
                    layoutId="sidebar-indicator"
                    transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
                  />
                )}
                <item.icon className={`w-[15px] h-[15px] relative z-10 flex-shrink-0 transition-all ${isActive ? "" : "group-hover:scale-110"}`} />
                <span className="relative z-10 truncate">{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* AI Builder */}
      <div className="px-3 py-3 border-t border-border-light">
        <Link href="/ai-builder" onClick={onNavClick}>
          <div className="px-4 py-3 bg-primary rounded-xl text-white cursor-pointer hover:bg-primary-hover transition-colors shadow-[0_1px_3px_rgba(91,91,214,0.2)]">
            <div className="flex items-center gap-2 mb-0.5">
              <Wand2 className="w-3.5 h-3.5" />
              <span className="text-[13px] font-semibold">AI Builder</span>
            </div>
            <p className="text-[11px] text-white/50">25 credits remaining</p>
          </div>
        </Link>
      </div>
    </>
  );
}
