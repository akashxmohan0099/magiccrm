import type { IndustryAdaptiveConfig } from "@/types/industry-config";

export const retailEcommerceConfig: IndustryAdaptiveConfig = {
  id: "retail-ecommerce",
  label: "Retail & E-commerce",

  vocabulary: {
    client: "Customer",
    clients: "Customers",
    job: "Order",
    jobs: "Orders",
    booking: "Appointment",
    bookings: "Appointments",
    invoice: "Invoice",
    invoices: "Invoices",
    lead: "Lead",
    leads: "Leads",
    quote: "Quote",
    quotes: "Quotes",
    addClient: "Add Customer",
    addJob: "New Order",
    addBooking: "New Appointment",
    addInvoice: "New Invoice",
    addLead: "Add Lead",
  },

  customFields: {
    clients: [
      { id: "shipping-address", label: "Shipping Address", type: "textarea", placeholder: "Full shipping address...", group: "Shipping" },
      { id: "preferred-products", label: "Preferred Products", type: "text", placeholder: "Favorite categories or products...", group: "Preferences" },
      { id: "loyalty-tier", label: "Loyalty Tier", type: "select", options: ["Standard", "Silver", "Gold", "VIP"], group: "Preferences" },
    ],
  },

  relationships: [],

  jobStages: [
    { id: "inquiry", label: "Inquiry", color: "bg-blue-400" },
    { id: "quoted", label: "Quoted", color: "bg-cyan-400" },
    { id: "ordered", label: "Ordered", color: "bg-purple-400" },
    { id: "shipped", label: "Shipped", color: "bg-yellow-400" },
    { id: "delivered", label: "Delivered", color: "bg-green-400", isClosed: true },
    { id: "cancelled", label: "Cancelled", color: "bg-red-400", isClosed: true },
  ],

  leadStages: [
    { id: "new", label: "New", color: "bg-blue-500" },
    { id: "contacted", label: "Contacted", color: "bg-yellow-500" },
    { id: "interested", label: "Interested", color: "bg-purple-500" },
    { id: "won", label: "Customer", color: "bg-green-500", isClosed: true },
    { id: "lost", label: "Lost", color: "bg-red-500", isClosed: true },
  ],

  invoiceMode: {
    defaultMode: "one-time",
    availableModes: ["one-time"],
  },

  bookingMode: {
    defaultMode: "appointment",
  },

  dashboard: {
    quickActions: [
      { label: "New Order", icon: "FolderKanban", href: "/dashboard/jobs", shortcut: "⌘J" },
      { label: "Add Customer", icon: "Users", href: "/dashboard/clients", shortcut: "⌘N" },
      { label: "New Invoice", icon: "Receipt", href: "/dashboard/invoicing", shortcut: "⌘I" },
      { label: "Send Message", icon: "MessageCircle", href: "/dashboard/communication", shortcut: "⌘M" },
    ],
  },
};
