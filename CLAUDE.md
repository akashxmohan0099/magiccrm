# MAGIC CRM — Development Guide

## Product

Conversation-first CRM for Beauty & Wellness. Three entry points (booking form, inquiry form, unified comms) funnel into 5 core objects: Client, Booking, Inquiry, Conversation, Payment Document.

Clients are never manually created — a client record only exists when a booking is made.

## Architecture

Direct component rendering. No schema system, no persona variants, no dynamic module assembly. Each tab has its own page component.

### 12 Dashboard Tabs

**Daily Workflow:** Communications, Inquiries, Bookings, Calendar, Clients
**Operations:** Payments, Marketing
**Setup:** Services, Forms, Automations, Teams, Settings

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
  types/          — TypeScript type definitions (models.ts)
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

- Next.js (App Router)
- React 19
- TypeScript 5 (strict mode)
- Tailwind CSS 4
- Zustand 5 (state management, 12 stores)
- Framer Motion (animations)
- Supabase (database + auth + realtime + storage)
- Stripe Connect (payments, on_behalf_of)
- Twilio (SMS)

Planned integrations (not yet wired):
- Nylas (email + calendar sync)
- Meta Graph API (Instagram + Facebook DMs)
- WhatsApp Cloud API

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

## Addon Modules (Untouched)

Legacy addon modules exist in `src/components/modules/` (leads, invoicing, jobs, proposals, etc.) but are NOT rendered by the core product. They may have broken imports. Do not fix them unless explicitly asked.
