import { useClientsStore } from "@/store/clients";
import { useBookingsStore } from "@/store/bookings";
import { useLeadsStore } from "@/store/leads";
import { useInvoicesStore } from "@/store/invoices";
import { useJobsStore } from "@/store/jobs";
import { generateId } from "@/lib/id";

interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

interface ToolResult {
  success: boolean;
  result: string;
}

export function executeToolCall(toolCall: ToolCall): ToolResult {
  try {
    switch (toolCall.name) {
      // ── Create Client ─────────────────────────────────
      case "create_client": {
        const { name, email, phone, notes, tags } = toolCall.input as {
          name: string;
          email?: string;
          phone?: string;
          notes?: string;
          tags?: string[];
        };
        const client = useClientsStore.getState().addClient({
          name,
          email: email || "",
          phone: phone || "",
          notes: notes || "",
          tags: tags || [],
          status: "active",
        });
        return {
          success: true,
          result: `Created client "${client.name}"`,
        };
      }

      // ── Update Client ─────────────────────────────────
      case "update_client": {
        const { clientId, name, email, phone, status, notes } = toolCall.input as {
          clientId: string;
          name?: string;
          email?: string;
          phone?: string;
          status?: "active" | "inactive" | "prospect" | "vip" | "churned";
          notes?: string;
        };
        const existing = useClientsStore.getState().getClient(clientId);
        if (!existing) {
          return { success: false, result: `Client with ID "${clientId}" not found` };
        }
        const clientUpdates: Record<string, unknown> = {};
        if (name !== undefined) clientUpdates.name = name;
        if (email !== undefined) clientUpdates.email = email;
        if (phone !== undefined) clientUpdates.phone = phone;
        if (status !== undefined) clientUpdates.status = status;
        if (notes !== undefined) clientUpdates.notes = notes;
        useClientsStore.getState().updateClient(clientId, clientUpdates);
        return {
          success: true,
          result: `Updated client "${existing.name}"`,
        };
      }

      // ── Create Booking ────────────────────────────────
      case "create_booking": {
        const { title, clientId, date, startTime, endTime, serviceId, price } =
          toolCall.input as {
            title: string;
            clientId: string;
            date: string;
            startTime: string;
            endTime: string;
            serviceId?: string;
            price?: number;
          };
        const booking = useBookingsStore.getState().addBooking({
          title,
          clientId,
          date,
          startTime,
          endTime,
          status: "confirmed",
          notes: "",
          ...(serviceId && { serviceId }),
          ...(price !== undefined && { price }),
        });
        if (!booking) {
          return {
            success: false,
            result: "Failed to create booking — client may not exist",
          };
        }
        return {
          success: true,
          result: `Booked "${booking.title}" on ${booking.date} at ${booking.startTime}`,
        };
      }

      // ── Cancel Booking ────────────────────────────────
      case "cancel_booking": {
        const { bookingId, reason } = toolCall.input as {
          bookingId: string;
          reason?: string;
        };
        const bookings = useBookingsStore.getState().bookings;
        const target = bookings.find((b) => b.id === bookingId);
        if (!target) {
          return {
            success: false,
            result: `Booking with ID "${bookingId}" not found`,
          };
        }
        useBookingsStore.getState().updateBooking(bookingId, {
          status: "cancelled",
          ...(reason && { cancellationReason: reason }),
        });
        return {
          success: true,
          result: `Cancelled booking "${target.title}" on ${target.date}`,
        };
      }

      // ── Update Booking ────────────────────────────────
      case "update_booking": {
        const { bookingId, date, startTime, endTime, status } = toolCall.input as {
          bookingId: string;
          date?: string;
          startTime?: string;
          endTime?: string;
          status?: "confirmed" | "pending" | "cancelled" | "completed";
        };
        const bookingList = useBookingsStore.getState().bookings;
        const bookingTarget = bookingList.find((b) => b.id === bookingId);
        if (!bookingTarget) {
          return {
            success: false,
            result: `Booking with ID "${bookingId}" not found`,
          };
        }
        const bookingUpdates: Record<string, unknown> = {};
        if (date !== undefined) bookingUpdates.date = date;
        if (startTime !== undefined) bookingUpdates.startTime = startTime;
        if (endTime !== undefined) bookingUpdates.endTime = endTime;
        if (status !== undefined) bookingUpdates.status = status;
        useBookingsStore.getState().updateBooking(bookingId, bookingUpdates);
        return {
          success: true,
          result: `Updated booking "${bookingTarget.title}"`,
        };
      }

      // ── Create Lead ───────────────────────────────────
      case "create_lead": {
        const { name, email, phone, source, notes, value } =
          toolCall.input as {
            name: string;
            email?: string;
            phone?: string;
            source?: string;
            notes?: string;
            value?: number;
          };
        const lead = useLeadsStore.getState().addLead({
          name,
          email: email || "",
          phone: phone || "",
          source: source || "",
          notes: notes || "",
          stage: "new",
          ...(value !== undefined && { value }),
        });
        return {
          success: true,
          result: `Created lead "${lead.name}"`,
        };
      }

      // ── Create Invoice ────────────────────────────────
      case "create_invoice": {
        const { clientId, lineItems, dueDate } = toolCall.input as {
          clientId: string;
          lineItems: { description: string; quantity: number; unitPrice: number }[];
          dueDate?: string;
        };
        const formattedItems = lineItems.map((li) => ({
          ...li,
          id: generateId(),
        }));
        const invoice = useInvoicesStore.getState().addInvoice({
          clientId,
          lineItems: formattedItems,
          status: "draft",
          notes: "",
          ...(dueDate && { dueDate }),
        });
        if (!invoice) {
          return {
            success: false,
            result: "Failed to create invoice — client may not exist",
          };
        }
        const total = formattedItems.reduce(
          (sum, li) => sum + li.quantity * li.unitPrice,
          0
        );
        return {
          success: true,
          result: `Created invoice ${invoice.number} for $${total.toFixed(2)}`,
        };
      }

      // ── Create Job ────────────────────────────────────
      case "create_job": {
        const { title, description, clientId, dueDate } = toolCall.input as {
          title: string;
          description?: string;
          clientId?: string;
          dueDate?: string;
        };
        const job = useJobsStore.getState().addJob({
          title,
          description: description || "",
          stage: "todo",
          ...(clientId && { clientId }),
          ...(dueDate && { dueDate }),
        });
        if (!job) {
          return {
            success: false,
            result: "Failed to create job — client may not exist",
          };
        }
        return {
          success: true,
          result: `Created job "${job.title}"`,
        };
      }

      default:
        return {
          success: false,
          result: `Unknown tool: ${toolCall.name}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      result: `Error executing ${toolCall.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
