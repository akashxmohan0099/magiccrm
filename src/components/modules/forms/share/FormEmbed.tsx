"use client";

import { useEffect, useState } from "react";
import { Copy, Globe, Download } from "lucide-react";
import type { Form } from "@/types/models";
import { toast } from "@/components/ui/Toast";

// Embed-tab content for the form slide-over. Renders the public URL,
// iframe embed code, and downloadable QR code. Pure leaf — only consumes
// `form` and `bookingPageSlug` props, doesn't touch the editor's state.

export function FormEmbed({
  form,
  bookingPageSlug,
}: {
  form: Form;
  bookingPageSlug?: string;
}) {
  // Use the operator's actual origin when they're on localhost or any
  // host that doesn't match NEXT_PUBLIC_APP_URL — otherwise the share
  // links point at the production domain even during dev/QA, which leads
  // to "form not found" errors when the operator clicks Open. Production
  // and staging visits use the configured base for consistent sharing.
  const configuredBase = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  const browserOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const isLocal =
    typeof window !== "undefined" &&
    /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(window.location.hostname);
  const baseUrl = isLocal ? browserOrigin : configuredBase || browserOrigin;

  // Standalone URL: a full-page experience for direct sharing.
  // Embed URL: stripped-down iframe-friendly route (X-Frame-Options bypassed).
  const { formUrl, embedUrl } = (() => {
    if (form.type === "booking" && bookingPageSlug) {
      return {
        formUrl: `${baseUrl}/book/${bookingPageSlug}`,
        embedUrl: `${baseUrl}/embed/book/${bookingPageSlug}`,
      };
    }
    if (form.type === "inquiry" && form.slug) {
      return {
        formUrl: `${baseUrl}/inquiry/${form.slug}`,
        embedUrl: `${baseUrl}/embed/inquiry/${form.slug}`,
      };
    }
    return { formUrl: "", embedUrl: "" };
  })();

  const embedCode = embedUrl
    ? `<iframe src="${embedUrl}" width="100%" height="700" frameborder="0" style="border-radius: 12px; border: 1px solid #eee;"></iframe>`
    : "";

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast(`${label} copied!`);
  };

  if (!formUrl) {
    const isBooking = form.type === "booking";
    return (
      <div className="rounded-lg border border-border-light bg-surface p-4">
        <h4 className="text-[13px] font-semibold text-foreground">
          {isBooking ? "Booking page slug required" : "Inquiry form slug required"}
        </h4>
        <p className="mt-1 text-[12px] text-text-secondary">
          {isBooking
            ? "Set your booking page slug in Settings before sharing or embedding the public booking page."
            : "Set a slug on this form in the Edit tab before sharing or embedding it."}
        </p>
      </div>
    );
  }

  const needsEnable = form.type === "inquiry" && !form.enabled;

  return (
    <div className="space-y-5">
      {needsEnable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-[12px] text-amber-900">
            This form is disabled. Toggle it on from the forms list before the public URL will load.
          </p>
        </div>
      )}

      {/* Public URL */}
      <div className="bg-surface rounded-lg p-4 border border-border-light">
        <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Public URL</h4>
        <div className="flex items-center gap-2">
          <p className="flex-1 text-[13px] font-mono text-foreground bg-card-bg rounded-lg px-3 py-2 border border-border-light truncate">{formUrl}</p>
          <button onClick={() => copy(formUrl, "Link")}
            className="flex items-center gap-1.5 px-3 py-2 bg-foreground text-background rounded-lg text-[13px] font-medium cursor-pointer hover:opacity-90">
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
          <a href={formUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] font-medium text-foreground hover:bg-surface cursor-pointer">
            <Globe className="w-3.5 h-3.5" /> Open
          </a>
        </div>
        <p className="text-[11px] text-text-tertiary mt-2">
          {form.type === "booking"
            ? "Share this booking page directly with clients."
            : "Share this inquiry form directly with clients."}
        </p>
      </div>

      {/* Embed Code */}
      <div className="bg-surface rounded-lg p-4 border border-border-light">
        <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Embed Code</h4>
        <div className="relative">
          <pre className="text-[11px] font-mono text-foreground bg-card-bg rounded-lg px-3 py-3 border border-border-light overflow-x-auto whitespace-pre-wrap break-all">{embedCode}</pre>
          <button onClick={() => copy(embedCode, "Embed code")}
            className="absolute top-2 right-2 p-1.5 text-text-tertiary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer">
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[11px] text-text-tertiary mt-2">
          Paste this into your website HTML. The <span className="font-mono">height=&quot;700&quot;</span> works for most forms — bump it higher if your form is taller, or use auto-resize (coming soon).
        </p>
      </div>

      {/* QR code — for in-store kiosks, table cards, printed flyers, business cards. */}
      <FormQrCode formUrl={formUrl} formName={form.name} />
    </div>
  );
}

// QR code generator + download. Generated client-side via the `qrcode`
// package — no third-party API call, so the URL never leaves the browser.
function FormQrCode({ formUrl, formName }: { formUrl: string; formName: string }) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    void import("qrcode").then((QR) => {
      QR.toDataURL(formUrl, {
        margin: 1,
        width: 320,
        color: { dark: "#0f0f0f", light: "#ffffff" },
      })
        .then((url) => {
          if (!cancelled) setDataUrl(url);
        })
        .catch(() => {
          if (!cancelled) setDataUrl("");
        });
    });
    return () => {
      cancelled = true;
    };
  }, [formUrl]);

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${formName.toLowerCase().replace(/\s+/g, "-") || "form"}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-surface rounded-lg p-4 border border-border-light">
      <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">QR Code</h4>
      <div className="flex items-center gap-4">
        <div className="w-32 h-32 rounded-lg bg-card-bg border border-border-light flex items-center justify-center overflow-hidden flex-shrink-0">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt="QR code for form URL" className="w-full h-full" />
          ) : (
            <span className="text-[11px] text-text-tertiary">Generating…</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] text-text-secondary leading-snug">
            Print on table cards, business cards, or in-store signage. Scans straight to the form.
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={download}
              disabled={!dataUrl}
              className="flex items-center gap-1.5 px-3 py-2 bg-foreground text-background rounded-lg text-[12.5px] font-medium cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" /> Download PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
