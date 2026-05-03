"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import {
  PublicBookingFlow,
  type AvailabilitySlot,
  type PublicBookingSubmitPayload,
  type PublicBookingSubmitResult,
} from "@/components/modules/bookings/public/PublicBookingFlow";
import type {
  PublicLocation,
  PublicMember,
  PublicService,
} from "@/components/modules/bookings/public/types";

/**
 * Public booking page. Thin wrapper that fetches workspace + catalog data
 * from `/api/public/book/info` and mounts <PublicBookingFlow>. The flow
 * itself is shared with the dashboard preview so there is no parallel UI
 * implementation to drift.
 */
export default function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("Business");
  const [brandColor, setBrandColor] = useState("#34D399");
  const [services, setServices] = useState<PublicService[]>([]);
  const [members, setMembers] = useState<PublicMember[]>([]);
  const [memberServiceMap, setMemberServiceMap] = useState<Record<string, string[]>>({});
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [locations, setLocations] = useState<PublicLocation[]>([]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/book/info?slug=${encodeURIComponent(slug)}`);
        if (cancelled) return;
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Not found" }));
          setError(data.error || "Booking page not found.");
          return;
        }
        const data = await res.json();
        setBusinessName(data.businessName || "Business");
        setBrandColor(data.brandColor || "#34D399");
        setServices((data.services as PublicService[]) || []);
        setMembers((data.members as PublicMember[]) || []);
        setMemberServiceMap((data.memberServiceMap as Record<string, string[]>) || {});
        setAvailability((data.availability as AvailabilitySlot[]) || []);
        setLocations((data.locations as PublicLocation[]) || []);
      } catch {
        if (!cancelled) setError("Failed to load booking page. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleSubmit = async (
    payload: PublicBookingSubmitPayload,
  ): Promise<PublicBookingSubmitResult> => {
    try {
      const res = await fetch("/api/public/book/basket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          ok: false,
          error: data.error || "Couldn't confirm your booking. Please try again.",
        };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "Couldn't reach the server. Please try again." };
    }
  };

  return (
    <PublicBookingFlow
      slug={slug}
      loading={loading}
      error={error}
      businessName={businessName}
      brandColor={brandColor}
      services={services}
      members={members}
      memberServiceMap={memberServiceMap}
      availability={availability}
      locations={locations}
      onSubmit={handleSubmit}
    />
  );
}
