# Basket availability endpoint — plan

## Problem

Public booking page estimates slots from `(one service, total cart duration)`.
Server validates every basket item at submit. Customer can pick a slot the
server later rejects. Real production-correctness gap.

## Solution shape

`POST /api/public/availability/basket` — server runs the same engine the
submit handler uses, but in slot-generation mode. Returns only times where
EVERY basket item fits end-to-end with valid member + resource + location.

## Design

### Engine layer (`src/lib/services/availability.ts`)

Add `computeBasketAvailability(input)`:

- Walks candidate slot starts on the workspace grid (15-min step).
- For each candidate, sequentially places basket items:
  - Item 1 starts at candidate
  - Find a member who can perform item 1 + is free for `[start - bufferBefore, start + duration + bufferAfter]`
  - If item has a preferred member, only that member counts
  - Check resource availability for that interval
  - If item placed, advance cursor by `duration + bufferAfter` and try item 2 at that time
  - Continue until all items placed OR fail
- Slot bookable iff every item placed.
- Return `{ time, startAt, endAt, assignments: [{serviceId, memberId, startAt, endAt}] }`

Keeps the existing `computeAvailability` for single-service callers (legacy +
single-item cart). New function reuses helpers (member eligibility, busy intervals).

### Server layer (`src/lib/server/public-booking.ts`)

Add `getAvailableBasketSlots({ workspaceId, date, items, locationId, defaultAvailability })`:

- Single round-trip loads:
  - All services in basket (by id, in workspace)
  - Active members + member_services
  - Bookings for the day
  - Calendar blocks for the day
  - Resources only if any basket service requires them
- Builds the engine input (busy intervals inflated by per-service buffers)
- Calls `computeBasketAvailability`
- Returns the slot list

### Route (`src/app/api/public/availability/basket/route.ts`)

```
POST /api/public/availability/basket
Body: { slug, date: "YYYY-MM-DD", items: [{ serviceId, variantId?, addonIds?, preferredMemberId? }], locationId? }
Returns: { slots: [{ time, startAt, endAt, assignments }] }
```

- Resolves workspace from slug (existing `resolveBookingWorkspaceBySlug`)
- Rate-limited like other public endpoints
- Validates input (basket non-empty, all serviceIds belong to workspace, date format)
- Returns 200 + `{ slots: [] }` when no basket combination fits — UI renders "no times available"
- Returns 4xx for malformed input

### Client wiring (`src/app/book/[slug]/page.tsx` + `CartPane.tsx`)

When basket has 2+ items: call `POST /availability/basket` instead of the
existing single-service GET. When 1 item: keep the existing path.

### Tests

- Unit tests on `computeBasketAvailability`:
  - Single-item basket matches `computeAvailability` output for the same service
  - Two services in sequence — slot picked must allow both end-to-end
  - Two services where artist A can do item 1 but not item 2 → slot rejected
  - Resource conflict in middle of basket → slot rejected
  - Buffer between items respected (item 2 starts at `item1.end + item1.bufferAfter`)
- Add a fixture-style test for the endpoint (with mocked supabase client)

## Out of scope (deliberate)

- Group bookings (basket × N guests in parallel) — separate problem, separate
  PR. The reviewer flagged this as a different concern.
- Membership / gift card pricing recalc — same engine, but pricing is a separate
  endpoint (`/book/info` already covers it).

## Phases

1. Engine: add `computeBasketAvailability` + tests
2. Server: add `getAvailableBasketSlots` + small integration test
3. Route: new `POST /availability/basket` + smoke test
4. Client: switch CartPane to call the basket endpoint when 2+ items
5. Browser verify: open public booking page, add 2 services, confirm slots match expectations
