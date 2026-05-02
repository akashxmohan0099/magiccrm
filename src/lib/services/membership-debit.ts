/**
 * Membership debit planning for a basket of bookings.
 *
 * Pure helper: given the client's active memberships and the list of items in
 * the basket, decide which item (if any) draws a session from which membership
 * — respecting per-period caps and never debiting guest items.
 *
 * The route layer feeds the result into:
 *   - the `membership_id` column on each booking insert
 *   - one update per affected membership (`sessions_used += debits.get(id)`)
 */

export interface ActiveMembership {
  id: string;
  sessionsUsed: number;
  /** 0 = unlimited per period. */
  sessionsPerPeriod: number;
  serviceIds: Set<string>;
}

export interface MembershipDebitItem {
  serviceId: string;
  /** Guest items skip debit — they share the lead client_id but represent a
   *  different attendee, and we don't track a separate client row to tie a
   *  membership to. */
  isGuest: boolean;
}

export interface MembershipDebitPlan {
  /** index in items[] → membership.id (or null if not covered). */
  perItem: Array<string | null>;
  /** membership.id → count of new sessions to debit on that membership. */
  debits: Map<string, number>;
}

export function planMembershipDebits(
  memberships: ActiveMembership[],
  items: MembershipDebitItem[],
): MembershipDebitPlan {
  const perItem: Array<string | null> = new Array(items.length).fill(null);
  const debits = new Map<string, number>();

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (item.isGuest) continue;

    const usable = memberships.find((m) => {
      if (!m.serviceIds.has(item.serviceId)) return false;
      if (m.sessionsPerPeriod === 0) return true;
      const pending = debits.get(m.id) ?? 0;
      return m.sessionsUsed + pending < m.sessionsPerPeriod;
    });

    if (!usable) continue;
    perItem[i] = usable.id;
    debits.set(usable.id, (debits.get(usable.id) ?? 0) + 1);
  }

  return { perItem, debits };
}
