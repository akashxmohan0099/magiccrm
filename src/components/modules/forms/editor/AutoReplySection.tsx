"use client";

import { useRef, useState } from "react";
import { Mail, MessageSquare, ToggleLeft, ToggleRight, Bell, Pencil, ExternalLink } from "lucide-react";
import type { FormFieldConfig } from "@/types/models";
import { useSettingsStore } from "@/store/settings";
import { useAuth } from "@/hooks/useAuth";
import { MergeTagBar } from "./MergeTagBar";
import { EmailPreview, SmsPreview } from "./AutoReplyPreviews";

// Auto-reply — email + SMS sent to the visitor, plus the owner heads-up.
export function AutoReplySection(props: {
  autoReplyEnabled: boolean;
  setAutoReplyEnabled: (v: boolean) => void;
  autoReplySubject: string;
  setAutoReplySubject: (v: string) => void;
  autoReplyBody: string;
  setAutoReplyBody: (v: string) => void;
  autoReplySmsEnabled: boolean;
  setAutoReplySmsEnabled: (v: boolean) => void;
  autoReplySmsBody: string;
  setAutoReplySmsBody: (v: string) => void;
  notifyOwnerEmail: boolean;
  setNotifyOwnerEmail: (v: boolean) => void;
  formFields: FormFieldConfig[];
}) {
  const hasPhoneField = props.formFields.some((f) => f.type === "phone");
  const hasEmailField = props.formFields.some((f) => f.type === "email");
  const emailBodyRef = useRef<HTMLTextAreaElement | null>(null);
  const smsBodyRef = useRef<HTMLTextAreaElement | null>(null);
  // Resolve a real businessName for the preview interpolation. Falls back
  // to the placeholder string the auto-reply uses when no business name is
  // configured — matches the runtime fallback in send-inquiry-confirmation.
  const businessName = useSettingsStore((s) => s.settings?.businessName?.trim() || "Our team");
  const contactEmail = useSettingsStore((s) => s.settings?.contactEmail ?? "");
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const { workspaceId } = useAuth();
  const [editingNotifyEmail, setEditingNotifyEmail] = useState(false);
  const [notifyEmailDraft, setNotifyEmailDraft] = useState(contactEmail);

  // Snapshot the current contactEmail into the draft whenever the user enters
  // edit mode. The earlier implementation mirrored contactEmail into the
  // draft via useEffect, which the lint rule flags as setState-in-effect
  // (causes cascading renders). Now the sync only happens on the click path
  // that actually needs it; non-edit renders read contactEmail directly.
  const startEditingNotifyEmail = () => {
    setNotifyEmailDraft(contactEmail);
    setEditingNotifyEmail(true);
  };

  const saveNotifyEmail = () => {
    const next = notifyEmailDraft.trim();
    if (!next || next === contactEmail) {
      setEditingNotifyEmail(false);
      return;
    }
    updateSettings({ contactEmail: next }, workspaceId || undefined);
    setEditingNotifyEmail(false);
  };

  const insertToken = (
    ref: React.RefObject<HTMLTextAreaElement | null>,
    current: string,
    setter: (v: string) => void,
    token: string,
  ) => {
    const el = ref.current;
    if (!el) {
      setter(current + token);
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const next = current.slice(0, start) + token + current.slice(end);
    setter(next);
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + token.length;
      el.setSelectionRange(caret, caret);
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[14px] font-semibold text-foreground">Auto-reply</p>
        <p className="text-[13px] text-text-secondary mt-1 leading-snug">
          Confirm the inquiry to the visitor and ping yourself.
        </p>
      </div>

      {/* Email auto-reply */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => props.setAutoReplyEnabled(!props.autoReplyEnabled)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-text-secondary" />
            <span className="text-[13px] font-semibold text-foreground">Email auto-reply</span>
            {!hasEmailField && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                No email field
              </span>
            )}
          </div>
          {props.autoReplyEnabled ? (
            <ToggleRight className="w-7 h-7 text-primary" />
          ) : (
            <ToggleLeft className="w-7 h-7 text-text-tertiary" />
          )}
        </button>

        {props.autoReplyEnabled && (
          <div className="space-y-2 pl-5">
            <input
              value={props.autoReplySubject}
              onChange={(e) => props.setAutoReplySubject(e.target.value)}
              placeholder="Subject — defaults to “We received your inquiry — {{businessName}}”"
              className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/20"
            />
            <textarea
              ref={emailBodyRef}
              value={props.autoReplyBody}
              onChange={(e) => props.setAutoReplyBody(e.target.value)}
              rows={5}
              placeholder={"Hi {{name}},\n\nThanks for reaching out to {{businessName}} — we've received your inquiry and will be in touch shortly."}
              className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono"
            />
            <MergeTagBar
              onInsert={(token) =>
                insertToken(emailBodyRef, props.autoReplyBody, props.setAutoReplyBody, token)
              }
            />
            <EmailPreview
              subject={props.autoReplySubject}
              body={props.autoReplyBody}
              businessName={businessName}
            />
          </div>
        )}
      </div>

      {/* SMS auto-reply */}
      <div className="border-t border-border-light pt-4 space-y-3">
        <button
          type="button"
          onClick={() => props.setAutoReplySmsEnabled(!props.autoReplySmsEnabled)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-text-secondary" />
            <span className="text-[13px] font-semibold text-foreground">SMS auto-reply</span>
            {!hasPhoneField && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                No phone field
              </span>
            )}
          </div>
          {props.autoReplySmsEnabled ? (
            <ToggleRight className="w-7 h-7 text-primary" />
          ) : (
            <ToggleLeft className="w-7 h-7 text-text-tertiary" />
          )}
        </button>

        {props.autoReplySmsEnabled && (
          <div className="space-y-2 pl-5">
            <textarea
              ref={smsBodyRef}
              value={props.autoReplySmsBody}
              onChange={(e) => props.setAutoReplySmsBody(e.target.value)}
              rows={3}
              maxLength={320}
              placeholder={"Hi {{name}}, thanks for your inquiry with {{businessName}}. We'll be in touch shortly!"}
              className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono"
            />
            <div className="flex items-center justify-between gap-2">
              <MergeTagBar
                onInsert={(token) =>
                  insertToken(smsBodyRef, props.autoReplySmsBody, props.setAutoReplySmsBody, token)
                }
              />
              <span className="text-[10px] text-text-tertiary flex-shrink-0">
                {props.autoReplySmsBody.length}/320
              </span>
            </div>
            <SmsPreview body={props.autoReplySmsBody} businessName={businessName} />
          </div>
        )}
      </div>

      {/* Owner notification */}
      <div className="border-t border-border-light pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <Bell className="w-3.5 h-3.5 text-text-secondary mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[13px] font-semibold text-foreground">Email me when I get an inquiry</span>
              <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-text-secondary leading-snug">
                <span className="flex-shrink-0">Sent to</span>
                {editingNotifyEmail ? (
                  <input
                    type="email"
                    autoFocus
                    value={notifyEmailDraft}
                    onChange={(e) => setNotifyEmailDraft(e.target.value)}
                    onBlur={saveNotifyEmail}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveNotifyEmail();
                      } else if (e.key === "Escape") {
                        setEditingNotifyEmail(false);
                      }
                    }}
                    placeholder="you@example.com"
                    className="flex-1 min-w-0 px-2 py-1 bg-surface border border-border-light rounded-md text-[12.5px] text-foreground placeholder:text-text-tertiary outline-none focus:border-primary"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={startEditingNotifyEmail}
                    className={`group inline-flex items-center gap-1 font-medium hover:text-primary transition-colors cursor-pointer min-w-0 ${
                      contactEmail ? "text-foreground" : "text-amber-700 underline"
                    }`}
                  >
                    <span className="truncate">
                      {contactEmail || "Set an address →"}
                    </span>
                    <Pencil className="w-3 h-3 text-text-tertiary group-hover:text-primary flex-shrink-0" />
                  </button>
                )}
              </div>
              {props.notifyOwnerEmail && !contactEmail && !editingNotifyEmail ? (
                <p className="text-[11.5px] text-amber-700 mt-1.5">
                  Notifications are on, but no recipient is set — emails won&apos;t
                  send until you add an address.
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => props.setNotifyOwnerEmail(!props.notifyOwnerEmail)}
            className="cursor-pointer flex-shrink-0"
            aria-label={props.notifyOwnerEmail ? "Disable owner email" : "Enable owner email"}
          >
            {props.notifyOwnerEmail ? (
              <ToggleRight className="w-7 h-7 text-primary" />
            ) : (
              <ToggleLeft className="w-7 h-7 text-text-tertiary" />
            )}
          </button>
        </div>
      </div>

      {/* Sender disclosure */}
      <div className="border-t border-border-light pt-3 flex items-start gap-2 text-[12.5px] text-text-secondary leading-snug">
        <ExternalLink className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <span>
          Auto-replies are sent from{" "}
          <span className="font-mono">bookings@magiccrm.app</span> on your behalf,
          with replies routed to your contact email. Custom domain — coming soon.
        </span>
      </div>
    </div>
  );
}
