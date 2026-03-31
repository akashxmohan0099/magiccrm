"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-border-light bg-card-bg p-8 text-center shadow-sm" />
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const success = status === "success";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border-light bg-card-bg p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface">
          {success ? (
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          ) : (
            <XCircle className="h-7 w-7 text-amber-600" />
          )}
        </div>

        <h1 className="text-xl font-semibold text-foreground">
          {success ? "Payment received" : "Payment cancelled"}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          {success
            ? "Your payment was processed successfully."
            : "No payment was taken. You can return to your invoice and try again."}
        </p>

        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Return to Magic
          </Link>
        </div>
      </div>
    </div>
  );
}
