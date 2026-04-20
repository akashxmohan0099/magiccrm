"use client";

import { useState, useMemo } from "react";
import { ExternalLink, Copy, Check, Clock, ArrowUpRight, Code2 } from "lucide-react";
import { useServicesStore } from "@/store/services";
import { useSettingsStore } from "@/store/settings";
import { Button } from "@/components/ui/Button";

const MOCK_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM"];

export function BookingPagePreview() {
  const { services } = useServicesStore();
  const settings = useSettingsStore((s) => s.settings);
  const businessName = settings?.businessName || "";
  const workingHours = settings?.workingHours ?? {};
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const enabledDays = useMemo(() => Object.keys(workingHours).length, [workingHours]);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const bookingSlug = settings?.bookingPageSlug?.trim();
  const bookingUrl = bookingSlug ? `${origin}/book/${bookingSlug}` : "";
  const embedUrl = bookingSlug ? `${origin}/embed/book/${bookingSlug}` : "";

  const embedSnippet = embedUrl
    ? `<!-- Magic Booking Widget -->\n<div id="magic-booking"></div>\n<script>\n(function(){\n  var d=document,f=d.createElement("iframe");\n  f.src="${embedUrl}";\n  f.style.cssText="width:100%;border:none;min-height:600px;";\n  f.allow="payment";\n  f.title="Book an appointment";\n  window.addEventListener("message",function(e){\n    if(e.data&&e.data.type==="magic-embed-resize")f.style.height=e.data.height+"px";\n  });\n  d.getElementById("magic-booking").appendChild(f);\n})();\n</script>`
    : "";

  const handleCopyLink = () => {
    if (!bookingUrl) return;
    navigator.clipboard.writeText(bookingUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyEmbed = () => {
    if (!embedSnippet) return;
    navigator.clipboard.writeText(embedSnippet).catch(() => {});
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  const handleOpenBookingPage = () => {
    if (!bookingUrl) return;
    window.open(bookingUrl, "_blank");
  };

  return (
    <div className="mt-8 bg-card-bg rounded-xl border border-border-light p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Public Booking Page</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Share this link with clients so they can book appointments online.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowEmbed(!showEmbed)} disabled={!bookingUrl}>
            <Code2 className="w-3.5 h-3.5 mr-1.5" />
            Embed
          </Button>
          <Button variant="secondary" size="sm" onClick={handleOpenBookingPage} disabled={!bookingUrl}>
            <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" />
            Open
          </Button>
          <Button variant="secondary" size="sm" onClick={handleCopyLink} disabled={!bookingUrl}>
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copy link
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Booking URL display */}
      <div className="bg-surface rounded-lg border border-border-light px-3 py-2 mb-4">
        <code className="text-xs text-text-secondary break-all">
          {bookingUrl || "Set a booking page slug in Settings to publish your booking page."}
        </code>
      </div>

      {/* Embed code snippet */}
      {showEmbed && bookingUrl && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">Embed on your website</p>
            <Button variant="secondary" size="sm" onClick={handleCopyEmbed}>
              {embedCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy snippet
                </>
              )}
            </Button>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
            <pre className="text-[11px] text-green-400 whitespace-pre font-mono leading-relaxed">
              {embedSnippet}
            </pre>
          </div>
          <p className="text-[11px] text-text-tertiary">
            Paste this code into your website&apos;s HTML where you want the booking form to appear.
            The widget auto-resizes to fit its content.
          </p>
        </div>
      )}

      {/* Service count info */}
      {services.length > 0 && (
        <p className="text-xs text-text-secondary mb-3">
          {services.length} service{services.length !== 1 ? "s" : ""} available &middot;{" "}
          {enabledDays} day{enabledDays !== 1 ? "s" : ""} per week
        </p>
      )}

      {/* Mock Booking Page Card */}
      <div className="border border-border-light rounded-xl bg-surface p-6 max-w-md mx-auto">
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mx-auto mb-3">
            <ExternalLink className="w-5 h-5 text-foreground" />
          </div>
          <h4 className="text-base font-semibold text-foreground">{businessName || "Your Business"}</h4>
          <p className="text-xs text-text-secondary mt-1">
            {enabledDays} day{enabledDays !== 1 ? "s" : ""} available for booking
          </p>
        </div>

        <div className="mb-4">
          <p className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Available Time Slots
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MOCK_SLOTS.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot === selectedSlot ? null : slot)}
                className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  selectedSlot === slot
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card-bg border-border-light text-foreground hover:border-foreground"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={!selectedSlot}
          className="w-full py-2.5 rounded-lg bg-foreground text-background text-sm font-medium disabled:opacity-40 transition-opacity cursor-pointer"
        >
          Book Appointment
        </button>

        <p className="text-[10px] text-text-secondary text-center mt-3">
          Powered by Magic
        </p>
      </div>
    </div>
  );
}
