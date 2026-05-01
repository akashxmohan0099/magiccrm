"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

interface SetupResponse {
  customerId: string;
  clientSecret: string;
  connectedAccountId: string;
}

/**
 * Renders Stripe's CardElement against a SetupIntent client secret. On
 * confirm we hand the parent the customer + setup-intent ids; the parent
 * then submits the booking with those values so the no-show charge
 * pipeline has somewhere to charge.
 */
export function CardOnFileForm({
  slug,
  customerEmail,
  customerName,
  brandColor,
  onReady,
  onError,
}: {
  slug: string;
  customerEmail: string;
  customerName?: string;
  brandColor: string;
  onReady: (data: { customerId: string; setupIntentId: string }) => void;
  onError: (msg: string) => void;
}) {
  const [setup, setSetup] = useState<SetupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/public/book/setup-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, customerEmail, customerName }),
        });
        const data = await res.json();
        if (!res.ok) {
          onError(data.error ?? "Card setup failed");
          return;
        }
        setSetup(data);
        // Stripe.js needs the connected-account id when we're using Connect's
        // Direct Charges flow — that's how the Card Element confirms against
        // the workspace's account, not the platform's.
        const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!pk) {
          onError("Stripe is not configured (publishable key missing)");
          return;
        }
        setStripePromise(loadStripe(pk, { stripeAccount: data.connectedAccountId }));
      } catch {
        onError("Failed to start card setup");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, customerEmail, customerName, onError]);

  const elementsOptions = useMemo(
    () => (setup ? { clientSecret: setup.clientSecret } : undefined),
    [setup],
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
        <Loader2 className="w-4 h-4 animate-spin" /> Preparing card form…
      </div>
    );
  }
  if (!setup || !stripePromise || !elementsOptions) return null;

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <CardOnFileInner
        setup={setup}
        brandColor={brandColor}
        customerName={customerName}
        onReady={onReady}
        onError={onError}
      />
    </Elements>
  );
}

function CardOnFileInner({
  setup,
  brandColor,
  customerName,
  onReady,
  onError,
}: {
  setup: SetupResponse;
  brandColor: string;
  customerName?: string;
  onReady: (data: { customerId: string; setupIntentId: string }) => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = async () => {
    if (!stripe || !elements || submitting) return;
    const card = elements.getElement(CardElement);
    if (!card) return;
    setSubmitting(true);
    try {
      const result = await stripe.confirmCardSetup(setup.clientSecret, {
        payment_method: {
          card,
          billing_details: { name: customerName },
        },
      });
      if (result.error) {
        onError(result.error.message ?? "Card declined");
        return;
      }
      const intentId = result.setupIntent?.id;
      if (!intentId) {
        onError("Card setup failed (no intent)");
        return;
      }
      setConfirmed(true);
      onReady({ customerId: setup.customerId, setupIntentId: intentId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="border border-gray-300 rounded-lg p-3 bg-white">
        <CardElement
          options={{
            hidePostalCode: false,
            style: {
              base: {
                fontSize: "14px",
                color: "#111",
                "::placeholder": { color: "#999" },
              },
            },
          }}
        />
      </div>
      {confirmed ? (
        <p className="text-xs text-emerald-700 flex items-center gap-1">
          <CreditCard className="w-3.5 h-3.5" /> Card saved.
        </p>
      ) : (
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting || !stripe}
          className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: brandColor }}
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? "Saving card…" : "Save card on file"}
        </button>
      )}
      <p className="text-[11px] text-gray-400">
        Your card isn&apos;t charged now. We&apos;ll only charge it for no-show fees per the policy.
      </p>
    </div>
  );
}
