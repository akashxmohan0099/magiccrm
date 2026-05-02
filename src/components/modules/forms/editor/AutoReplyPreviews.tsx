"use client";

import {
  buildInquiryAutoReplyEmail,
  buildInquiryAutoReplySms,
} from "@/lib/integrations/email";

// Email preview — renders the same HTML the bride will receive, using the
// shared `buildInquiryAutoReplyEmail` helper. Live-updates as the operator
// types so they can see merge-tags resolve and tone land before sending a
// real test. Uses sample placeholder values for {{name}} / {{businessName}}
// so the preview reads like a real email rather than literal merge tags.
export function EmailPreview({
  subject,
  body,
  businessName,
}: {
  subject: string;
  body: string;
  businessName: string;
}) {
  const built = buildInquiryAutoReplyEmail(
    {
      clientName: "Sarah",
      businessName,
      serviceInterest: undefined,
      eventType: undefined,
    },
    { subject: subject || undefined, body: body || undefined },
  );
  return (
    <div className="rounded-lg border border-border-light bg-card-bg overflow-hidden">
      <div className="px-3 py-2 bg-surface border-b border-border-light flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
          Preview
        </span>
        <span className="text-[10.5px] text-text-tertiary">
          To: Sarah · From: {businessName}
        </span>
      </div>
      <div className="px-3 py-2 border-b border-border-light">
        <p className="text-[12px] font-semibold text-foreground truncate">
          {built.subject}
        </p>
      </div>
      <div
        className="px-1 py-1 max-h-72 overflow-y-auto bg-[#f9f9f9]"
        dangerouslySetInnerHTML={{ __html: built.html }}
      />
    </div>
  );
}

// SMS preview — phone-bubble styling. Resolves merge tags so the operator
// sees the final text length (carriers split at 160 chars; the input cap
// is 320). Uses the same sample identity as EmailPreview for consistency.
export function SmsPreview({
  body,
  businessName,
}: {
  body: string;
  businessName: string;
}) {
  const text = buildInquiryAutoReplySms(
    { clientName: "Sarah", businessName },
    { body: body || undefined },
  );
  return (
    <div className="rounded-lg border border-border-light bg-card-bg overflow-hidden">
      <div className="px-3 py-2 bg-surface border-b border-border-light flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
          Preview
        </span>
        <span className="text-[10.5px] text-text-tertiary">
          To: Sarah · {text.length} chars
        </span>
      </div>
      <div className="p-3 bg-surface/40">
        <div className="max-w-[80%] bg-emerald-500 text-white rounded-2xl rounded-bl-md px-3.5 py-2 text-[13px] leading-snug shadow-sm whitespace-pre-wrap">
          {text}
        </div>
      </div>
    </div>
  );
}
