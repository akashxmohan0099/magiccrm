// ═══════════════════════════════════════════════════
// MAGIC CRM — Core Type Definitions (barrel export)
//
// Types are split by domain into sibling files. Import from this barrel
// (`@/types/models`) to keep existing imports working, OR import directly
// from a domain file (`@/types/forms`, `@/types/services`, etc.) when you
// only need a few types — that's the new preferred pattern for new code.
//
// Domain files:
//   - client.ts        Client, TreatmentNote, ClientPatchTest, ClientTag, ClientPhoto
//   - service.ts       Service + all pricing, variants, addons, resources, locations
//   - booking.ts       Booking, BookingStatus, RecurrencePattern, WaitlistEntry
//   - inquiry.ts       Inquiry, InquirySource, InquiryStatus
//   - form.ts          Form, FormField, FormBranding, FormResponse
//   - communication.ts Conversation, Message, Channel
//   - payment.ts       PaymentDocument, PaymentLineItem, Refund
//   - automation.ts    AutomationRule, AutomationType
//   - marketing.ts     Campaign + segments
//   - team.ts          TeamMember, WorkingHours, LeavePeriod
//   - workspace.ts     Workspace, WorkspaceSettings, all Onboarding types
//   - calendar.ts      CalendarBlock, BlockKind
//   - suggestion.ts    Calendar Suggestion + generators
//   - addons.ts        GiftCard, Loyalty, Proposal, Membership, Document
//   - activity.ts      ActivityEntry, InternalNote, Questionnaire
// ═══════════════════════════════════════════════════

export * from './client';
export * from './service';
export * from './booking';
export * from './inquiry';
export * from './form';
export * from './communication';
export * from './payment';
export * from './automation';
export * from './marketing';
export * from './team';
export * from './workspace';
export * from './calendar';
export * from './suggestion';
export * from './addons';
export * from './activity';
