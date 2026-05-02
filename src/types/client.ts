// ── Client ──────────────────────────────────────────

export interface Client {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  // Platform features
  birthday?: string;
  medicalAlerts?: string;
  source?: string;
  addressStreet?: string;
  addressSuburb?: string;
  addressPostcode?: string;
  addressState?: string;
  stripePaymentMethodId?: string;
  /**
   * Patch test history. Each entry stamps the test date plus the
   * service category it covers (e.g. "color", "lash_glue", "brow_tint").
   * The booking flow gates services that require a non-expired test.
   */
  patchTests?: ClientPatchTest[];
  /**
   * Operator-set flag: when true, this client is always charged a deposit
   * on services configured with `depositAppliesTo === 'flagged'` (typically
   * because of past no-shows or chargebacks).
   */
  depositRequired?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * SOAP-style treatment note. One row per service performed; locked once saved
 * (regulatory expectation in many jurisdictions for medspa / esthetic work).
 * Edits create amendments rather than overwriting.
 */
export interface TreatmentNote {
  id: string;
  workspaceId: string;
  clientId: string;
  bookingId?: string;
  serviceId?: string;
  authorMemberId?: string;
  /** Subjective — what the client reports. */
  subjective?: string;
  /** Objective — what the artist observes. */
  objective?: string;
  /** Assessment — diagnosis, classification. */
  assessment?: string;
  /** Plan — what was done, recommendations, next steps. */
  plan?: string;
  /** Free-form additional notes outside the SOAP frame. */
  notes?: string;
  /** Image attachments — Supabase storage URLs. */
  attachmentUrls?: string[];
  /** Once true, the note is read-only; further edits become amendments. */
  locked: boolean;
  /** Append-only chain of amendments (each is a partial Note diff). */
  amendments?: TreatmentNoteAmendment[];
  createdAt: string;
  updatedAt: string;
}

export interface TreatmentNoteAmendment {
  id: string;
  authorMemberId?: string;
  reason: string;
  delta: Partial<Pick<TreatmentNote, "subjective" | "objective" | "assessment" | "plan" | "notes">>;
  createdAt: string;
}

export interface ClientPatchTest {
  id: string;
  /** Free-form category — color, lash_glue, brow_tint, peel, …  */
  category: string;
  /** ISO date the test was performed. */
  testedAt: string;
  /** Free-text result/notes (e.g. "no reaction"). */
  result?: string;
  /** Optional reference to a Booking the test was done at. */
  bookingId?: string;
}

export interface ClientTag {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
}

export interface ClientPhoto {
  id: string;
  workspaceId: string;
  clientId: string;
  serviceId?: string;
  bookingId?: string;
  photoUrl: string;
  type: 'before' | 'after';
  createdAt: string;
}
