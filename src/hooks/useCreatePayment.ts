import { usePaymentsStore, nextDocNumber } from "@/store/payments";
import { useServicesStore } from "@/store/services";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/Toast";
import type { PaymentDocLabel } from "@/types/models";

export function useCreatePayment() {
  const { addDocument, addLineItem } = usePaymentsStore();
  const { services } = useServicesStore();
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
    const service = serviceId ? services.find((s) => s.id === serviceId) : null;
    const total = service ? service.price : 0;

    const doc = addDocument(
      {
        workspaceId: workspaceId ?? "",
        documentNumber: docNumber,
        clientId,
        bookingId,
        label,
        status: "draft",
        total,
        notes: "",
      },
      workspaceId || undefined
    );

    if (doc && service) {
      addLineItem(
        doc.id,
        {
          paymentDocumentId: doc.id,
          workspaceId: workspaceId ?? "",
          description: service.name,
          quantity: 1,
          unitPrice: service.price,
          sortOrder: 0,
        },
        workspaceId || undefined
      );
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
