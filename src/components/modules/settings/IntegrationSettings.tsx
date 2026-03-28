"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Mail,
  MessageSquare,
  Calculator,
  Inbox,
  ExternalLink,
  Plug,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { useBrandSettingsStore } from "@/store/brand-settings";

// ============================================================
// Types
// ============================================================

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  status: "connected" | "not_connected" | "available" | "coming_soon";
  note?: string;
  hasConnect: boolean;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sync bookings with your Google Calendar automatically",
    icon: Calendar,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    status: "not_connected",
    hasConnect: true,
  },
  {
    id: "email-resend",
    name: "Email (Resend)",
    description: "Send invoices and notifications via email",
    icon: Mail,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
    status: "available",
    note: "Configured by your administrator",
    hasConnect: false,
  },
  {
    id: "sms-twilio",
    name: "SMS (Twilio)",
    description: "Send booking reminders and follow-ups via SMS",
    icon: MessageSquare,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    status: "available",
    note: "Configured by your administrator",
    hasConnect: false,
  },
  {
    id: "accounting-xero",
    name: "Accounting (Xero)",
    description: "Sync invoices with your Xero accounting software",
    icon: Calculator,
    iconColor: "text-sky-600",
    iconBg: "bg-sky-50",
    status: "not_connected",
    hasConnect: true,
  },
  {
    id: "unified-inbox-unipile",
    name: "Unified Inbox (Unipile)",
    description: "Connect Instagram, WhatsApp, and email to your Messages",
    icon: Inbox,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50",
    status: "not_connected",
    hasConnect: true,
  },
];

// ============================================================
// Status Badge
// ============================================================

function StatusBadge({ status }: { status: Integration["status"] }) {
  const config: Record<
    Integration["status"],
    { label: string; dot: string; text: string; bg: string }
  > = {
    connected: {
      label: "Connected",
      dot: "bg-emerald-500",
      text: "text-emerald-700",
      bg: "bg-emerald-50",
    },
    not_connected: {
      label: "Not connected",
      dot: "bg-zinc-400",
      text: "text-zinc-600",
      bg: "bg-zinc-100",
    },
    available: {
      label: "Available",
      dot: "bg-blue-500",
      text: "text-blue-700",
      bg: "bg-blue-50",
    },
    coming_soon: {
      label: "Coming soon",
      dot: "bg-amber-500",
      text: "text-amber-700",
      bg: "bg-amber-50",
    },
  };

  const c = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ============================================================
// Integration Card
// ============================================================

function IntegrationCard({
  integration,
  index,
}: {
  integration: Integration;
  index: number;
}) {
  const { icon: Icon } = integration;

  const handleConnect = () => {
    if (integration.id === "google-calendar") {
      toast(
        "Coming soon — Google Calendar integration is being finalized",
        "info"
      );
    } else {
      toast(`Coming soon — ${integration.name} integration is being finalized`, "info");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: 0.05 * index,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="bg-card-bg border border-border-light rounded-2xl p-6 flex items-start gap-4 hover:border-foreground/10 transition-colors"
    >
      {/* Icon */}
      <div
        className={`w-11 h-11 rounded-xl ${integration.iconBg} flex items-center justify-center flex-shrink-0`}
      >
        <Icon className={`w-5 h-5 ${integration.iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-1">
          <h4 className="text-[15px] font-semibold text-foreground tracking-tight">
            {integration.name}
          </h4>
          <StatusBadge status={integration.status} />
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          {integration.description}
        </p>
        {integration.note && (
          <p className="text-xs text-text-tertiary mt-1.5">
            {integration.note}
          </p>
        )}
      </div>

      {/* Action */}
      {integration.hasConnect && (
        <div className="flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={handleConnect}>
            <ExternalLink className="w-3.5 h-3.5" />
            Connect
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================
// Main IntegrationSettings
// ============================================================

export function IntegrationSettings() {
  const { brandColor } = useBrandSettingsStore();

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
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center">
              <Plug className="w-[18px] h-[18px] text-text-secondary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">
                Integrations
              </h2>
              <p className="text-sm text-text-secondary">
                Connect your favorite tools and services
              </p>
            </div>
          </div>
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

      {/* Integration cards */}
      <div className="space-y-3">
        {INTEGRATIONS.map((integration, index) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
