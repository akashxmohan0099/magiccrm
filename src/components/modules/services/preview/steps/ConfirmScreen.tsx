"use client";

import { Check, Calendar as CalendarIcon } from "lucide-react";
import type { Service, ServiceAddon, TeamMember } from "@/types/models";
import type { FlowState } from "../types";
import { chainItems, formatDate, minutesToHHMM } from "../helpers";
import { useResourcesStore } from "@/store/resources";
import { useLocationsStore } from "@/store/locations";

export function ConfirmScreen({
  items,
  totalPrice,
  totalDuration,
  flow,
  businessName,
  primaryColor,
  members,
  onReset,
}: {
  items: {
    service: Service;
    variantId?: string;
    artistId?: string | null;
    addons: ServiceAddon[];
    price: number;
    basePrice: number;
    duration: number;
    baseDuration: number;
  }[];
  totalPrice: number;
  totalDuration: number;
  flow: FlowState;
  businessName: string;
  primaryColor: string;
  members: TeamMember[];
  onReset: () => void;
}) {
  // Workspace-wide stores so the operator-only panel can resolve resource +
  // location names without threading them through every parent.
  const resources = useResourcesStore((s) => s.resources);
  const locations = useLocationsStore((s) => s.locations);

  if (items.length === 0) return null;
  // Any service in the basket flagged "requires confirmation" puts the
  // whole booking into pending state. The PRD §5.1 calls this out — the
  // copy and tone need to match what actually happened on the back end.
  const needsApproval = items.some((i) => i.service.requiresConfirmation);

  // Pull worst-case terms across the basket so the preview mirrors the
  // public flow's policy disclosure. Same shape as `policyDisclosure` in
  // /book/[slug]/page.tsx so the operator sees what the customer sees.
  let maxCancelWindow = 0;
  let maxCancelFee = 0;
  let maxNoShowFee = 0;
  let minAutoCancel = Infinity;
  let maxRebook = 0;
  let needsCard = false;
  const patchTestServiceNames: string[] = [];
  for (const i of items) {
    const s = i.service;
    if (s.cancellationWindowHours && s.cancellationWindowHours > maxCancelWindow) {
      maxCancelWindow = s.cancellationWindowHours;
    }
    if (s.cancellationFee && s.cancellationFee > maxCancelFee) {
      maxCancelFee = s.cancellationFee;
    }
    if (s.depositNoShowFee && s.depositNoShowFee > maxNoShowFee) {
      maxNoShowFee = s.depositNoShowFee;
    }
    if (s.depositAutoCancelHours && s.depositAutoCancelHours > 0 && s.depositAutoCancelHours < minAutoCancel) {
      minAutoCancel = s.depositAutoCancelHours;
    }
    if (s.rebookAfterDays && s.rebookAfterDays > maxRebook) maxRebook = s.rebookAfterDays;
    if (s.requiresCardOnFile) needsCard = true;
    if (s.requiresPatchTest) patchTestServiceNames.push(s.name);
  }
  const cancelWindowHours = maxCancelWindow > 0 ? maxCancelWindow : null;
  const cancelFeePct = maxCancelFee > 0 ? maxCancelFee : null;
  const noShowFeePct = maxNoShowFee > 0 ? maxNoShowFee : null;
  const autoCancelHours = Number.isFinite(minAutoCancel) ? minAutoCancel : null;
  const rebookAfterDays = maxRebook > 0 ? maxRebook : null;
  const hasPolicyToShow =
    cancelWindowHours != null ||
    cancelFeePct != null ||
    noShowFeePct != null ||
    autoCancelHours != null ||
    needsCard ||
    patchTestServiceNames.length > 0;

  // Operator-only "behind the scenes" panel — surfaces fields the customer
  // never sees so the operator can verify what the scheduler is doing.
  // Pulls buffers, split duration, required resources, and locked
  // locations across the basket.
  const totalBufferBefore = items.reduce(
    (s, i) => s + (i.service.bufferBefore ?? 0),
    0,
  );
  const totalBufferAfter = items.reduce(
    (s, i) => s + (i.service.bufferAfter ?? 0),
    0,
  );
  const totalChairTime = totalDuration + totalBufferBefore + totalBufferAfter;
  const splitItems = items.filter(
    (i) =>
      (i.service.durationActiveBefore ?? 0) > 0 ||
      (i.service.durationProcessing ?? 0) > 0 ||
      (i.service.durationActiveAfter ?? 0) > 0,
  );
  const resourceIds = Array.from(
    new Set(items.flatMap((i) => i.service.requiredResourceIds ?? [])),
  );
  const requiredResourceNames = resourceIds
    .map((id) => resources.find((r) => r.id === id)?.name)
    .filter((n): n is string => Boolean(n));
  const locationIdSets = items
    .map((i) => i.service.locationIds ?? [])
    .filter((arr) => arr.length > 0);
  const lockedLocationNames =
    locationIdSets.length > 0
      ? Array.from(new Set(locationIdSets.flat()))
          .map((id) => locations.find((l) => l.id === id)?.name)
          .filter((n): n is string => Boolean(n))
      : [];
  const hasOperatorNotes =
    totalBufferBefore > 0 ||
    totalBufferAfter > 0 ||
    splitItems.length > 0 ||
    requiredResourceNames.length > 0 ||
    lockedLocationNames.length > 0;
  return (
    <div className="text-center py-6 space-y-5">
      <div
        className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
        style={{
          backgroundColor: needsApproval ? "#fef3c7" : `${primaryColor}20`,
          boxShadow: needsApproval ? "0 0 0 4px #fef3c780" : `0 0 0 4px ${primaryColor}1a`,
        }}
      >
        <Check
          className="w-8 h-8"
          style={{ color: needsApproval ? "#b45309" : primaryColor }}
        />
      </div>
      <div>
        <h3 className="text-[20px] font-bold text-foreground">
          {needsApproval ? "Request received" : "You're booked!"}
        </h3>
        <p className="text-[13px] text-text-secondary mt-1">
          {needsApproval
            ? `${businessName} will confirm your booking shortly. We'll email ${flow.email || "you"} as soon as it's approved.`
            : `A confirmation has been sent to ${flow.email || "your email"}.`}
        </p>
      </div>

      <div className="bg-card-bg border border-border-light rounded-2xl p-5 text-left space-y-3 max-w-md mx-auto">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-text-tertiary mb-1.5">
            {items.length === 1 ? "Service" : "Services"}
          </p>
          <ul className="space-y-2">
            {chainItems(items, flow.time).map(({ item, startAt }) => {
              const variant = item.variantId
                ? item.service.variants?.find((v) => v.id === item.variantId)
                : null;
              const artist = item.artistId
                ? members.find((m) => m.id === item.artistId)
                : null;
              const showArtist = flow.useArtistPerService;
              return (
                <li key={item.service.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[14px] font-medium text-foreground truncate">
                      {showArtist && startAt !== null && (
                        <span className="text-text-tertiary font-normal tabular-nums mr-1.5">
                          {minutesToHHMM(startAt)}
                        </span>
                      )}
                      {item.service.name}
                      {variant && (
                        <span className="text-text-tertiary font-normal"> · {variant.name}</span>
                      )}
                    </span>
                    <span className="text-[12px] text-text-tertiary tabular-nums whitespace-nowrap">
                      {item.baseDuration} min · ${item.basePrice}
                    </span>
                  </div>
                  {showArtist && (
                    <p className="text-[11.5px] text-text-tertiary mt-0.5">
                      with {artist?.name ?? "any stylist"}
                    </p>
                  )}
                  {item.addons.length > 0 && (
                    <ul className="mt-1 ml-2 pl-3 border-l border-border-light space-y-0.5">
                      {item.addons.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-baseline justify-between gap-3 text-[12px]"
                        >
                          <span className="text-text-secondary truncate">+ {a.name}</span>
                          <span className="text-text-tertiary tabular-nums whitespace-nowrap">
                            {a.duration} min · +${a.price}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border-light">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-text-tertiary">When</p>
            <p className="text-[14px] font-semibold text-foreground">
              {flow.date ? formatDate(flow.date) : "—"}
            </p>
            <p className="text-[12px] text-text-secondary tabular-nums">
              {flow.time} · {totalDuration} min
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-text-tertiary">With</p>
            <p className="text-[14px] font-semibold text-foreground">
              {flow.artist?.name ?? "Any artist"}
            </p>
            <p className="text-[12px] text-text-secondary">{businessName}</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-border-light">
          <p className="text-[11px] uppercase tracking-wide text-text-tertiary">Total</p>
          <p className="text-[16px] font-bold text-foreground tabular-nums">${totalPrice}</p>
        </div>
      </div>

      {hasPolicyToShow && (
        <div className="bg-card-bg border border-border-light rounded-2xl p-5 text-left max-w-md mx-auto">
          <p className="text-[11px] uppercase tracking-wide text-text-tertiary mb-2">
            Booking policy
          </p>
          <ul className="text-[12px] text-text-secondary space-y-1.5 leading-snug">
            {needsCard && (
              <li>
                A card on file is required. It&apos;s collected before the
                booking is confirmed and only charged for no-show or
                late-cancel fees.
              </li>
            )}
            {patchTestServiceNames.length > 0 && (
              <li>
                {patchTestServiceNames.length === 1
                  ? `${patchTestServiceNames[0]} requires a patch test on file before your appointment.`
                  : `These services require a patch test on file: ${patchTestServiceNames.join(", ")}.`}
              </li>
            )}
            {cancelWindowHours != null && (
              <li>
                Cancel for free up to{" "}
                <span className="font-medium text-foreground">{cancelWindowHours}h</span>{" "}
                before the appointment.
                {cancelFeePct != null && (
                  <>
                    {" "}Cancellations inside that window are charged{" "}
                    <span className="font-medium text-foreground">{cancelFeePct}%</span>{" "}
                    of the service price.
                  </>
                )}
              </li>
            )}
            {noShowFeePct != null && (
              <li>
                No-show fee:{" "}
                <span className="font-medium text-foreground">{noShowFeePct}%</span>{" "}
                of the service price.
              </li>
            )}
            {autoCancelHours != null && (
              <li>
                If a deposit isn&apos;t paid within{" "}
                <span className="font-medium text-foreground">{autoCancelHours}h</span>,
                the booking is automatically released.
              </li>
            )}
          </ul>
        </div>
      )}

      {hasOperatorNotes && (
        <div className="bg-surface/60 border border-dashed border-border-light rounded-2xl p-5 text-left max-w-md mx-auto">
          <p className="text-[11px] uppercase tracking-wide text-text-tertiary mb-2 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-text-tertiary" />
            Behind the scenes
            <span className="text-text-tertiary normal-case font-normal tracking-normal">
              · only you see this
            </span>
          </p>
          <ul className="text-[12px] text-text-secondary space-y-1.5 leading-snug">
            {(totalBufferBefore > 0 || totalBufferAfter > 0) && (
              <li>
                Chair occupied{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {totalChairTime}m
                </span>{" "}
                ({totalDuration}m service
                {totalBufferBefore > 0 && ` + ${totalBufferBefore}m buffer before`}
                {totalBufferAfter > 0 && ` + ${totalBufferAfter}m buffer after`}
                ).
              </li>
            )}
            {splitItems.map((i) => {
              const ab = i.service.durationActiveBefore ?? 0;
              const proc = i.service.durationProcessing ?? 0;
              const aa = i.service.durationActiveAfter ?? 0;
              return (
                <li key={i.service.id}>
                  <span className="font-medium text-foreground">{i.service.name}</span> split:
                  {ab > 0 && ` ${ab}m active`}
                  {ab > 0 && (proc > 0 || aa > 0) && " →"}
                  {proc > 0 && ` ${proc}m processing`}
                  {proc > 0 && aa > 0 && " →"}
                  {aa > 0 && ` ${aa}m active`}
                  . Processing time can be re-booked for short services.
                </li>
              );
            })}
            {requiredResourceNames.length > 0 && (
              <li>
                Locks{" "}
                <span className="font-medium text-foreground">
                  {requiredResourceNames.join(", ")}
                </span>{" "}
                for the full slot.
              </li>
            )}
            {lockedLocationNames.length > 0 && (
              <li>
                Bookable at{" "}
                <span className="font-medium text-foreground">
                  {lockedLocationNames.join(", ")}
                </span>{" "}
                only.
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        {rebookAfterDays != null && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white px-3.5 py-2 rounded-full cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            <CalendarIcon className="w-3.5 h-3.5" /> Book your next in {rebookAfterDays} days
          </button>
        )}
        <button
          onClick={onReset}
          className="text-[13px] font-medium text-text-secondary hover:text-foreground cursor-pointer flex items-center gap-1.5"
        >
          <CalendarIcon className="w-3.5 h-3.5" /> Book another
        </button>
      </div>
    </div>
  );
}
