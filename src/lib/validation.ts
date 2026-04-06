/**
 * Shared validation utilities for store operations.
 * Every store should validate input before writing to localStorage or Supabase.
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function ok(): ValidationResult {
  return { valid: true, errors: [] };
}

function fail(...errors: string[]): ValidationResult {
  return { valid: false, errors };
}

function merge(...results: ValidationResult[]): ValidationResult {
  const errors = results.flatMap((r) => r.errors);
  return { valid: errors.length === 0, errors };
}

// ── Primitives ──────────────────────────────────────────────

const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateEmail(email: string | undefined | null, fieldName = "Email"): ValidationResult {
  if (!email || !email.trim()) return ok(); // email is optional in many contexts
  return EMAIL_RE.test(email.trim()) ? ok() : fail(`${fieldName} is not a valid email address`);
}

export function validateEmailRequired(email: string | undefined | null, fieldName = "Email"): ValidationResult {
  if (!email || !email.trim()) return fail(`${fieldName} is required`);
  return EMAIL_RE.test(email.trim()) ? ok() : fail(`${fieldName} is not a valid email address`);
}

export function validateRequired(value: string | undefined | null, fieldName: string): ValidationResult {
  if (!value || !value.trim()) return fail(`${fieldName} is required`);
  return ok();
}

export function validatePositiveNumber(value: number | undefined | null, fieldName: string, allowZero = false): ValidationResult {
  if (value === undefined || value === null || isNaN(value)) return fail(`${fieldName} is required`);
  if (allowZero ? value < 0 : value <= 0) return fail(`${fieldName} must be ${allowZero ? "zero or more" : "greater than zero"}`);
  return ok();
}

export function validateNumberRange(value: number | undefined | null, fieldName: string, min: number, max: number): ValidationResult {
  if (value === undefined || value === null || isNaN(value)) return fail(`${fieldName} is required`);
  if (value < min || value > max) return fail(`${fieldName} must be between ${min} and ${max}`);
  return ok();
}

export function validateTimeOrder(startTime: string, endTime: string, fieldName = "Time"): ValidationResult {
  if (!startTime || !endTime) return ok();
  if (startTime >= endTime) return fail(`${fieldName}: end time must be after start time`);
  return ok();
}

export function validateMaxLength(value: string | undefined | null, maxLength: number, fieldName: string): ValidationResult {
  if (!value) return ok();
  if (value.length > maxLength) return fail(`${fieldName} must be ${maxLength} characters or fewer`);
  return ok();
}

// ── Domain Validators ───────────────────────────────────────

export function validateClient(data: { name?: string; email?: string; phone?: string }): ValidationResult {
  return merge(
    validateRequired(data.name, "Client name"),
    validateEmail(data.email, "Client email"),
    validateMaxLength(data.name, 200, "Client name"),
    validateMaxLength(data.email, 254, "Client email"),
    validateMaxLength(data.phone, 30, "Phone number"),
  );
}

export function validateLead(data: { name?: string; email?: string; source?: string }): ValidationResult {
  return merge(
    validateRequired(data.name, "Lead name"),
    validateEmail(data.email, "Lead email"),
    validateMaxLength(data.name, 200, "Lead name"),
  );
}

export function validateBooking(data: {
  title?: string;
  clientId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
}): ValidationResult {
  return merge(
    validateRequired(data.title, "Booking title"),
    validateRequired(data.date, "Booking date"),
    validateRequired(data.startTime, "Start time"),
    validateRequired(data.endTime, "End time"),
    validateTimeOrder(data.startTime ?? "", data.endTime ?? "", "Booking"),
  );
}

export function validateInvoice(data: {
  clientId?: string;
  lineItems?: Array<{ description?: string; unitPrice?: number; quantity?: number }>;
  taxRate?: number;
  depositPercent?: number;
}): ValidationResult {
  const results: ValidationResult[] = [
    validateRequired(data.clientId, "Client"),
  ];

  if (data.taxRate !== undefined && data.taxRate !== null) {
    results.push(validateNumberRange(data.taxRate, "Tax rate", 0, 100));
  }

  if (data.depositPercent !== undefined && data.depositPercent !== null) {
    results.push(validateNumberRange(data.depositPercent, "Deposit percentage", 0, 100));
  }

  if (data.lineItems && data.lineItems.length > 0) {
    data.lineItems.forEach((item, i) => {
      results.push(validateRequired(item.description, `Line item ${i + 1} description`));
      if (item.unitPrice !== undefined) {
        results.push(validatePositiveNumber(item.unitPrice, `Line item ${i + 1} price`, true));
      }
      if (item.quantity !== undefined) {
        results.push(validatePositiveNumber(item.quantity, `Line item ${i + 1} quantity`));
      }
    });
  }

  return merge(...results);
}

export function validateService(data: {
  name?: string;
  price?: number;
  duration?: number;
}): ValidationResult {
  return merge(
    validateRequired(data.name, "Service name"),
    validatePositiveNumber(data.price, "Price", true),
    data.duration !== undefined ? validatePositiveNumber(data.duration, "Duration") : ok(),
  );
}

export function validateProduct(data: {
  name?: string;
  price?: number;
}): ValidationResult {
  return merge(
    validateRequired(data.name, "Product name"),
    validatePositiveNumber(data.price, "Price", true),
  );
}

export function validateDocument(data: {
  name?: string;
}): ValidationResult {
  return merge(
    validateRequired(data.name, "Document name"),
    validateMaxLength(data.name, 500, "Document name"),
  );
}

export function validateConversation(data: { clientName?: string; channel?: string }): ValidationResult {
  return merge(
    validateRequired(data.clientName, "Client name"),
    validateRequired(data.channel, "Channel"),
    validateMaxLength(data.clientName, 200, "Client name"),
  );
}

export function validateCampaign(data: { name?: string; content?: string }): ValidationResult {
  return merge(
    validateRequired(data.name, "Campaign name"),
    validateMaxLength(data.name, 200, "Campaign name"),
    validateMaxLength(data.content, 10000, "Campaign content"),
  );
}

export function validateCoupon(data: { code?: string; discountValue?: number }): ValidationResult {
  return merge(
    validateRequired(data.code, "Coupon code"),
    validateMaxLength(data.code, 50, "Coupon code"),
    data.discountValue !== undefined ? validatePositiveNumber(data.discountValue, "Discount value") : ok(),
  );
}

export function validateTeamMember(data: { name?: string; email?: string }): ValidationResult {
  return merge(
    validateRequired(data.name, "Member name"),
    validateEmailRequired(data.email, "Member email"),
    validateMaxLength(data.name, 200, "Member name"),
  );
}

export function validateSupportTicket(data: { subject?: string; clientName?: string }): ValidationResult {
  return merge(
    validateRequired(data.subject, "Subject"),
    validateRequired(data.clientName, "Client name"),
    validateMaxLength(data.subject, 500, "Subject"),
    validateMaxLength(data.clientName, 200, "Client name"),
  );
}

export function validateAutomationRule(data: { name?: string; trigger?: string; action?: string }): ValidationResult {
  return merge(
    validateRequired(data.name, "Rule name"),
    validateRequired(data.trigger, "Trigger"),
    validateRequired(data.action, "Action"),
    validateMaxLength(data.name, 200, "Rule name"),
  );
}

export function validateSOAPNote(data: { clientName?: string; date?: string }): ValidationResult {
  return merge(
    validateRequired(data.clientName, "Client name"),
    validateRequired(data.date, "Date"),
  );
}

export function validateIntakeForm(data: { name?: string }): ValidationResult {
  return merge(
    validateRequired(data.name, "Form name"),
    validateMaxLength(data.name, 200, "Form name"),
  );
}

export function validateMembershipPlan(data: { name?: string; price?: number }): ValidationResult {
  return merge(
    validateRequired(data.name, "Plan name"),
    validatePositiveNumber(data.price, "Price", true),
    validateMaxLength(data.name, 200, "Plan name"),
  );
}

export function validateMembership(data: { clientName?: string; planName?: string }): ValidationResult {
  return merge(
    validateRequired(data.clientName, "Client name"),
    validateRequired(data.planName, "Plan name"),
  );
}

export function validateBeforeAfter(data: { clientName?: string; title?: string }): ValidationResult {
  return merge(
    validateRequired(data.clientName, "Client name"),
    validateRequired(data.title, "Title"),
    validateMaxLength(data.title, 300, "Title"),
  );
}

export function validateGiftCard(data: { code?: string; amount?: number }): ValidationResult {
  return merge(
    validateRequired(data.code, "Gift card code"),
    validatePositiveNumber(data.amount, "Amount"),
    validateMaxLength(data.code, 50, "Gift card code"),
  );
}

export function validateClassDefinition(data: { name?: string; capacity?: number; startTime?: string; endTime?: string }): ValidationResult {
  return merge(
    validateRequired(data.name, "Class name"),
    data.capacity !== undefined ? validatePositiveNumber(data.capacity, "Capacity") : ok(),
    validateTimeOrder(data.startTime ?? "", data.endTime ?? "", "Class"),
    validateMaxLength(data.name, 200, "Class name"),
  );
}

export function validateVendor(data: { name?: string; email?: string }): ValidationResult {
  return merge(
    validateRequired(data.name, "Vendor name"),
    validateEmail(data.email, "Vendor email"),
    validateMaxLength(data.name, 200, "Vendor name"),
  );
}

export function validateWinBackRule(data: { name?: string; inactiveDays?: number; messageTemplate?: string }): ValidationResult {
  return merge(
    validateRequired(data.name, "Rule name"),
    data.inactiveDays !== undefined ? validatePositiveNumber(data.inactiveDays, "Inactive days") : ok(),
    validateRequired(data.messageTemplate, "Message template"),
    validateMaxLength(data.name, 200, "Rule name"),
  );
}

export function validateWaitlistEntry(data: { clientName?: string; date?: string }): ValidationResult {
  return merge(
    validateRequired(data.clientName, "Client name"),
    validateRequired(data.date, "Date"),
    validateMaxLength(data.clientName, 200, "Client name"),
  );
}

export function validateLoyaltyTransaction(data: { clientName?: string; points?: number; description?: string }): ValidationResult {
  return merge(
    validateRequired(data.clientName, "Client name"),
    data.points !== undefined ? validatePositiveNumber(data.points, "Points") : ok(),
    validateRequired(data.description, "Description"),
  );
}

export function validateNote(data: { title?: string }): ValidationResult {
  return merge(
    validateRequired(data.title, "Note title"),
    validateMaxLength(data.title, 500, "Note title"),
  );
}

export function validatePortalAccess(data: { clientName?: string; email?: string }): ValidationResult {
  return merge(
    validateRequired(data.clientName, "Client name"),
    validateEmailRequired(data.email, "Email"),
    validateMaxLength(data.clientName, 200, "Client name"),
  );
}

// ── Utilities ───────────────────────────────────────────────

/**
 * Sanitize a string for safe storage/display.
 * Trims whitespace, removes null bytes, limits length.
 */
export function sanitize(value: string | undefined | null, maxLength = 1000): string {
  if (!value) return "";
  return value.trim().replace(/\0/g, "").slice(0, maxLength);
}

/**
 * Sanitize an email for consistent storage.
 */
export function sanitizeEmail(email: string | undefined | null): string {
  if (!email) return "";
  return email.trim().toLowerCase().replace(/\0/g, "");
}
