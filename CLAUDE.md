# MAGIC CRM — Development Guide

Last updated: 2026-05-02

> See `REPO_GUIDE.md` for working rules, refactor plan, and hygiene checklists. This file is the architecture reference.

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
    modules/      — Tab page components (one directory per tab)
    ui/           — Shared UI components (DataTable, Modal, Toast, etc.)
  store/          — 12 Zustand stores (all persist to localStorage)
  lib/
    db/           — Supabase CRUD operations (one file per entity)
    integrations/ — Stripe, Twilio
    auth/         — Workspace bootstrap, invites
    server/       — Server-side logic (automation runner, public booking)
  hooks/          — Custom React hooks
  types/
    models/       — TypeScript type definitions, split by domain
    models/index.ts — barrel export
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
npm run test         # Run vitest tests
npm run test:watch   # Watch mode tests
```

## Database

12 tables defined in `supabase/migration.sql`:
- workspaces, workspace_members, workspace_settings
- clients, bookings, inquiries, conversations, messages
- payment_documents, payment_line_items
- services, member_services, forms, automation_rules, campaigns
- activity_log

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
