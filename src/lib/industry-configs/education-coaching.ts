import type { IndustryAdaptiveConfig, IndustryAdaptiveOverride } from "@/types/industry-config";

export const educationCoachingConfig: IndustryAdaptiveConfig = {
  id: "education-coaching",
  label: "Education & Coaching",

  vocabulary: {
    client: "Student",
    clients: "Students",
    job: "Course",
    jobs: "Courses",
    booking: "Lesson",
    bookings: "Lessons",
    invoice: "Invoice",
    invoices: "Invoices",
    lead: "Inquiry",
    leads: "Inquiries",
    quote: "Quote",
    quotes: "Quotes",
    addClient: "Add Student",
    addJob: "New Course",
    addBooking: "Schedule Lesson",
    addInvoice: "New Invoice",
    addLead: "New Inquiry",
  },

  customFields: {
    clients: [
      { id: "year-level", label: "Year Level", type: "select", options: ["Primary", "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12", "University", "Adult"], group: "Education Details" },
      { id: "school", label: "School / Institution", type: "text", placeholder: "School or university name", group: "Education Details" },
      { id: "subjects", label: "Subjects", type: "text", placeholder: "e.g. Maths, English, Science...", group: "Education Details" },
      { id: "learning-notes", label: "Learning Notes", type: "textarea", placeholder: "Learning style, strengths, areas to improve...", group: "Education Details" },
    ],
  },

  relationships: [
    { id: "parent", label: "Parent / Guardian", inverseLabel: "Student" },
    { id: "sibling", label: "Sibling", inverseLabel: "Sibling" },
  ],

  jobStages: [
    { id: "enrolled", label: "Enrolled", color: "bg-blue-400" },
    { id: "in-progress", label: "In Progress", color: "bg-yellow-400" },
    { id: "review", label: "Assessment", color: "bg-purple-400" },
    { id: "completed", label: "Completed", color: "bg-green-400", isClosed: true },
    { id: "withdrawn", label: "Withdrawn", color: "bg-red-400", isClosed: true },
  ],

  leadStages: [
    { id: "new", label: "New Inquiry", color: "bg-blue-500" },
    { id: "trial", label: "Trial Lesson", color: "bg-cyan-500" },
    { id: "follow-up", label: "Follow Up", color: "bg-purple-500" },
    { id: "won", label: "Enrolled", color: "bg-green-500", isClosed: true },
    { id: "lost", label: "Lost", color: "bg-red-500", isClosed: true },
  ],

  invoiceMode: {
    defaultMode: "recurring",
    availableModes: ["one-time", "recurring", "session-pack"],
  },

  bookingMode: {
    defaultMode: "recurring-lesson",
    defaultServices: [
      { id: "private-lesson", name: "Private Lesson", duration: 60, price: 80, category: "Lessons" },
      { id: "group-lesson", name: "Group Lesson", duration: 60, price: 40, category: "Lessons" },
      { id: "assessment", name: "Assessment", duration: 45, price: 60, category: "Assessment" },
      { id: "trial", name: "Trial Lesson", duration: 45, price: 0, category: "Trial" },
    ],
  },

  dashboard: {
    quickActions: [
      { label: "Schedule Lesson", icon: "Calendar", href: "/dashboard/bookings", shortcut: "⌘B" },
      { label: "Add Student", icon: "Users", href: "/dashboard/clients", shortcut: "⌘N" },
      { label: "New Invoice", icon: "Receipt", href: "/dashboard/invoicing", shortcut: "⌘I" },
      { label: "Send Message", icon: "MessageCircle", href: "/dashboard/communication", shortcut: "⌘M" },
    ],
  },
};

/** Persona overrides */
export const educationPersonaOverrides: Record<string, IndustryAdaptiveOverride> = {
  "life-business-coach": {
    customFields: {
      clients: [
        { id: "company", label: "Company / Organisation", type: "text", placeholder: "Company or business name", group: "Business Details" },
        { id: "role", label: "Role / Title", type: "text", placeholder: "e.g. CEO, Marketing Director...", group: "Business Details" },
        { id: "industry", label: "Industry", type: "text", placeholder: "e.g. Tech, Finance, Healthcare...", group: "Business Details" },
        { id: "coaching-goals", label: "Coaching Goals", type: "textarea", placeholder: "e.g. Leadership development, work-life balance, revenue growth...", group: "Coaching" },
      ],
    },
    vocabulary: {
      client: "Client",
      clients: "Clients",
      addClient: "Add Client",
      job: "Program",
      jobs: "Programs",
      addJob: "New Program",
      booking: "Session",
      bookings: "Sessions",
      addBooking: "Book Session",
      lead: "Lead",
      leads: "Leads",
      addLead: "Add Lead",
    },
    bookingMode: {
      defaultMode: "service-menu",
      defaultServices: [
        { id: "discovery-call", name: "Discovery Call", duration: 30, price: 0, category: "Sessions" },
        { id: "coaching-session", name: "Coaching Session", duration: 60, price: 200, category: "Sessions" },
        { id: "group-coaching", name: "Group Coaching", duration: 90, price: 80, category: "Sessions" },
        { id: "vip-intensive", name: "VIP Intensive", duration: 180, price: 500, category: "Sessions" },
      ],
    },
  },
  "driving-instructor": {
    customFields: {
      clients: [
        { id: "permit-number", label: "Learner Permit Number", type: "text", placeholder: "Permit or licence number", group: "Licence Details" },
        { id: "hours-logged", label: "Hours Logged", type: "number", placeholder: "Total supervised hours", group: "Licence Details" },
        { id: "test-date", label: "Test Date", type: "date", group: "Licence Details" },
        { id: "vehicle-pref", label: "Vehicle Preference", type: "select", options: ["Auto", "Manual"], group: "Licence Details" },
      ],
    },
  },
  "online-course-creator": {
    customFields: {
      clients: [
        { id: "platform", label: "Platform", type: "select", options: ["Own Website", "Teachable", "Kajabi", "Thinkific", "Udemy", "Other"], group: "Course Details" },
        { id: "course-topic", label: "Course Topic", type: "text", placeholder: "e.g. Freelance design, photography basics...", group: "Course Details" },
        { id: "audience", label: "Target Audience", type: "text", placeholder: "e.g. Small business owners, aspiring designers...", group: "Course Details" },
        { id: "email-list-size", label: "Email List Size", type: "number", placeholder: "Subscriber count", group: "Marketing" },
      ],
    },
  },
};
