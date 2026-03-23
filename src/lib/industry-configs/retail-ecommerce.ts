import type { IndustryAdaptiveConfig, IndustryAdaptiveOverride } from "@/types/industry-config";

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
      { label: "Add Customer", icon: "Users", href: "/dashboard/clients", shortcut: "⌘N" },
      { label: "New Invoice", icon: "Receipt", href: "/dashboard/invoicing", shortcut: "⌘I" },
      { label: "Send Message", icon: "MessageCircle", href: "/dashboard/communication", shortcut: "⌘M" },
    ],
  },
};

/** Persona overrides */
export const retailPersonaOverrides: Record<string, IndustryAdaptiveOverride> = {
  "online-store": {
    vocabulary: {
      job: "Order",
      jobs: "Orders",
      booking: "Delivery",
      lead: "Customer Lead",
    },
    customFields: {
      clients: [
        { id: "shipping-address", label: "Shipping Address", type: "textarea", placeholder: "Full shipping address...", group: "Shipping" },
        { id: "preferred-shipping", label: "Preferred Shipping Method", type: "text", placeholder: "e.g. Express, Standard...", group: "Shipping" },
        { id: "order-history-notes", label: "Order History Notes", type: "textarea", placeholder: "Notes on past orders...", group: "History" },
        { id: "return-policy-pref", label: "Return Policy Preference", type: "select", options: ["Standard", "Extended", "No Returns"], group: "Preferences" },
      ],
    },
  },
  "boutique-shop": {
    vocabulary: {
      job: "Order",
      jobs: "Orders",
      booking: "Appointment",
      lead: "Customer Lead",
    },
    customFields: {
      clients: [
        { id: "size-preferences", label: "Size Preferences", type: "text", placeholder: "e.g. S, M, EU 38...", group: "Preferences" },
        { id: "style-profile", label: "Style Profile", type: "textarea", placeholder: "Preferred styles, colours, brands...", group: "Preferences" },
        { id: "wishlist-notes", label: "Wishlist Notes", type: "textarea", placeholder: "Items on their wishlist...", group: "Preferences" },
        { id: "vip-tier", label: "VIP Tier", type: "select", options: ["Standard", "Silver", "Gold", "VIP"], group: "Loyalty" },
      ],
    },
  },
  "handmade-artisan": {
    vocabulary: {
      job: "Custom Order",
      jobs: "Custom Orders",
      booking: "Consultation",
      lead: "Inquiry",
    },
    customFields: {
      clients: [
        { id: "custom-brief", label: "Custom Brief", type: "textarea", placeholder: "Details of the custom request...", group: "Order Details" },
        { id: "materials-preference", label: "Materials Preference", type: "text", placeholder: "e.g. Sterling silver, oak wood...", group: "Order Details" },
        { id: "production-timeline", label: "Production Timeline", type: "text", placeholder: "e.g. 2-3 weeks...", group: "Order Details" },
        { id: "marketplace-profile", label: "Marketplace Profile", type: "text", placeholder: "e.g. Etsy shop URL...", group: "Marketplace" },
      ],
    },
  },
  "food-beverage": {
    vocabulary: {
      job: "Order",
      jobs: "Orders",
      lead: "Wholesale Lead",
    },
    customFields: {
      clients: [
        { id: "dietary-requirements", label: "Dietary Requirements", type: "textarea", placeholder: "e.g. Vegan, gluten-free...", group: "Dietary" },
        { id: "allergen-info", label: "Allergen Info", type: "textarea", placeholder: "Known allergies...", group: "Dietary" },
        { id: "delivery-schedule", label: "Delivery Schedule", type: "text", placeholder: "e.g. Weekly on Mondays...", group: "Logistics" },
        { id: "account-type", label: "Account Type", type: "select", options: ["Retail", "Wholesale", "Market Stall", "Online"], group: "Account" },
      ],
    },
  },
};
