# MAGIC — Brief for Sam

A primer on what we're building, where it stands, and what to research.

---

## The product in one paragraph

MAGIC is a **conversation-first CRM for beauty & wellness operators** — solo MUAs, hair stylists, lash/nail/brow techs, estheticians, massage therapists, and small salon owners. Three entry points (a booking form, an inquiry form, a unified inbox of conversations across SMS/Instagram/WhatsApp/email) funnel into 5 core objects: **Client, Booking, Inquiry, Conversation, Payment Document**. The bet: most beauty operators today juggle Instagram DMs, a paper diary, a Square card reader, and a Google Sheet — none of those tools talk to each other. MAGIC collapses that stack into one workspace whose features are turned on based on how the operator answers a short onboarding questionnaire (persona-first).

Positioning: **not** Square/Fresha (booking-first, salon-shaped) and **not** HubSpot (B2B-shaped). Closer in feel to Glossgenius, with a sharper opinion on conversation as the system of record.

Target geography: Australia first (we're AU-based, AUD/AU phone formats throughout), then NZ/UK/US.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 + TypeScript 5 strict, Tailwind 4, Framer Motion |
| State | Zustand 5 with persist middleware (12 stores, all keyed `magic-crm:*` / `magic-crm-*`) |
| Backend | Supabase (Postgres + auth + realtime + storage) |
| Permissions | Postgres RLS using `get_my_workspace_id()`, `get_my_member_id()`, `is_workspace_owner()` |
| Payments | Stripe Connect (`on_behalf_of`, Express accounts) — wired but not yet earning |
| Messaging | Twilio for SMS — wired |
| Planned | Nylas (email + calendar sync), Meta Graph (IG + FB DMs), WhatsApp Cloud API — none integrated yet |
| AI | Claude API (in-app assistant), Kimi/Moonshot (onboarding copy tuning) |

Everything optimistic-updates locally via Zustand, then writes async to Supabase. Page loads hydrate stores from Supabase via `useSupabaseSync`; live changes flow through `useRealtimeSync`.

---

## Architecture at a glance

Direct component rendering. **No** schema-system, no persona-variant rendering layer, no dynamic module assembly. Each tab is its own React component. The persona answers from onboarding flip feature flags + add-on visibility — that's it.

```
src/
  app/                         Next.js routes + API
  components/modules/<tab>/    One folder per dashboard tab
  components/ui/               Shared primitives (DataTable, SlideOver, Toast, etc.)
  store/                       12 Zustand stores
  lib/db/                      Supabase CRUD (one file per entity)
  lib/integrations/            Stripe, Twilio
  lib/server/                  Server-only logic (automation runner, public booking, public inquiries)
  hooks/                       Custom React hooks
  types/models.ts              All TypeScript model definitions
supabase/migration.sql         Single source of truth for the schema
```

### The 12 dashboard tabs

**Daily workflow** (the core loop)
1. **Communications** — unified inbox across channels (today: SMS via Twilio + manual log; planned: IG, WhatsApp, email)
2. **Inquiries** — leads from forms + conversations, status pipeline (new → in_progress → converted → closed), per-form column sets
3. **Bookings** — appointments grid + calendar
4. **Calendar** — month view today; week/day + drag-to-reschedule + conflict detection still to build
5. **Clients** — created automatically when a booking is made (never manually)

**Operations**
6. **Payments** — quotes + invoices; Stripe-hosted checkout when Connect is set up
7. **Marketing** — campaign builder (early)

**Setup**
8. **Services** — service catalogue with deposit config
9. **Forms** — booking + inquiry form builder, slug-routed public pages, embed snippet
10. **Automations** — trigger/condition/action rules (reminder SMS, post-visit follow-ups)
11. **Teams** — invite team members, set permissions, assign services
12. **Settings** — workspace config, working hours, branding

### Add-ons (legacy / off by default)

Memberships, Loyalty, Marketing campaigns, Proposals, Jobs, Invoicing, Leads. These exist in `src/components/modules/` but aren't part of the core funnel. Some have stale imports. Don't fix them unless asked — they'll get attention in Phase 6.

### Permissions model

- **Owner** — full CRUD, sees all tabs.
- **Team Member** — sees Bookings (own only), Calendar (own only), Clients they've served, an earnings widget.
- Enforced at the database via Supabase RLS — not just the UI. Bypassing the frontend won't let a team member read another's bookings.

---

## Roadmap (what's done, what's next)

We're driving features end-to-end one at a time, not refining everything in parallel — we burned weeks on that pattern earlier.

| Phase | Scope | State | Notes |
|---|---|---|---|
| 0 | Landing page | **Shipped** | Production-shippable; multi-day polish pass complete |
| 1 | Forms + Inquiries | **Shipped** (today) | Full builder, embed, honeypot, CSV export, per-form columns, structured submission storage |
| 2 | Bookings + Calendar + Services | **Next** | Calendar is the lift — needs week/day views, drag-reschedule, conflict detection, deposit collection on public flow |
| 3 | Communications (unified inbox) | Pending | Auto-link inquiries↔conversations, channel polish, two-way reply UX |
| 4 | Clients + Payments + Stripe Connect | Pending | Real deposit capture, Connect onboarding flow |
| 5 | Setup tabs (Automations, Teams, Settings) | Pending | Polish for power users; can ride alongside other phases |
| 6 | Add-ons (Marketing, Memberships, etc.) | Pending | Each is its own mini-feature |

### What "Forms + Inquiries shipped" means concretely

- **Builder**: drag-reorder fields, 6 field types, brand color, per-field placeholder + help text, custom description, custom thank-you message, slug uniqueness validation, enable/disable toggle.
- **Public page** at `/inquiry/<slug>` and **embed** at `/embed/inquiry/<slug>` — branded gradient, mobile-clean, auto-resize iframe via `postMessage`.
- **Anti-spam**: honeypot `__hp` field; server returns 201 silently on filled traps without writing.
- **Inbox**: per-form column sets derived from the form's fields config (Wedding Inquiry → 6 columns, General Inquiry → 5, etc.). Column visibility togglable + persisted per section. Section headers have **Edit form** (deep-link to editor) and **Open public** actions.
- **Detail panel**: walks the form's fields in order, renders every value the client submitted with the form's labels.
- **Storage**: full submission persisted as `submission_values JSONB` plus the structured columns (`name`, `email`, `phone`, `service_interest`, `event_type`, `date_range`, `message`) for back-compat queries.
- **CSV export** per form, on the form's Responses tab.

---

## Key flows for Sam to internalize

### Inquiry → booking → client → payment

1. Visitor submits a form at `/inquiry/<slug>`. Public route writes an `inquiry` row, status=`new`, with the full submission blob.
2. Operator sees it in the **Inquiries** inbox grouped by form.
3. Operator clicks **Create Booking** in the inquiry detail panel. The booking form opens, prefilled. On save, a **client** row is created automatically (clients are never created manually) and the inquiry status flips to `converted`.
4. Optionally the operator sends a **quote** or **invoice** from the inquiry detail. If Stripe Connect is set up, it generates a hosted checkout URL.

### Public booking (separate from inquiry)

`/book/<bookingPageSlug>` — server-fetched availability, real Supabase writes, member assignment, best-effort SMS+email confirmation. **Deposit collection is in the schema (`services.depositType`, `depositAmount`) but not yet wired into the public flow.** That's a Phase 2 task.

### Onboarding (persona-first)

The signup flow at `/onboarding`:
1. Pick a persona (8 options: MUA, hair, barber, lash, nail, esthetician, massage, salon owner).
2. Two structural questions (team size, business model).
3. Four multi-select pages (solutions, marketing, billing, engagement) — drives feature-flag enablement.
4. Summary showing the workspace that's about to be built.
5. Account creation (sign-up is intentionally last for now; will move earlier once UI is settled).

Persona + answers persist in `workspace_settings.persona` and `workspace_settings.onboarding_answers`. Add-on resolution lives in `src/lib/onboarding-v2.ts → resolveEnabledAddons(draft)`.

---

## What I'd love Sam to research

In rough priority:

1. **Calendar UX patterns** — best week/day views in modern booking products. Looking for inspiration on time-block density, drag-to-reschedule affordances, conflict-detection visuals, "now" indicators. References: Cron, Notion Calendar, Fantastical, Fresha, Vagaro, Glossgenius.

2. **Deposit-on-booking psychology** — what % deposit is industry standard for hair/beauty in AU? At what point do customers abandon? Any data on no-show reduction by deposit size?

3. **Conversation-as-system-of-record** — is anyone else in beauty CRM treating the IG DM as the primary record (vs. the booking)? Front, Trengo, Missive do it for B2B; nobody we've found does it for solo beauty operators.

4. **Onboarding-shaped products** — products where the post-signup workspace materially differs based on answers. Notion templates, Linear's "import from Jira/Asana", Coda's "kits", Webflow's templates. We want the onboarding to be a **product moment**, not a chore.

5. **Stripe Connect for solo operators in AU** — Express vs. Standard accounts, AU verification requirements, typical timeline from signup to first payout, and what happens for ABN-less sole traders.

6. **Direct competitors landscape (AU-specific)** — Fresha, Timely (Kiwi), Vagaro, Phorest, Schedulista, Glossgenius. For each: target persona, pricing, what's distinctively good/bad, what they don't do that we should.

7. **Meta Graph + WhatsApp Cloud API for inbound DMs** — what's the practical state of pulling Instagram DMs into a third-party inbox? Approval timelines? Restrictions on automated replies?

---

## Where to start reading

If Sam wants to read code:

- `src/types/models.ts` — every domain model in one file
- `supabase/migration.sql` — the database schema, single source of truth
- `src/components/modules/inquiries/` — the freshest, most-polished surface; good shape to copy when polishing other tabs
- `src/lib/onboarding-v2.ts` + `src/app/onboarding/page.tsx` — how persona drives feature enablement
- `src/lib/db/*.ts` — the snake_case ↔ camelCase mapping pattern repeated per entity
- `CLAUDE.md` — the dev guide / conventions
- `/Users/akash/.claude/plans/elegant-munching-manatee.md` — the meta-roadmap

If Sam wants to use the product:

- Run `npm run dev`
- Visit `/dev` — the dev launcher gives one-click access to seeded demo data and every public flow without needing a real account.

---

## Status flags

- **Production**: landing page, onboarding, forms + inquiries (full funnel polished today).
- **Wired but not polished**: bookings, calendar (month-only), clients, payments (Stripe Connect onboarding flow exists but no real deposits captured yet).
- **Scaffolded**: communications, marketing, automations, teams, settings.
- **Legacy / off**: the addon modules (loyalty, memberships, proposals, jobs, invoicing, leads).

We have **no live customers yet** — we're pre-launch. Goal is first 10 friendly users on the early-access waitlist within ~6 weeks of Phase 4 shipping.

---

Anything missing here, ask Akash. The plan file at `~/.claude/plans/elegant-munching-manatee.md` has the latest meta-roadmap; this brief stays current with what's actually shipping.
