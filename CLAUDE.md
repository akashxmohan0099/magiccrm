# MAGIC CRM — Development Guide

Last updated: 2026-05-02 (post-Phase 10 sync)

> See `REPO_GUIDE.md` for working rules, refactor plan, and hygiene checklists. See `REVIEW_HANDOFF.md` for the post-refactor state summary. This file is the architecture reference.

## Product

Conversation-first CRM for Beauty & Wellness. Three entry points (booking form, inquiry form, unified comms) funnel into 5 core objects: Client, Booking, Inquiry, Conversation, Payment Document.

Clients are never created as a side-effect of any flow other than booking. Manual entry (the dashboard's Add Client / Import buttons) exists for legacy and walk-in clients only — bookings/inquiries/conversations themselves don't auto-create client rows; they reference one only after the operator confirms a booking.

## Architecture

Direct component rendering. No schema system, no persona variants, no dynamic module assembly. Each tab has its own page component.

### Core Dashboard Tabs (always visible)

**Daily Workflow:** Communications, Inquiries, Bookings, Calendar, Clients
**Operations:** Payments, Marketing
**Setup:** Services, Forms, Automations, Teams, Settings

### Addon Modules (toggleable from `/dashboard/addons`)

Defined in `src/lib/addon-modules.ts`. Routed via `src/app/dashboard/[moduleSlug]/page.tsx`. Visibility controlled by `useSettingsStore`.

| Addon | Slug | Page component |
|---|---|---|
| Analytics | `analytics` | `modules/analytics/AnalyticsPage.tsx` |
| Marketing | `marketing` | `modules/marketing/` (also a core tab) |
| Gift Cards | `gift-cards` | `modules/gift-cards/` |
| Loyalty & Referrals | `loyalty` | `modules/loyalty/LoyaltyPage.tsx` |
| Business Insights | `ai-insights` | `modules/ai-insights/AIInsightsPage.tsx` |
| Win-Back | `win-back` | `modules/win-back/WinBackPage.tsx` |
| Proposals | `proposals` | `modules/proposals/ProposalsPage.tsx` |
| Memberships | `memberships` | `modules/memberships/MembershipsPage.tsx` |
| Documents | `documents` | `modules/documents/DocumentsPage.tsx` |

### Key Directories

```
src/
  app/            — Next.js App Router pages + API routes
  components/
    modules/<domain>/   — Tab page components (one folder per domain)
      services/drawer/  — ServiceDrawer split into Section components
      services/preview/ — ServicesPreview split into 22 sub-components
      forms/editor/     — FormEditor + tab files
    forms/              — Cross-cutting form primitives (FormChrome, FieldRow, ThemeScope, renderer-helpers)
    landing/            — Marketing site (CinematicDemo barrel + cinematic/ sub-folder, ScrollMechanic + scroll-mechanic-data)
    ui/                 — Shared design system (DataTable, Modal, Toast, etc.)
  store/                — 27 Zustand stores (all persist to localStorage)
  lib/
    db/<entity>.ts      — Supabase CRUD wrappers + snake/camel mapping (19 files)
    services/           — Domain logic (category, membership-debit, resource-conflicts)
    forms/              — Form validation + draft state (use-form-draft hook)
    calendar/           — Slot generation + utilization
    server/             — Server-only helpers (public-booking, etc.)
    integrations/       — Stripe, Twilio, Resend, Anthropic wrappers (all DORMANT)
    auth/               — Workspace bootstrap, invites
    format/             — Display formatting (money, dates)
    onboarding-*.ts     — Split: types, options, actions, service-templates (re-exported from onboarding.ts)
  hooks/                — Cross-domain React hooks
  types/                — 15 domain files + models.ts barrel
```

### Data Flow

```
User action → Zustand store (optimistic update) → Supabase DB (async)
Page load → useSupabaseSync → loads all stores from Supabase
Realtime → useRealtimeSync → Supabase Realtime → reload affected store
```

### Permissions

- **Owner**: sees all tabs, full CRUD on everything
- **Team Member**: sees Bookings (own), Calendar (own), Clients (served), Earnings widget
- Enforced at DB level via Supabase RLS with `get_my_workspace_id()`, `get_my_member_id()`, `is_workspace_owner()`

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript 5 (strict mode)
- Tailwind CSS 4
- Zustand 5 (state management)
- Framer Motion (animations)
- Supabase (database + auth + realtime + storage) — **LIVE**
- Posthog (analytics) — LIVE
- Sentry (error tracking) — LIVE

Wrappers exist but DORMANT (no API keys configured):
- Stripe Connect (payments)
- Twilio (SMS)
- Resend (transactional email)
- Anthropic API (inbox draft-reply)

Not yet wired:
- Nylas (email + calendar sync)
- Meta Graph API (Instagram + Facebook DMs)
- WhatsApp Cloud API

Integration discipline: see REPO_GUIDE.md Section 8.

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run test         # Run vitest tests
npm run test:watch   # Watch mode tests
npm run test:e2e     # Playwright
```

## Database

48 tables defined in `supabase/migration.sql`. Core domains:

- **Workspace:** workspaces, workspace_members, workspace_settings, workspace_invites
- **People:** clients, client_tags, client_photos, treatment_notes
- **Catalog:** services, service_categories, member_services, library_addons, locations, resources
- **Bookings:** bookings, booking_waitlist, calendar_blocks
- **Inbox:** inquiries, conversations, messages
- **Payments:** payment_documents, payment_line_items, refunds
- **Forms:** forms, form_responses
- **Marketing:** campaigns, automation_rules
- **Addons:** gift_cards, memberships, membership_plans, client_memberships, proposals, documents, loyalty_*
- **Audit:** activity_log

Every table has `workspace_id` + RLS policy. See REPO_GUIDE.md Section 9.

## Conventions

- Components: PascalCase files
- Hooks: camelCase with `use` prefix
- Lib/Store: kebab-case files
- All stores use Zustand `persist` middleware with version 2
- DB files map snake_case ↔ camelCase between Supabase and frontend
- Errors: toast notifications via `@/components/ui/Toast`

## File Size Rules

- Component files: max 400 lines. Split into sub-components if exceeded.
- Page components: max 200 lines. Move logic to `components/modules/<domain>/`.
- API route handlers: max 100 lines. Extract logic to `src/lib/server/`.
- Type files: max 300 lines. Split by domain.

Full rules in REPO_GUIDE.md Section 4.

## Server vs Client Components

Default to Server Components. Add `"use client"` only when the file uses state, effects, event handlers, browser APIs, Zustand, or Framer Motion. See REPO_GUIDE.md Section 6.
