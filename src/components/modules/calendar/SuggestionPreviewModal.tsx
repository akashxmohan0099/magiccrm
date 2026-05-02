"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, MessageSquare, Send } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { useClientsStore } from "@/store/clients";
import { useSuggestionsStore } from "@/store/suggestions";
import type { Suggestion, SuggestionAction, Client } from "@/types/models";

interface Props {
  open: boolean;
  suggestion: Suggestion | null;
  onClose: () => void;
}

/**
 * Preview screen for `send_message` actions. The user sees who'll receive
 * the message, can edit copy, exclude individual recipients, switch the
 * channel, and only then dispatches. Marks the suggestion `acted` on send.
 *
 * v1: dispatch is a stub — we mark the suggestion as acted and show a toast.
 * Wiring to the marketing campaign / SMS path is a follow-up.
 */
export function SuggestionPreviewModal({ open, suggestion, onClose }: Props) {
  const allClients = useClientsStore((s) => s.clients);
  const markActed = useSuggestionsStore((s) => s.markActed);

  const action = suggestion?.primaryAction.kind === "send_message"
    ? (suggestion.primaryAction as Extract<SuggestionAction, { kind: "send_message" }>)
    : null;

  const [channel, setChannel] = useState<"sms" | "email" | "both">("sms");
  const [message, setMessage] = useState("");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open && action) {
      setChannel(action.channel);
      setMessage(action.defaultMessage);
      setExcluded(new Set());
      setSending(false);
    }
  }, [open, action]);

  const recipients = useMemo<Client[]>(() => {
    if (!suggestion?.audienceClientIds) return [];
    const byId = new Map(allClients.map((c) => [c.id, c]));
    return suggestion.audienceClientIds
      .map((id) => byId.get(id))
      .filter((c): c is Client => !!c);
  }, [suggestion, allClients]);

  const activeRecipients = recipients.filter((c) => !excluded.has(c.id));

  if (!suggestion || !action) return null;

  const eligibleByChannel = activeRecipients.filter((c) => {
    if (channel === "email") return !!c.email;
    if (channel === "sms") return !!c.phone;
    return !!c.phone || !!c.email;
  });

  function toggleExcluded(id: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSend() {
    if (!suggestion) return;
    setSending(true);
    try {
      // v1: dispatch is not wired yet. We mark the suggestion as acted so
      // it stops surfacing, but no SMS/email actually goes out — be honest
      // about that in the toast so operators don't assume clients were
      // contacted. Wiring to the marketing/Twilio path is the next step.
      await new Promise((r) => setTimeout(r, 350));
      markActed(suggestion.triggerKey, `stub-${Date.now()}`);
      toast(
        `Saved (preview only — sending isn't wired yet)`,
      );
      onClose();
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Review and send">
      <div className="space-y-4">
        <div>
          <p className="text-[13px] text-text-secondary leading-snug">
            {suggestion.reasonSummary}
          </p>
        </div>

        {/* Channel picker */}
        <div>
          <label className="text-[11px] font-semibold tracking-wide text-text-tertiary uppercase">
            Channel
          </label>
          <div className="mt-1.5 flex gap-1.5">
            <ChannelButton
              active={channel === "sms"}
              onClick={() => setChannel("sms")}
              icon={<MessageSquare className="w-3.5 h-3.5" />}
              label="SMS"
            />
            <ChannelButton
              active={channel === "email"}
              onClick={() => setChannel("email")}
              icon={<Mail className="w-3.5 h-3.5" />}
              label="Email"
            />
            <ChannelButton
              active={channel === "both"}
              onClick={() => setChannel("both")}
              icon={<Send className="w-3.5 h-3.5" />}
              label="Both"
            />
          </div>
        </div>

        {/* Message body */}
        <div>
          <label className="text-[11px] font-semibold tracking-wide text-text-tertiary uppercase">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="mt-1.5 w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground outline-none focus:border-primary resize-none"
          />
          <p className="mt-1 text-[11px] text-text-tertiary">
            <code className="font-mono">{"{first_name}"}</code> is replaced per recipient.
          </p>
        </div>

        {/* Recipient list */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold tracking-wide text-text-tertiary uppercase">
              Recipients ({eligibleByChannel.length} of {recipients.length})
            </label>
          </div>
          <div className="max-h-44 overflow-y-auto bg-surface border border-border-light rounded-lg divide-y divide-border-light">
            {recipients.map((c) => {
              const reachable =
                channel === "email"
                  ? !!c.email
                  : channel === "sms"
                    ? !!c.phone
                    : !!c.phone || !!c.email;
              const isExcluded = excluded.has(c.id);
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-card-bg/40 ${!reachable ? "opacity-60" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={!isExcluded && reachable}
                    disabled={!reachable}
                    onChange={() => toggleExcluded(c.id)}
                    className="accent-primary"
                  />
                  <span className="text-[13px] text-foreground flex-1 truncate">{c.name}</span>
                  <span className="text-[11px] text-text-tertiary">
                    {reachable
                      ? channel === "email"
                        ? c.email
                        : c.phone
                      : "no contact info"}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSend}
            disabled={sending || eligibleByChannel.length === 0 || !message.trim()}
            loading={sending}
          >
            Send to {eligibleByChannel.length}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ChannelButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
        active
          ? "bg-foreground text-white"
          : "bg-surface text-text-secondary hover:text-foreground border border-border-light"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
