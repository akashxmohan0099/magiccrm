"use client";

import { useState } from "react";
import { Code, Globe, Check } from "lucide-react";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { Button } from "@/components/ui/Button";

export function WebFormPreview() {
  const [copied, setCopied] = useState(false);

  const handleCopyEmbed = () => {
    const embedSnippet = `<iframe src="https://your-crm.com/forms/lead-capture" width="100%" height="500" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedSnippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <FeatureSection moduleId="leads-pipeline" featureId="web-forms">
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
                Message
              </label>
              <div className="w-full h-20 rounded-lg border border-border-light bg-surface" />
            </div>

            <div className="h-9 w-28 rounded-lg bg-foreground/20 flex items-center justify-center">
              <span className="text-xs font-medium text-foreground">Submit</span>
            </div>
          </div>

          {/* Footer with copy button */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border-light bg-surface">
            <p className="text-xs text-text-secondary">
              Embed this form on your website to capture leads automatically.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyEmbed}
            >
              {copied ? (
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
          </div>
        </div>
      </div>
    </FeatureSection>
  );
}
