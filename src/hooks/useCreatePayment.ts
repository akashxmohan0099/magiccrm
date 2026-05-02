import { usePaymentsStore, nextDocNumber } from "@/store/payments";
import { useServicesStore } from "@/store/services";
import { useBookingsStore } from "@/store/bookings";
import { useClientsStore } from "@/store/clients";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/Toast";
import type { PaymentDocLabel } from "@/types/models";

export function useCreatePayment() {
  const { addDocument, addLineItem } = usePaymentsStore();
  const { services } = useServicesStore();
  const { bookings } = useBookingsStore();
  const { clients } = useClientsStore();
  const { workspaceId } = useAuth();

  const createPayment = ({
    clientId,
    clientName,
    label = "invoice",
    bookingId,
    serviceId,
  }: {
    clientId: string;
    clientName?: string;
    label?: PaymentDocLabel;
    bookingId?: string;
    serviceId?: string;
  }) => {
    const docNumber = nextDocNumber(label);

    // For group bookings, walk the parent + every guest so a single
    // invoice covers the whole party (Fresha-style consolidated bill).
    // Falls back to the single-service path when bookingId isn't a group.
    const sourceBooking = bookingId
      ? bookings.find((b) => b.id === bookingId) ?? null
      : null;
    const primaryBooking = sourceBooking?.groupParentBookingId
      ? bookings.find((b) => b.id === sourceBooking.groupParentBookingId) ??
        sourceBooking
      : sourceBooking;
    const groupBookings = primaryBooking
      ? [
          primaryBooking,
          ...bookings.filter(
            (b) => b.groupParentBookingId === primaryBooking.id,
          ),
        ]
      : [];

    const lineSpecs: { description: string; unitPrice: number }[] = [];
    if (groupBookings.length >= 2) {
      // Group: one line per booking, each priced from its own
      // resolvedPrice (carries variant + addons + dynamic rules); fall
      // back to service.price when the older row lacks resolvedPrice.
      for (const b of groupBookings) {
        const svc = services.find((s) => s.id === b.serviceId);
        const isGuest = !!b.groupParentBookingId;
        const personName = isGuest
          ? b.groupGuestName ||
            clients.find((c) => c.id === b.clientId)?.name ||
            "Guest"
          : clients.find((c) => c.id === b.clientId)?.name ||
            clientName ||
            "Primary";
        const price =
          (b.resolvedPrice ?? svc?.price ?? 0) +
          0;
        lineSpecs.push({
          description: `${svc?.name ?? "Service"} — ${personName}`,
          unitPrice: price,
        });
      }
    } else {
      // Single-service path: one line item from the explicit serviceId.
      const service = serviceId
        ? services.find((s) => s.id === serviceId)
        : null;
      if (service) {
        lineSpecs.push({
          description: service.name,
          unitPrice: sourceBooking?.resolvedPrice ?? service.price,
        });
      }
    }

    const total = lineSpecs.reduce((s, l) => s + l.unitPrice, 0);

    const doc = addDocument(
      {
        workspaceId: workspaceId ?? "",
        documentNumber: docNumber,
        clientId,
        bookingId: primaryBooking?.id ?? bookingId,
        label,
        status: "draft",
        total,
        notes: "",
      },
      workspaceId || undefined
    );

    if (doc) {
      lineSpecs.forEach((line, idx) => {
        addLineItem(
          doc.id,
          {
            paymentDocumentId: doc.id,
            workspaceId: workspaceId ?? "",
            description: line.description,
            quantity: 1,
            unitPrice: line.unitPrice,
            sortOrder: idx,
          },
          workspaceId || undefined
        );
      });
    }

    if (doc) {
      const typeLabel = label === "quote" ? "Quote" : "Invoice";
      toast(
        `${typeLabel} ${docNumber} created${clientName ? ` for ${clientName}` : ""}`
      );
    }

    return doc;
  };

  return { createPayment };
}
