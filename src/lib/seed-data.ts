/**
 * Seeds all stores with realistic beauty & wellness salon data.
 * Call once when stores are empty (first load without Supabase data).
 */
import { useClientsStore } from "@/store/clients";
import { useServicesStore } from "@/store/services";
import { useBookingsStore } from "@/store/bookings";
import { useCommunicationStore } from "@/store/communication";
import { useInquiriesStore } from "@/store/inquiries";
import { usePaymentsStore } from "@/store/payments";
import { useTeamStore } from "@/store/team";
import { useMarketingStore } from "@/store/marketing";
import { useAutomationsStore } from "@/store/automations";
import { useFormsStore } from "@/store/forms";
import { useSettingsStore } from "@/store/settings";
import { TeamMember } from "@/types/models";

// ── Helpers ──

function id() {
  return crypto.randomUUID();
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function dateStr(daysOffset: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split("T")[0];
}

function timeSlot(daysOffset: number, hour: number, minutes: number = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minutes, 0, 0);
  return d.toISOString();
}

const WS = "seed-workspace";

export function seedAllStores() {
  // Never seed in production — real accounts start empty.
  if (process.env.NODE_ENV === "production") return;
  // Only seed if empty
  if (useClientsStore.getState().clients.length > 0) return;
  if (useServicesStore.getState().services.length > 0) return;

  const now = new Date().toISOString();

  // ═══════════════════════════════════════
  // 1. SETTINGS
  // ═══════════════════════════════════════
  useSettingsStore.setState({
    settings: {
      workspaceId: WS,
      businessName: "Glow Studio",
      logoUrl: "",
      contactEmail: "hello@glowstudio.com.au",
      contactPhone: "0412 345 678",
      address: "42 Palm Avenue, Burleigh Heads QLD 4220",
      stripeAccountId: "",
      stripeOnboardingComplete: false,
      workingHours: {
        mon: { start: "09:00", end: "18:00" },
        tue: { start: "09:00", end: "18:00" },
        wed: { start: "09:00", end: "20:00" },
        thu: { start: "09:00", end: "20:00" },
        fri: { start: "09:00", end: "18:00" },
        sat: { start: "09:00", end: "15:00" },
      },
      cancellationWindowHours: 24,
      depositPercentage: 20,
      noShowFee: 50,
      messageTemplates: {
        booking_confirmation: "Hi {client_name}, your {service_name} appointment on {date} at {time} is confirmed. See you then!",
        appointment_reminder: "Reminder: You have a {service_name} appointment tomorrow at {time}. Reply to reschedule.",
        post_service_followup: "Thanks for visiting Glow Studio, {client_name}! We hope you loved your {service_name}.",
        review_request: "Hi {client_name}, we'd love your feedback! Leave us a review: {review_url}",
        cancellation_confirmation: "Your {service_name} appointment on {date} has been cancelled. We hope to see you again soon.",
      },
      notificationDefaults: "email",
      branding: { primaryColor: "#8B5CF6", accentColor: "#EC4899" },
      bookingPageSlug: "glow-studio",
      calendarSyncEnabled: false,
      minNoticeHours: 4,
      maxAdvanceDays: 56,
      autoReplyEnabled: false,
      enabledAddons: ["marketing", "win-back", "analytics"],
      enabledFeatures: [],
      updatedAt: now,
    },
    enabledAddons: ["marketing", "win-back", "analytics"],
  });

  // ═══════════════════════════════════════
  // 2. TEAM MEMBERS
  // ═══════════════════════════════════════
  const ownerMemberId = id();
  const stylist1Id = id();
  const stylist2Id = id();

  const teamMembers = [
    {
      id: ownerMemberId,
      authUserId: id(),
      workspaceId: WS,
      name: "Sophie Chen",
      email: "sophie@glowstudio.com.au",
      phone: "0412 345 678",
      role: "owner" as const,
      avatarUrl: "",
      status: "active" as const,
      workingHours: {
        mon: { start: "09:00", end: "18:00" },
        tue: { start: "09:00", end: "18:00" },
        wed: { start: "09:00", end: "20:00" },
        thu: { start: "09:00", end: "20:00" },
        fri: { start: "09:00", end: "18:00" },
        sat: { start: "09:00", end: "15:00" },
      },
      daysOff: ["sun"],
      leavePeriods: [],
      createdAt: daysAgo(90),
      updatedAt: now,
    },
    {
      id: stylist1Id,
      authUserId: id(),
      workspaceId: WS,
      name: "Mia Rodriguez",
      email: "mia@glowstudio.com.au",
      phone: "0423 456 789",
      role: "staff" as const,
      avatarUrl: "",
      status: "active" as const,
      workingHours: {
        tue: { start: "09:00", end: "17:00" },
        wed: { start: "09:00", end: "17:00" },
        thu: { start: "10:00", end: "20:00" },
        fri: { start: "10:00", end: "18:00" },
        sat: { start: "09:00", end: "15:00" },
      },
      daysOff: ["sun", "mon"],
      leavePeriods: [{ start: dateStr(14), end: dateStr(18), reason: "Annual leave" }],
      createdAt: daysAgo(60),
      updatedAt: now,
    },
    {
      id: stylist2Id,
      authUserId: id(),
      workspaceId: WS,
      name: "Liam Park",
      email: "liam@glowstudio.com.au",
      phone: "0434 567 890",
      role: "staff" as const,
      avatarUrl: "",
      status: "active" as const,
      workingHours: {
        mon: { start: "09:00", end: "17:00" },
        tue: { start: "09:00", end: "17:00" },
        wed: { start: "09:00", end: "17:00" },
        thu: { start: "09:00", end: "17:00" },
        fri: { start: "09:00", end: "17:00" },
      },
      daysOff: ["sat", "sun"],
      leavePeriods: [],
      createdAt: daysAgo(45),
      updatedAt: now,
    },
  ];

  useTeamStore.setState({ members: teamMembers as TeamMember[] });

  // ═══════════════════════════════════════
  // 3. SERVICES
  // ═══════════════════════════════════════
  const svcCutBlowdry = id();
  const svcColour = id();
  const svcBalayage = id();
  const svcKeratin = id();
  const svcManiPedi = id();
  const svcGelNails = id();
  const svcLashLift = id();
  const svcBrowLamination = id();
  const svcFacial = id();
  const svcWaxing = id();

  const svcDefaults = { bufferMinutes: 0, requiresConfirmation: false, depositType: "none" as const, depositAmount: 0, locationType: "studio" as const };

  const services = [
    { id: svcCutBlowdry, workspaceId: WS, name: "Cut & Blow Dry", description: "Precision cut with professional blow dry styling", duration: 60, price: 85, category: "Hair", enabled: true, sortOrder: 0, ...svcDefaults, createdAt: daysAgo(90), updatedAt: now },
    { id: svcColour, workspaceId: WS, name: "Full Colour", description: "Root to tip single-process colour", duration: 120, price: 180, category: "Hair", enabled: true, sortOrder: 1, ...svcDefaults, createdAt: daysAgo(90), updatedAt: now },
    { id: svcBalayage, workspaceId: WS, name: "Balayage", description: "Hand-painted highlights for a natural sun-kissed look", duration: 180, price: 320, category: "Hair", enabled: true, sortOrder: 2, ...svcDefaults, createdAt: daysAgo(90), updatedAt: now },
    { id: svcKeratin, workspaceId: WS, name: "Keratin Treatment", description: "Smoothing treatment for frizz-free, glossy hair", duration: 150, price: 280, category: "Hair", enabled: true, sortOrder: 3, ...svcDefaults, createdAt: daysAgo(90), updatedAt: now },
    { id: svcManiPedi, workspaceId: WS, name: "Mani & Pedi Combo", description: "Classic manicure and pedicure with polish", duration: 75, price: 95, category: "Nails", enabled: true, sortOrder: 4, ...svcDefaults, createdAt: daysAgo(90), updatedAt: now },
    { id: svcGelNails, workspaceId: WS, name: "Gel Nails – Full Set", description: "Long-lasting gel overlay or extensions", duration: 90, price: 120, category: "Nails", enabled: true, sortOrder: 5, ...svcDefaults, createdAt: daysAgo(90), updatedAt: now },
    { id: svcLashLift, workspaceId: WS, name: "Lash Lift & Tint", description: "Natural lash curl with darkening tint", duration: 60, price: 90, category: "Lashes & Brows", enabled: true, sortOrder: 6, ...svcDefaults, createdAt: daysAgo(90), updatedAt: now },
    { id: svcBrowLamination, workspaceId: WS, name: "Brow Lamination", description: "Brow restructuring for a fluffy, full look", duration: 45, price: 75, category: "Lashes & Brows", enabled: true, sortOrder: 7, ...svcDefaults, createdAt: daysAgo(90), updatedAt: now },
    { id: svcFacial, workspaceId: WS, name: "Signature Facial", description: "Deep cleanse, exfoliation, mask, and hydration", duration: 60, price: 130, category: "Skin", enabled: true, sortOrder: 8, ...svcDefaults, createdAt: daysAgo(90), updatedAt: now },
    { id: svcWaxing, workspaceId: WS, name: "Full Leg & Bikini Wax", description: "Smooth full leg and bikini line wax", duration: 45, price: 85, category: "Skin", enabled: true, sortOrder: 9, ...svcDefaults, createdAt: daysAgo(90), updatedAt: now },
  ];

  useServicesStore.setState({ services });

  // ═══════════════════════════════════════
  // 4. CLIENTS (created via bookings)
  // ═══════════════════════════════════════
  const clientEmma = id();
  const clientJess = id();
  const clientOlivia = id();
  const clientSarah = id();
  const clientNatalie = id();
  const clientRachel = id();
  const clientAva = id();
  const clientChloe = id();

  const clients = [
    { id: clientEmma, workspaceId: WS, name: "Emma Thompson", email: "emma.t@gmail.com", phone: "0411 222 333", notes: "Prefers low-ammonia colour. Sensitive scalp.", createdAt: daysAgo(80), updatedAt: daysAgo(2) },
    { id: clientJess, workspaceId: WS, name: "Jessica Nguyen", email: "jess.nguyen@outlook.com", phone: "0422 333 444", notes: "Regular every 6 weeks for balayage touch-up.", createdAt: daysAgo(70), updatedAt: daysAgo(5) },
    { id: clientOlivia, workspaceId: WS, name: "Olivia Martinez", email: "olivia.m@icloud.com", phone: "0433 444 555", notes: "Getting married in June. Doing trial runs.", createdAt: daysAgo(30), updatedAt: daysAgo(1) },
    { id: clientSarah, workspaceId: WS, name: "Sarah Williams", email: "sarah.w@gmail.com", phone: "0444 555 666", notes: "", createdAt: daysAgo(60), updatedAt: daysAgo(10) },
    { id: clientNatalie, workspaceId: WS, name: "Natalie Cooper", email: "nat.cooper@yahoo.com", phone: "0455 666 777", notes: "Allergic to certain wax brands — check before booking.", createdAt: daysAgo(45), updatedAt: daysAgo(7) },
    { id: clientRachel, workspaceId: WS, name: "Rachel Kim", email: "rachel.kim@gmail.com", phone: "0466 777 888", notes: "Always books lash lift + brow lamination together.", createdAt: daysAgo(40), updatedAt: daysAgo(3) },
    { id: clientAva, workspaceId: WS, name: "Ava Patel", email: "ava.patel@hotmail.com", phone: "0477 888 999", notes: "New client referred by Emma Thompson.", createdAt: daysAgo(10), updatedAt: daysAgo(1) },
    { id: clientChloe, workspaceId: WS, name: "Chloe Bennett", email: "chloe.b@gmail.com", phone: "0488 999 000", notes: "Prefers Thursday evening appointments.", createdAt: daysAgo(20), updatedAt: daysAgo(4) },
  ];

  useClientsStore.setState({ clients });

  // ═══════════════════════════════════════
  // 5. BOOKINGS
  // ═══════════════════════════════════════
  const bookingIds = Array.from({ length: 12 }, () => id());

  const bookings = [
    // Past bookings (completed)
    { id: bookingIds[0], workspaceId: WS, clientId: clientEmma, serviceId: svcColour, assignedToId: ownerMemberId, date: dateStr(-7), startAt: timeSlot(-7, 10), endAt: timeSlot(-7, 12), status: "completed" as const, notes: "Used Wella Koleston 7/1", createdAt: daysAgo(14), updatedAt: daysAgo(7) },
    { id: bookingIds[1], workspaceId: WS, clientId: clientJess, serviceId: svcBalayage, assignedToId: ownerMemberId, date: dateStr(-5), startAt: timeSlot(-5, 9), endAt: timeSlot(-5, 12), status: "completed" as const, notes: "Touch-up from roots. Happy with result.", createdAt: daysAgo(12), updatedAt: daysAgo(5) },
    { id: bookingIds[2], workspaceId: WS, clientId: clientSarah, serviceId: svcCutBlowdry, assignedToId: stylist2Id, date: dateStr(-3), startAt: timeSlot(-3, 14), endAt: timeSlot(-3, 15), status: "completed" as const, notes: "", createdAt: daysAgo(10), updatedAt: daysAgo(3) },
    { id: bookingIds[3], workspaceId: WS, clientId: clientRachel, serviceId: svcLashLift, assignedToId: stylist1Id, date: dateStr(-2), startAt: timeSlot(-2, 11), endAt: timeSlot(-2, 12), status: "completed" as const, notes: "Also did brow lamination.", createdAt: daysAgo(9), updatedAt: daysAgo(2) },
    { id: bookingIds[4], workspaceId: WS, clientId: clientNatalie, serviceId: svcWaxing, assignedToId: stylist1Id, date: dateStr(-1), startAt: timeSlot(-1, 15), endAt: timeSlot(-1, 15, 45), status: "no_show" as const, notes: "Client did not arrive. No response to calls.", createdAt: daysAgo(8), updatedAt: daysAgo(1) },

    // Today's bookings
    { id: bookingIds[5], workspaceId: WS, clientId: clientAva, serviceId: svcFacial, assignedToId: ownerMemberId, date: dateStr(0), startAt: timeSlot(0, 10), endAt: timeSlot(0, 11), status: "confirmed" as const, notes: "First visit — patch test completed.", createdAt: daysAgo(3), updatedAt: now },
    { id: bookingIds[6], workspaceId: WS, clientId: clientChloe, serviceId: svcGelNails, assignedToId: stylist1Id, date: dateStr(0), startAt: timeSlot(0, 13), endAt: timeSlot(0, 14, 30), status: "confirmed" as const, notes: "Wants French tip design.", createdAt: daysAgo(5), updatedAt: now },
    { id: bookingIds[7], workspaceId: WS, clientId: clientEmma, serviceId: svcCutBlowdry, assignedToId: stylist2Id, date: dateStr(0), startAt: timeSlot(0, 15), endAt: timeSlot(0, 16), status: "pending" as const, notes: "", createdAt: daysAgo(2), updatedAt: now },

    // Upcoming bookings
    { id: bookingIds[8], workspaceId: WS, clientId: clientOlivia, serviceId: svcBalayage, assignedToId: ownerMemberId, date: dateStr(1), startAt: timeSlot(1, 9), endAt: timeSlot(1, 12), status: "confirmed" as const, notes: "Bridal trial run #2. Wants warmer tones.", createdAt: daysAgo(7), updatedAt: now },
    { id: bookingIds[9], workspaceId: WS, clientId: clientJess, serviceId: svcKeratin, assignedToId: ownerMemberId, date: dateStr(3), startAt: timeSlot(3, 10), endAt: timeSlot(3, 12, 30), status: "confirmed" as const, notes: "First keratin treatment.", createdAt: daysAgo(4), updatedAt: now },
    { id: bookingIds[10], workspaceId: WS, clientId: clientRachel, serviceId: svcBrowLamination, assignedToId: stylist1Id, date: dateStr(5), startAt: timeSlot(5, 11), endAt: timeSlot(5, 11, 45), status: "confirmed" as const, notes: "", createdAt: daysAgo(2), updatedAt: now },
    { id: bookingIds[11], workspaceId: WS, clientId: clientSarah, serviceId: svcManiPedi, assignedToId: stylist1Id, date: dateStr(7), startAt: timeSlot(7, 14), endAt: timeSlot(7, 15, 15), status: "confirmed" as const, notes: "Birthday treat — might add gel upgrade.", createdAt: daysAgo(1), updatedAt: now },
  ];

  useBookingsStore.setState({ bookings });

  // ═══════════════════════════════════════
  // 6. CONVERSATIONS
  // ═══════════════════════════════════════
  const conv1 = id();
  const conv2 = id();
  const conv3 = id();
  const conv4 = id();
  const conv5 = id();

  const conversations = [
    { id: conv1, workspaceId: WS, contactName: "Olivia Martinez", contactEmail: "olivia.m@icloud.com", contactPhone: "0433 444 555", contactSocialHandle: "olivia_martinez_", channel: "instagram" as const, clientId: clientOlivia, lastMessageAt: daysAgo(0), unreadCount: 2, createdAt: daysAgo(5), updatedAt: now },
    { id: conv2, workspaceId: WS, contactName: "Emma Thompson", contactEmail: "emma.t@gmail.com", contactPhone: "0411 222 333", channel: "email" as const, clientId: clientEmma, lastMessageAt: daysAgo(1), unreadCount: 0, createdAt: daysAgo(10), updatedAt: daysAgo(1) },
    { id: conv3, workspaceId: WS, contactName: "Priya Sharma", contactEmail: "", contactPhone: "0499 111 222", contactSocialHandle: "priya.sharma.beauty", channel: "instagram" as const, clientId: undefined, lastMessageAt: daysAgo(0), unreadCount: 1, createdAt: daysAgo(1), updatedAt: now },
    { id: conv4, workspaceId: WS, contactName: "Unknown", contactEmail: "", contactPhone: "+61412999888", channel: "whatsapp" as const, clientId: undefined, lastMessageAt: daysAgo(2), unreadCount: 1, createdAt: daysAgo(2), updatedAt: daysAgo(2) },
    { id: conv5, workspaceId: WS, contactName: "Rachel Kim", contactEmail: "rachel.kim@gmail.com", contactPhone: "0466 777 888", channel: "facebook" as const, clientId: clientRachel, lastMessageAt: daysAgo(3), unreadCount: 0, createdAt: daysAgo(15), updatedAt: daysAgo(3) },
  ];

  const messages: Record<string, Array<{ id: string; conversationId: string; workspaceId: string; content: string; sender: "user" | "client"; createdAt: string }>> = {
    [conv1]: [
      { id: id(), conversationId: conv1, workspaceId: WS, content: "Hey! I saw your balayage work on your stories — absolutely gorgeous! I'm getting married in June and would love to book a bridal trial. Do you have any availability next week?", sender: "client", createdAt: daysAgo(5) },
      { id: id(), conversationId: conv1, workspaceId: WS, content: "Thank you so much Olivia! Congratulations on the wedding! I'd love to help. I have Thursday or Friday next week available. The bridal trial is $320 and takes about 3 hours. Which day works best?", sender: "user", createdAt: daysAgo(5) },
      { id: id(), conversationId: conv1, workspaceId: WS, content: "Thursday works perfectly! Can I come at 9am?", sender: "client", createdAt: daysAgo(4) },
      { id: id(), conversationId: conv1, workspaceId: WS, content: "Booked you in for Thursday at 9am! I'll send a confirmation email. See you then!", sender: "user", createdAt: daysAgo(4) },
      { id: id(), conversationId: conv1, workspaceId: WS, content: "Quick question — should I wash my hair before coming or leave it?", sender: "client", createdAt: daysAgo(0) },
      { id: id(), conversationId: conv1, workspaceId: WS, content: "Also, can my maid of honour come along to see the process? She's thinking of booking too!", sender: "client", createdAt: daysAgo(0) },
    ],
    [conv2]: [
      { id: id(), conversationId: conv2, workspaceId: WS, content: "Hi Sophie, I wanted to check if my appointment this Thursday is still at 3pm? Also wondering if you have that low-ammonia colour we talked about last time.", sender: "client", createdAt: daysAgo(3) },
      { id: id(), conversationId: conv2, workspaceId: WS, content: "Hi Emma! Yes, you're confirmed for Thursday at 3pm with Liam. And yes, I've stocked the Wella Koleston range — perfect for sensitive scalps. See you Thursday!", sender: "user", createdAt: daysAgo(2) },
      { id: id(), conversationId: conv2, workspaceId: WS, content: "Perfect, thank you! Looking forward to it.", sender: "client", createdAt: daysAgo(1) },
    ],
    [conv3]: [
      { id: id(), conversationId: conv3, workspaceId: WS, content: "Hi! Do you do keratin treatments? My hair is super frizzy and I've been looking for a good salon on the Gold Coast.", sender: "client", createdAt: daysAgo(1) },
      { id: id(), conversationId: conv3, workspaceId: WS, content: "Also how much is it and how long does it last?", sender: "client", createdAt: daysAgo(0) },
    ],
    [conv4]: [
      { id: id(), conversationId: conv4, workspaceId: WS, content: "Hi is this Glow Studio? I'd like to book gel nails for this Saturday if possible", sender: "client", createdAt: daysAgo(2) },
    ],
    [conv5]: [
      { id: id(), conversationId: conv5, workspaceId: WS, content: "Hey! Just wanted to say my lash lift looks amazing 3 days later. Definitely booking again next month!", sender: "client", createdAt: daysAgo(5) },
      { id: id(), conversationId: conv5, workspaceId: WS, content: "So glad you love them Rachel! They'll keep looking great for 6-8 weeks. I'll send you a reminder when it's time to rebook!", sender: "user", createdAt: daysAgo(4) },
      { id: id(), conversationId: conv5, workspaceId: WS, content: "Also can I add a brow lamination next time?", sender: "client", createdAt: daysAgo(3) },
    ],
  };

  useCommunicationStore.setState({ conversations, messages });

  // ═══════════════════════════════════════
  // 7. INQUIRIES (form IDs declared below in section 9, but pre-generated here)
  // ═══════════════════════════════════════
  const formBookingId = id();
  const formWeddingId = id();
  const formGeneralId = id();

  const inquiries = [
    { id: id(), workspaceId: WS, name: "Priya Sharma", email: "", phone: "0499 111 222", message: "Interested in keratin treatments. Wants to know pricing and how long it lasts.", serviceInterest: "Keratin Treatment", source: "comms" as const, status: "new" as const, conversationId: conv3, createdAt: daysAgo(1), updatedAt: now },
    { id: id(), workspaceId: WS, name: "Megan Foster", email: "megan.f@gmail.com", phone: "0499 333 444", message: "Planning a hens party for 8 girls on May 15th. Would love group bookings for nails and lash lifts. Is there a group discount?", serviceInterest: "Group Booking", eventType: "Hens Party", dateRange: "May 15, 2026", source: "form" as const, status: "new" as const, formId: formGeneralId, createdAt: daysAgo(2), updatedAt: daysAgo(2) },
    { id: id(), workspaceId: WS, name: "Lauren Hayes", email: "lauren.hayes@outlook.com", phone: "0488 222 111", message: "I'm a bride-to-be looking for hair + makeup for my wedding on 20 June. Need trials first. Do you do bridal packages?", serviceInterest: "Bridal Package", eventType: "Wedding", dateRange: "June 2026", source: "form" as const, status: "in_progress" as const, formId: formWeddingId, createdAt: daysAgo(8), updatedAt: daysAgo(3) },
    { id: id(), workspaceId: WS, name: "Sophie Laurent", email: "sophie.l@gmail.com", phone: "0411 999 888", message: "Getting married 14 August at Currumbin. Looking for hair styling for myself and 4 bridesmaids. Do you travel?", serviceInterest: "Bridal Hair", eventType: "Wedding", dateRange: "August 2026", source: "form" as const, status: "new" as const, formId: formWeddingId, createdAt: daysAgo(3), updatedAt: daysAgo(3) },
    { id: id(), workspaceId: WS, name: "Jade Robinson", email: "jade.r@icloud.com", phone: "0422 111 999", message: "Want hair + lash lift for my wedding on 5 July. Also need a trial run. Budget around $500 total.", serviceInterest: "Bridal Hair + Lashes", eventType: "Wedding", dateRange: "July 2026", source: "form" as const, status: "new" as const, formId: formWeddingId, createdAt: daysAgo(1), updatedAt: daysAgo(1) },
    { id: id(), workspaceId: WS, name: "Kate Marshall", email: "kate.m@gmail.com", phone: "0477 444 333", message: "Wanted a balayage quote. Converted to booking.", serviceInterest: "Balayage", source: "form" as const, status: "converted" as const, formId: formGeneralId, bookingId: bookingIds[8], clientId: clientOlivia, createdAt: daysAgo(14), updatedAt: daysAgo(7) },
    { id: id(), workspaceId: WS, name: "Amy Chen", email: "amy.chen@work.com", phone: "", message: "Do you do corporate wellness days? Our office has 20 people.", serviceInterest: "Corporate Event", source: "form" as const, status: "closed" as const, formId: formGeneralId, createdAt: daysAgo(20), updatedAt: daysAgo(15) },
  ];

  useInquiriesStore.setState({ inquiries });

  // ═══════════════════════════════════════
  // 8. PAYMENT DOCUMENTS
  // ═══════════════════════════════════════
  const payDocIds = Array.from({ length: 8 }, () => id());

  const documents = [
    // Paid invoices (past bookings)
    { id: payDocIds[0], workspaceId: WS, documentNumber: "INV-001", clientId: clientEmma, bookingId: bookingIds[0], label: "invoice" as const, status: "paid" as const, paymentMethod: "stripe" as const, total: 180, notes: "", sentAt: daysAgo(7), paidAt: daysAgo(7), dueDate: dateStr(-7), createdAt: daysAgo(14), updatedAt: daysAgo(7) },
    { id: payDocIds[1], workspaceId: WS, documentNumber: "INV-002", clientId: clientJess, bookingId: bookingIds[1], label: "invoice" as const, status: "paid" as const, paymentMethod: "card_in_person" as const, total: 320, notes: "", sentAt: daysAgo(5), paidAt: daysAgo(5), dueDate: dateStr(-5), createdAt: daysAgo(12), updatedAt: daysAgo(5) },
    { id: payDocIds[2], workspaceId: WS, documentNumber: "INV-003", clientId: clientSarah, bookingId: bookingIds[2], label: "invoice" as const, status: "paid" as const, paymentMethod: "cash" as const, total: 85, notes: "", sentAt: daysAgo(3), paidAt: daysAgo(3), dueDate: dateStr(-3), createdAt: daysAgo(10), updatedAt: daysAgo(3) },
    { id: payDocIds[3], workspaceId: WS, documentNumber: "INV-004", clientId: clientRachel, bookingId: bookingIds[3], label: "invoice" as const, status: "paid" as const, paymentMethod: "stripe" as const, total: 165, notes: "Lash lift + brow lamination combo", sentAt: daysAgo(2), paidAt: daysAgo(2), dueDate: dateStr(-2), createdAt: daysAgo(9), updatedAt: daysAgo(2) },

    // Sent / pending invoices (today & upcoming)
    { id: payDocIds[4], workspaceId: WS, documentNumber: "INV-005", clientId: clientAva, bookingId: bookingIds[5], label: "invoice" as const, status: "sent" as const, total: 130, notes: "", sentAt: daysAgo(1), dueDate: dateStr(0), createdAt: daysAgo(3), updatedAt: now },
    { id: payDocIds[5], workspaceId: WS, documentNumber: "INV-006", clientId: clientChloe, bookingId: bookingIds[6], label: "invoice" as const, status: "sent" as const, total: 120, notes: "", sentAt: daysAgo(1), dueDate: dateStr(0), createdAt: daysAgo(5), updatedAt: now },

    // Overdue invoice (no-show)
    { id: payDocIds[6], workspaceId: WS, documentNumber: "INV-007", clientId: clientNatalie, bookingId: bookingIds[4], label: "invoice" as const, status: "overdue" as const, total: 50, notes: "No-show fee", sentAt: daysAgo(1), dueDate: dateStr(-1), createdAt: daysAgo(1), updatedAt: now },

    // Quote for upcoming bridal work
    { id: payDocIds[7], workspaceId: WS, documentNumber: "QT-001", clientId: clientOlivia, label: "quote" as const, status: "sent" as const, total: 1450, notes: "Bridal package: 2 trials + wedding day hair + 3 bridesmaids", sentAt: daysAgo(5), dueDate: dateStr(14), createdAt: daysAgo(7), updatedAt: daysAgo(5) },
  ];

  const lineItems: Record<string, Array<{ id: string; paymentDocumentId: string; workspaceId: string; description: string; quantity: number; unitPrice: number; sortOrder: number }>> = {
    [payDocIds[0]]: [{ id: id(), paymentDocumentId: payDocIds[0], workspaceId: WS, description: "Full Colour", quantity: 1, unitPrice: 180, sortOrder: 0 }],
    [payDocIds[1]]: [{ id: id(), paymentDocumentId: payDocIds[1], workspaceId: WS, description: "Balayage", quantity: 1, unitPrice: 320, sortOrder: 0 }],
    [payDocIds[2]]: [{ id: id(), paymentDocumentId: payDocIds[2], workspaceId: WS, description: "Cut & Blow Dry", quantity: 1, unitPrice: 85, sortOrder: 0 }],
    [payDocIds[3]]: [
      { id: id(), paymentDocumentId: payDocIds[3], workspaceId: WS, description: "Lash Lift & Tint", quantity: 1, unitPrice: 90, sortOrder: 0 },
      { id: id(), paymentDocumentId: payDocIds[3], workspaceId: WS, description: "Brow Lamination", quantity: 1, unitPrice: 75, sortOrder: 1 },
    ],
    [payDocIds[4]]: [{ id: id(), paymentDocumentId: payDocIds[4], workspaceId: WS, description: "Signature Facial", quantity: 1, unitPrice: 130, sortOrder: 0 }],
    [payDocIds[5]]: [{ id: id(), paymentDocumentId: payDocIds[5], workspaceId: WS, description: "Gel Nails – Full Set", quantity: 1, unitPrice: 120, sortOrder: 0 }],
    [payDocIds[6]]: [{ id: id(), paymentDocumentId: payDocIds[6], workspaceId: WS, description: "No-show fee", quantity: 1, unitPrice: 50, sortOrder: 0 }],
    [payDocIds[7]]: [
      { id: id(), paymentDocumentId: payDocIds[7], workspaceId: WS, description: "Bridal Hair Trial", quantity: 2, unitPrice: 320, sortOrder: 0 },
      { id: id(), paymentDocumentId: payDocIds[7], workspaceId: WS, description: "Wedding Day Hair (Bride)", quantity: 1, unitPrice: 450, sortOrder: 1 },
      { id: id(), paymentDocumentId: payDocIds[7], workspaceId: WS, description: "Bridesmaid Hair", quantity: 3, unitPrice: 120, sortOrder: 2 },
    ],
  };

  usePaymentsStore.setState({ documents, lineItems });

  // ═══════════════════════════════════════
  // 9. FORMS (IDs declared in section 7 above)
  // ═══════════════════════════════════════
  const forms = [
    {
      id: formBookingId, workspaceId: WS, type: "booking" as const, name: "Online Booking",
      fields: [
        { name: "name", type: "text" as const, label: "Full Name", required: true },
        { name: "email", type: "email" as const, label: "Email", required: true },
        { name: "phone", type: "phone" as const, label: "Phone", required: true },
        { name: "notes", type: "textarea" as const, label: "Any notes for your stylist?", required: false },
      ],
      branding: { primaryColor: "#8B5CF6" },
      slug: "book",
      enabled: true,
      createdAt: daysAgo(60),
      updatedAt: daysAgo(10),
    },
    {
      id: formWeddingId, workspaceId: WS, type: "inquiry" as const, name: "Wedding Inquiry",
      fields: [
        { name: "name", type: "text" as const, label: "Full Name", required: true },
        { name: "email", type: "email" as const, label: "Email", required: true },
        { name: "phone", type: "phone" as const, label: "Phone", required: true },
        { name: "event_type", type: "text" as const, label: "Event Type", required: true },
        { name: "date_range", type: "text" as const, label: "Wedding Date / Date Range", required: true },
        { name: "message", type: "textarea" as const, label: "Tell us about your vision", required: false },
      ],
      branding: { primaryColor: "#EC4899" },
      slug: "wedding",
      enabled: true,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(5),
    },
    {
      id: formGeneralId, workspaceId: WS, type: "inquiry" as const, name: "General Inquiry",
      fields: [
        { name: "name", type: "text" as const, label: "Full Name", required: true },
        { name: "email", type: "email" as const, label: "Email", required: true },
        { name: "phone", type: "phone" as const, label: "Phone", required: false },
        { name: "service_interest", type: "select" as const, label: "Service you're interested in", required: false, options: ["Hair", "Nails", "Lashes & Brows", "Skin", "Other"] },
        { name: "message", type: "textarea" as const, label: "Your message", required: true },
      ],
      branding: { primaryColor: "#8B5CF6" },
      slug: "contact",
      enabled: true,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(5),
    },
  ];

  useFormsStore.setState({ forms });

  // ═══════════════════════════════════════
  // 10. AUTOMATION RULES
  // ═══════════════════════════════════════
  const automationRules = [
    { id: id(), workspaceId: WS, type: "booking_confirmation" as const, enabled: true, channel: "email" as const, messageTemplate: "Hi {client_name}, your {service_name} appointment on {date} at {time} is confirmed!", timingValue: undefined, timingUnit: undefined, createdAt: daysAgo(60), updatedAt: daysAgo(10) },
    { id: id(), workspaceId: WS, type: "appointment_reminder" as const, enabled: true, channel: "both" as const, messageTemplate: "Reminder: You have a {service_name} appointment tomorrow at {time} at Glow Studio.", timingValue: 24, timingUnit: "hours" as const, createdAt: daysAgo(60), updatedAt: daysAgo(10) },
    { id: id(), workspaceId: WS, type: "post_service_followup" as const, enabled: true, channel: "email" as const, messageTemplate: "Thanks for visiting us today, {client_name}! How are you loving your {service_name}?", timingValue: 2, timingUnit: "hours" as const, createdAt: daysAgo(60), updatedAt: daysAgo(10) },
    { id: id(), workspaceId: WS, type: "review_request" as const, enabled: true, channel: "email" as const, messageTemplate: "Hi {client_name}, we'd love your feedback! Leave us a Google review: {review_url}", timingValue: 24, timingUnit: "hours" as const, createdAt: daysAgo(60), updatedAt: daysAgo(10) },
    { id: id(), workspaceId: WS, type: "no_show_followup" as const, enabled: true, channel: "sms" as const, messageTemplate: "We missed you today, {client_name}. Would you like to reschedule? Reply or call us on 0412 345 678.", timingValue: undefined, timingUnit: undefined, createdAt: daysAgo(60), updatedAt: daysAgo(10) },
    { id: id(), workspaceId: WS, type: "invoice_auto_send" as const, enabled: true, channel: "email" as const, messageTemplate: "", timingValue: undefined, timingUnit: undefined, createdAt: daysAgo(60), updatedAt: daysAgo(10) },
    { id: id(), workspaceId: WS, type: "cancellation_confirmation" as const, enabled: false, channel: "email" as const, messageTemplate: "Your appointment on {date} has been cancelled. We hope to see you again soon!", timingValue: undefined, timingUnit: undefined, createdAt: daysAgo(60), updatedAt: daysAgo(10) },
  ];

  useAutomationsStore.setState({ rules: automationRules });

  // ═══════════════════════════════════════
  // 11. CAMPAIGNS
  // ═══════════════════════════════════════
  const campaigns = [
    { id: id(), workspaceId: WS, name: "Winter Hydration Special", subject: "Your hair deserves some extra love this winter", body: "Hi {client_name},\n\nWinter is tough on hair — treat yourself to our Keratin Treatment at 15% off this month only.\n\nBook now: {booking_url}\n\nXO, Glow Studio", channel: "email" as const, targetSegment: "returning" as const, status: "sent" as const, scheduledAt: daysAgo(14), sentCount: 45, openCount: 28, clickCount: 12, createdAt: daysAgo(16), updatedAt: daysAgo(14) },
    { id: id(), workspaceId: WS, name: "We miss you!", subject: "It's been a while — we'd love to see you", body: "Hi {client_name},\n\nIt's been a while since your last visit. Come back and enjoy $20 off your next service.\n\nUse code WELCOME20 at checkout.\n\nGlow Studio", channel: "both" as const, targetSegment: "inactive" as const, inactiveDays: 60, status: "sent" as const, scheduledAt: daysAgo(7), sentCount: 18, openCount: 9, clickCount: 3, createdAt: daysAgo(10), updatedAt: daysAgo(7) },
    { id: id(), workspaceId: WS, name: "Mother's Day Gift Cards", subject: "The perfect gift for mum", body: "Treat mum to a Glow Studio gift card — available in $50, $100, and $150 values.\n\nOrder online: {storefront_url}", channel: "email" as const, targetSegment: "all" as const, status: "draft" as const, sentCount: 0, openCount: 0, clickCount: 0, createdAt: daysAgo(2), updatedAt: now },
  ];

  useMarketingStore.setState({ campaigns });
}
