"use client";

import { useState, useMemo } from "react";
import { Plus, MessageSquare, Bell, Mail, MessageCircle, Instagram, Phone, Linkedin, ChevronRight, X } from "lucide-react";
import { useCommunicationStore } from "@/store/communication";
import { Channel, ChannelConnectionConfig, ChannelConnectionStatus, Conversation } from "@/types/models";
import { useFeature } from "@/hooks/useFeature";
import { useModuleSchema } from "@/hooks/useModuleSchema";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { ConversationList } from "./ConversationList";
import { MessageThread } from "./MessageThread";
import { ChannelFilter } from "./ChannelFilter";
import { NewConversationForm } from "./NewConversationForm";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { toast } from "@/components/ui/Toast";

type ChannelSetupItem = {
  id: Channel;
  label: string;
  icon: typeof Mail;
  enabled: boolean;
  description: string;
  placeholder: string;
  fieldLabel: string;
};

const CHANNEL_STATUS_META: Record<
  ChannelConnectionStatus,
  { label: string; badgeClass: string }
> = {
  configured: {
    label: "Configured",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  "action-required": {
    label: "Needs Auth",
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  connected: {
    label: "Connected",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  syncing: {
    label: "Syncing",
    badgeClass: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  error: {
    label: "Error",
    badgeClass: "bg-red-50 text-red-700 border border-red-200",
  },
};

function getChannelStatusMeta(config?: ChannelConnectionConfig) {
  if (!config) {
    return {
      label: "Not Configured",
      badgeClass: "bg-surface text-text-secondary border border-border-light",
    };
  }

  return CHANNEL_STATUS_META[config.status];
}

export function CommunicationPage() {
  const ms = useModuleSchema("communication");
  const conversations = useCommunicationStore((s) => s.conversations);
  const connectedChannelsList = useCommunicationStore((s) => s.connectedChannels);
  const channelConfigs = useCommunicationStore((s) => s.channelConfigs);
  const automationSettings = useCommunicationStore((s) => s.automationSettings);
  const saveChannelConfig = useCommunicationStore((s) => s.saveChannelConfig);
  const setAutomationSettings = useCommunicationStore((s) => s.setAutomationSettings);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<Channel | "all">("all");
  const [newConvoOpen, setNewConvoOpen] = useState(false);
  const connectedChannels = useMemo(() => new Set(connectedChannelsList), [connectedChannelsList]);
  const configuredChannels = useMemo(
    () => new Set(Object.keys(channelConfigs) as Channel[]),
    [channelConfigs]
  );
  const [setupChannelId, setSetupChannelId] = useState<string | null>(null);
  const [setupDraft, setSetupDraft] = useState({
    identifier: "",
    displayName: "",
    signature: "",
  });

  // Check which channels the user has enabled
  const emailEnabled = useFeature("communication", "email");
  const smsEnabled = useFeature("communication", "sms");
  const instagramEnabled = useFeature("communication", "instagram-dms");
  const facebookEnabled = useFeature("communication", "facebook-messenger");
  const whatsappEnabled = useFeature("communication", "whatsapp");
  const linkedinEnabled = useFeature("communication", "linkedin");

  const channelSetupList = ([
    { id: "email", label: "Email", icon: Mail, enabled: emailEnabled, description: "Connect your inbox to send and receive emails", placeholder: "you@yourbusiness.com", fieldLabel: "Email address" },
    { id: "sms", label: "SMS", icon: MessageCircle, enabled: smsEnabled, description: "Connect your phone number for text messaging", placeholder: "+61 400 000 000", fieldLabel: "Phone number" },
    { id: "instagram", label: "Instagram", icon: Instagram, enabled: instagramEnabled, description: "Link your Instagram business account", placeholder: "@yourbusiness", fieldLabel: "Instagram handle" },
    { id: "facebook", label: "Facebook", icon: MessageCircle, enabled: facebookEnabled, description: "Connect Facebook Messenger", placeholder: "Your Facebook Page name", fieldLabel: "Facebook Page" },
    { id: "whatsapp", label: "WhatsApp", icon: Phone, enabled: whatsappEnabled, description: "Link your WhatsApp Business number", placeholder: "+61 400 000 000", fieldLabel: "WhatsApp number" },
    { id: "linkedin", label: "LinkedIn", icon: Linkedin, enabled: linkedinEnabled, description: "Connect your LinkedIn profile", placeholder: "linkedin.com/in/yourname", fieldLabel: "LinkedIn URL" },
  ] satisfies ChannelSetupItem[]).filter((ch) => ch.enabled);

  const configuredConversationChannels = useMemo(
    () =>
      channelSetupList.filter(
        (channel) => connectedChannels.has(channel.id) || configuredChannels.has(channel.id)
      ),
    [channelSetupList, configuredChannels, connectedChannels]
  );

  const hasConversationChannels = configuredConversationChannels.length > 0;
  const setupChannel = channelSetupList.find((ch) => ch.id === setupChannelId);
  const bulkChannelOptions = channelSetupList.map((channel) => ({
    value: channel.id,
    label: channel.label,
  }));
  const bulkMessageChannel = bulkChannelOptions.some(
    (option) => option.value === automationSettings.bulkMessageChannel
  )
    ? automationSettings.bulkMessageChannel
    : bulkChannelOptions[0]?.value ?? "email";

  const openSetup = (channelId: Channel) => {
    const existingConfig = channelConfigs[channelId];
    setSetupDraft({
      identifier: existingConfig?.identifier ?? "",
      displayName: existingConfig?.displayName ?? "",
      signature: existingConfig?.signature ?? "",
    });
    setSetupChannelId(channelId);
  };

  const completeSetup = (id: Channel) => {
    if (!setupDraft.identifier.trim()) {
      toast("Enter the account identifier before saving", "error");
      return;
    }

    saveChannelConfig(id, setupDraft);
    setSetupChannelId(null);
    setSetupDraft({ identifier: "", displayName: "", signature: "" });
  };

  const filtered = useMemo(() => {
    let result = conversations;
    if (channelFilter !== "all") {
      result = result.filter((c) => c.channel === channelFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.clientName.toLowerCase().includes(q) ||
          (c.subject && c.subject.toLowerCase().includes(q)) ||
          c.messages.some((m) => m.content.toLowerCase().includes(q))
      );
    }
    return result;
  }, [conversations, channelFilter, search]);

  const handleConversationCreated = (convo: Conversation) => {
    setSelectedId(convo.id);
  };

  return (
    <div>
      <PageHeader
        title={ms.label || "Communication"}
        description={ms.description || "Manage all conversations with your clients in one place."}
        actions={
          hasConversationChannels ? (
            <Button variant="primary" size="sm" onClick={() => setNewConvoOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              {ms.primaryAction || "New Conversation"}
            </Button>
          ) : undefined
        }
      />

      {hasConversationChannels && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search conversations..."
            />
          </div>
          <ChannelFilter selectedChannel={channelFilter} onChange={setChannelFilter} />
        </>
      )}

      {/* Channel setup actions */}
      {channelSetupList.length > 0 && (
        <div className="w-full max-w-md mx-auto space-y-2 mt-4 mb-6">
          {channelSetupList.map((ch) => {
            const channelConfig = channelConfigs[ch.id];
            const statusMeta = getChannelStatusMeta(channelConfig);
            return (
              <button
                key={ch.id}
                onClick={() => openSetup(ch.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all cursor-pointer bg-card-bg border border-border-light hover:border-foreground/15"
              >
                <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center flex-shrink-0">
                  <ch.icon className="w-5 h-5 text-text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-medium text-foreground">{ch.label}</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusMeta.badgeClass}`}>
                      {statusMeta.label}
                    </span>
                  </div>
                  <p className="text-[12px] text-text-tertiary mt-0.5">
                    {channelConfig?.statusMessage || ch.description}
                  </p>
                  {channelConfig?.identifier && (
                    <p className="text-[11px] text-text-tertiary mt-1">
                      {channelConfig.identifier}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-text-tertiary flex-shrink-0">
                  <span className="text-[11px] font-medium">
                    {channelConfig ? "Edit" : "Configure"}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Channel setup slide-over */}
      {setupChannel && (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSetupChannelId(null)} />
          <div className="relative w-full max-w-md h-full bg-card-bg border-l border-border-light overflow-y-auto">
            <div className="sticky top-0 bg-card-bg border-b border-border-light px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-surface rounded-xl flex items-center justify-center">
                  <setupChannel.icon className="w-5 h-5 text-text-secondary" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-foreground">Connect {setupChannel.label}</h2>
                  <p className="text-[12px] text-text-tertiary">{setupChannel.description}</p>
                </div>
              </div>
              <button onClick={() => setSetupChannelId(null)} className="p-1.5 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-[13px] font-medium text-foreground mb-1.5">{setupChannel.fieldLabel}</label>
                <input
                  type="text"
                  placeholder={setupChannel.placeholder}
                  value={setupDraft.identifier}
                  onChange={(event) =>
                    setSetupDraft((current) => ({
                      ...current,
                      identifier: event.target.value,
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                />
              </div>

              {setupChannel.id === "email" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-foreground mb-1.5">Display name</label>
                    <input
                      type="text"
                      value={setupDraft.displayName}
                      onChange={(event) =>
                        setSetupDraft((current) => ({
                          ...current,
                          displayName: event.target.value,
                        }))
                      }
                      placeholder="Your Business Name"
                      className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-foreground mb-1.5">Signature</label>
                    <textarea
                      value={setupDraft.signature}
                      onChange={(event) =>
                        setSetupDraft((current) => ({
                          ...current,
                          signature: event.target.value,
                        }))
                      }
                      placeholder="Best regards,&#10;Your Business Name"
                      rows={3}
                      className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                  </div>
                </div>
              )}

              {(setupChannel.id === "instagram" || setupChannel.id === "facebook" || setupChannel.id === "linkedin") && (
                <div className="p-4 bg-surface/50 rounded-xl border border-border-light">
                  <p className="text-[13px] text-text-secondary mb-2">To connect {setupChannel.label}, you&apos;ll need to:</p>
                  <ol className="space-y-1.5 text-[12px] text-text-tertiary list-decimal list-inside">
                    <li>Enter your {setupChannel.fieldLabel.toLowerCase()} above</li>
                    <li>Authorize Magic once the backend OAuth flow is connected</li>
                    <li>Messages will sync after backend credentials are active</li>
                  </ol>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => completeSetup(setupChannel.id)}
                  className="w-full px-6 py-3 bg-foreground text-white rounded-xl text-[14px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                >
                  Save {setupChannel.label} Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Only show conversation UI and features once at least one channel is connected */}
      {hasConversationChannels && (
        <>
          <FeatureSection moduleId="communication" featureId="after-hours-reply" featureLabel="After-Hours Auto-Reply">
            <div className="mb-4 p-4 bg-card-bg rounded-xl border border-border-light">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[13px] font-semibold text-foreground">After-Hours Auto-Reply</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={automationSettings.afterHoursEnabled}
                    onChange={(event) =>
                      setAutomationSettings({ afterHoursEnabled: event.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
              {automationSettings.afterHoursEnabled && (
                <textarea
                  value={automationSettings.afterHoursMessage}
                  onChange={(event) =>
                    setAutomationSettings({ afterHoursMessage: event.target.value })
                  }
                  placeholder="Thanks for your message! We're currently closed and will get back to you during business hours."
                  rows={2}
                  className="w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none resize-none"
                />
              )}
              <p className="text-[11px] text-text-tertiary mt-2">
                Saved locally as the default automation template for backend handoff.
              </p>
            </div>
          </FeatureSection>

          <FeatureSection moduleId="communication" featureId="unread-notifications" featureLabel="Unread Alerts">
            <div className="mb-4 p-4 bg-card-bg rounded-xl border border-border-light">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-text-tertiary" />
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">Unread Alerts</p>
                    <p className="text-[11px] text-text-tertiary">
                      Define the threshold the backend should monitor later.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={automationSettings.unreadAlertsEnabled}
                    onChange={(event) =>
                      setAutomationSettings({ unreadAlertsEnabled: event.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
              {automationSettings.unreadAlertsEnabled && (
                <div className="mt-3">
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-text-tertiary mb-1.5">
                    Alert after
                  </label>
                  <select
                    value={automationSettings.unreadAlertThresholdMinutes}
                    onChange={(event) =>
                      setAutomationSettings({
                        unreadAlertThresholdMinutes: Number(event.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground focus:outline-none"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={240}>4 hours</option>
                  </select>
                </div>
              )}
            </div>
          </FeatureSection>

          <FeatureSection moduleId="communication" featureId="bulk-messaging" featureLabel="Bulk Messaging">
            <div className="mb-4 p-4 bg-card-bg rounded-xl border border-border-light">
              <h4 className="text-[13px] font-semibold text-foreground mb-1">Bulk Messaging Defaults</h4>
              <p className="text-[11px] text-text-tertiary mb-3">
                Define the audience, delivery channel, and template the backend will execute later.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-text-tertiary mb-1.5">
                    Audience
                  </label>
                  <input
                    type="text"
                    value={automationSettings.bulkAudienceLabel}
                    onChange={(event) =>
                      setAutomationSettings({ bulkAudienceLabel: event.target.value })
                    }
                    placeholder="e.g. VIP clients, overdue invoices"
                    className="w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-text-tertiary mb-1.5">
                    Channel
                  </label>
                  <select
                    value={bulkMessageChannel}
                    onChange={(event) =>
                      setAutomationSettings({
                        bulkMessageChannel: event.target.value as Channel,
                      })
                    }
                    className="w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground focus:outline-none"
                  >
                    {bulkChannelOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-[11px] font-medium uppercase tracking-wider text-text-tertiary mb-1.5">
                  Message Template
                </label>
                <textarea
                  value={automationSettings.bulkMessageTemplate}
                  onChange={(event) =>
                    setAutomationSettings({ bulkMessageTemplate: event.target.value })
                  }
                  rows={3}
                  placeholder="Write the message the backend should send to this audience."
                  className="w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none resize-none"
                />
              </div>
              <label className="mt-3 inline-flex items-center gap-2 text-[12px] text-text-secondary">
                <input
                  type="checkbox"
                  checked={automationSettings.includeUnsubscribeLink}
                  onChange={(event) =>
                    setAutomationSettings({
                      includeUnsubscribeLink: event.target.checked,
                    })
                  }
                  className="rounded border-border-light"
                />
                Include an unsubscribe footer where required
              </label>
            </div>
          </FeatureSection>

          {/* Show per-channel content based on selected filter */}
          {channelFilter !== "all" &&
          !configuredChannels.has(channelFilter) &&
          !connectedChannels.has(channelFilter) ? (
            // Unconnected channel tab — prompt to connect
            <div className="mt-6 text-center py-16">
              {(() => {
                const ch = channelSetupList.find((c) => c.id === channelFilter);
                const Icon = ch?.icon || MessageCircle;
                return (
                  <>
                    <div className="w-12 h-12 mx-auto mb-4 bg-surface rounded-2xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-text-tertiary" />
                    </div>
                    <h3 className="text-[16px] font-semibold text-foreground mb-1">
                      Connect {ch?.label || channelFilter}
                    </h3>
                    <p className="text-[13px] text-text-tertiary mb-4 max-w-xs mx-auto">
                      {ch?.description || `Connect your ${channelFilter} account to see messages here.`}
                    </p>
                    <button
                      onClick={() => ch && openSetup(ch.id)}
                      className="px-5 py-2.5 bg-foreground text-white rounded-xl text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      Connect {ch?.label || channelFilter}
                    </button>
                  </>
                );
              })()}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex gap-0 bg-card-bg rounded-xl border border-border-light overflow-hidden mt-4" style={{ height: "calc(100vh - 320px)", minHeight: "500px" }}>
              <div className="w-80 shrink-0 border-r border-border-light flex items-center justify-center">
                <p className="text-[13px] text-text-tertiary px-4 text-center">
                  No conversations yet for this view. Start a manual thread or wait for backend sync.
                </p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                  <p className="text-[14px] font-medium text-foreground mb-1">{ms.emptyTitle || "No synced conversations yet"}</p>
                  <p className="text-[12px] text-text-tertiary mb-4">
                    {ms.emptyDescription || "This screen is ready for backend sync, but you can model the workflow manually right now."}
                  </p>
                  <Button variant="primary" size="sm" onClick={() => setNewConvoOpen(true)}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    New Conversation
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-0 bg-card-bg rounded-xl border border-border-light overflow-hidden mt-4" style={{ height: "calc(100vh - 320px)", minHeight: "500px" }}>
              <div className="w-80 shrink-0 border-r border-border-light overflow-y-auto">
                <ConversationList
                  conversations={filtered}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              </div>
              <div className="flex-1 flex flex-col">
                <MessageThread conversationId={selectedId} />
              </div>
            </div>
          )}
        </>
      )}

      <NewConversationForm
        open={newConvoOpen}
        onClose={() => setNewConvoOpen(false)}
        onCreated={handleConversationCreated}
      />
    </div>
  );
}
