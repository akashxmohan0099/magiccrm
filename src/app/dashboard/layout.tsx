"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, Calendar, Receipt, Inbox,
  FolderKanban, Megaphone, Headphones, FileText,
  MessageCircle, CreditCard, Zap, BarChart3,
  Wand2, Settings, Bell, Star, Search, Command,
} from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { useEnabledModules } from "@/hooks/useFeature";
import { useHydration } from "@/hooks/useHydration";
import { ToastContainer } from "@/components/ui/Toast";
import { DashboardSkeleton } from "@/components/ui/Skeleton";

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

// Only mounts after hydration — safe to use all stores
function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const businessContext = useOnboardingStore((s) => s.businessContext);
  const enabledModules = useEnabledModules();
  const [searchFocused, setSearchFocused] = useState(false);

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
      {/* Sidebar */}
      <aside className="w-[260px] bg-card-bg border-r border-border-light flex flex-col fixed h-full z-20">
        <div className="px-5 py-5 border-b border-border-light">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-[#FFE072] to-[#D4A017] rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Star className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-[13px] tracking-tight leading-tight">Magic CRM</h1>
              <p className="text-[11px] text-text-tertiary truncate max-w-[150px] leading-tight">
                {businessContext.businessName || "My Business"}
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? "text-foreground"
                    : "text-text-secondary hover:bg-surface hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-surface rounded-lg"
                    transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
                  />
                )}
                <item.icon className="w-[16px] h-[16px] relative z-10 flex-shrink-0" />
                <span className="relative z-10 truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-border-light">
          <Link href="/ai-builder">
            <motion.div
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-3 bg-gradient-to-r from-[#FFE072] to-[#D4A017] rounded-xl text-white cursor-pointer shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <Wand2 className="w-3.5 h-3.5" />
                <span className="text-[13px] font-semibold">AI Builder</span>
              </div>
              <p className="text-[11px] text-white/60">25 credits remaining</p>
            </motion.div>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-[260px]">
        <header className="bg-card-bg/80 backdrop-blur-overlay border-b border-border-light px-8 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className={`relative transition-all duration-200 ${searchFocused ? "w-80" : "w-64"}`}>
            <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full pl-10 pr-12 py-2 bg-surface border border-border-light rounded-lg text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-background border border-border-light text-[10px] font-medium text-text-tertiary">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer"
            >
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand rounded-full" />
            </motion.button>
            <div className="w-px h-5 bg-border-light mx-1" />
            <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center ring-1 ring-border-light cursor-pointer hover:ring-border-warm transition-all">
              <span className="text-xs font-semibold text-foreground">
                {(businessContext.businessName || "U")[0].toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
