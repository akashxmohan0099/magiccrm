"use client";

import { useState } from "react";
import { Code, Globe, Check, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FeatureSection } from "@/components/modules/FeatureSection";

/**
 * Derive a workspace-scoped form URL. In production the origin will be the
 * real domain; during dev it falls back to window.location.origin.
 */
function getFormUrl(): { page: string; embed: string } {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://app.magiccrm.com";
  // Use a placeholder — workspace owners replace this with their actual ID.
  const wsId = "YOUR_WORKSPACE_ID";
  return {
    page: `${origin}/lead-form/${wsId}`,
    embed: `<iframe src="${origin}/lead-form/${wsId}" width="100%" height="600" frameborder="0" style="border:none;border-radius:12px;"></iframe>`,
  };
}

export function WebFormPreview() {
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [autoReply, setAutoReply] = useState("");

  const urls = getFormUrl();

  const copy = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text).then(() => {
      setter(true);
      setTimeout(() => setter(false), 2000);
    });
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground tracking-tight mb-4">
        Web Form
      </h3>

      <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border-light bg-surface">
          <Globe className="w-4 h-4 text-text-secondary" />
          <span className="text-sm font-medium text-foreground">
            Lead Capture Form Preview
          </span>
        </div>

        {/* Mock form */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Name
            </label>
            <div className="w-full h-9 rounded-lg border border-border-light bg-surface" />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Email
            </label>
            <div className="w-full h-9 rounded-lg border border-border-light bg-surface" />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Phone
            </label>
            <div className="w-full h-9 rounded-lg border border-border-light bg-surface" />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Message
            </label>
            <div className="w-full h-20 rounded-lg border border-border-light bg-surface" />
          </div>

          <div className="h-9 w-28 rounded-lg bg-foreground/20 flex items-center justify-center">
            <span className="text-xs font-medium text-foreground">Submit</span>
          </div>
        </div>

        {/* Footer with share options */}
        <div className="flex flex-col gap-3 px-5 py-4 border-t border-border-light bg-surface">
          <p className="text-xs text-text-secondary">
            Share the form link or embed it on your website. Submissions create leads automatically.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => copy(urls.page, setCopiedLink)}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy form link
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => copy(urls.embed, setCopiedEmbed)}
            >
              {copiedEmbed ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Code className="w-3.5 h-3.5 mr-1.5" />
                  Copy embed code
                </>
              )}
            </Button>
            <a
              href={urls.page}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-text-secondary hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Preview
            </a>
          </div>
        </div>
      </div>

      <FeatureSection moduleId="leads-pipeline" featureId="auto-response" featureLabel="Auto-Response">
        <div className="mt-4 bg-card-bg rounded-xl border border-border-light p-4">
          <h4 className="text-[13px] font-semibold text-foreground mb-2">Auto-Response Message</h4>
          <textarea
            value={autoReply}
            onChange={(e) => setAutoReply(e.target.value)}
            placeholder="Thanks for reaching out! We'll get back to you within 24 hours."
            rows={3}
            className="w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none resize-none"
          />
          <p className="text-[11px] text-text-tertiary mt-1">
            Sent automatically when someone submits the form. Configure via Automations with the &quot;lead-created&quot; trigger.
          </p>
        </div>
      </FeatureSection>
    </div>
  );
}
