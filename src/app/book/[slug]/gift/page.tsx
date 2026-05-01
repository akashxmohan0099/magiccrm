"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Gift, ArrowRight } from "lucide-react";

interface WorkspaceInfo {
  businessName: string;
  brandColor: string;
  logoUrl?: string;
}

const PRESET_AMOUNTS = [50, 100, 150, 200, 300, 500];

export default function GiftCardPurchasePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [info, setInfo] = useState<WorkspaceInfo | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState("");
  const [purchaserName, setPurchaserName] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/public/book/info?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => {
        setInfo({
          businessName: d.businessName,
          brandColor: d.brandColor ?? "#10b981",
          logoUrl: d.logoUrl,
        });
      })
      .catch(() => {});
  }, [slug]);

  const finalAmount = customAmount ? Number(customAmount) : amount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!finalAmount || finalAmount < 5) {
      setError("Amount must be at least $5");
      return;
    }
    if (!purchaserName.trim() || !purchaserEmail.trim()) {
      setError("Your name and email are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/gift-cards/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          amount: finalAmount,
          purchaserName: purchaserName.trim(),
          purchaserEmail: purchaserEmail.trim(),
          recipientName: recipientName.trim() || undefined,
          recipientEmail: recipientEmail.trim() || undefined,
          returnUrl: window.location.href,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Failed to start checkout");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const brand = info?.brandColor ?? "#10b981";

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <div
            className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
            style={{ backgroundColor: `${brand}20` }}
          >
            <Gift className="w-6 h-6" style={{ color: brand }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-3 tracking-tight">
            Buy a gift card
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {info?.businessName ?? "Loading…"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5"
        >
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-2">
              Amount
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {PRESET_AMOUNTS.map((a) => {
                const selected = !customAmount && amount === a;
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      setAmount(a);
                      setCustomAmount("");
                    }}
                    className={`py-2.5 rounded-lg text-sm font-semibold border cursor-pointer transition-colors ${
                      selected
                        ? "text-white"
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                    style={selected ? { backgroundColor: brand, borderColor: brand } : undefined}
                  >
                    ${a}
                  </button>
                );
              })}
            </div>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Or enter a custom amount"
              min={5}
              max={5000}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Your details
            </p>
            <input
              type="text"
              value={purchaserName}
              onChange={(e) => setPurchaserName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gray-900/10"
              required
            />
            <input
              type="email"
              value={purchaserEmail}
              onChange={(e) => setPurchaserEmail(e.target.value)}
              placeholder="Your email"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gray-900/10"
              required
            />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Recipient (optional)
            </p>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Recipient name"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gray-900/10"
            />
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="Recipient email"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gray-900/10"
            />
            <p className="text-[11px] text-gray-400">
              We&apos;ll email the gift card code here. Leave blank to send it to yourself.
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: brand }}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Loading checkout…" : `Buy gift card · $${finalAmount || 0}`}
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <p className="text-[11px] text-gray-300 text-center mt-6">Powered by Magic</p>
      </div>
    </div>
  );
}
