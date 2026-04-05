# MAGIC CRM

A composable, persona-aware CRM built for beauty and wellness professionals. One platform that adapts its modules, vocabulary, and workflows to each specialty — hairstylists, lash techs, makeup artists, nail techs, skin therapists, spa owners, barbers, cosmetic tattoo artists, and multi-service studios.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.7 |
| UI | React | 19.2.3 |
| Language | TypeScript (strict) | 5.x |
| Styling | Tailwind CSS | 4.x |
| State | Zustand (43 stores, localStorage + Supabase sync) | 5.0.12 |
| Animation | Framer Motion | 12.38.0 |
| Database | Supabase (PostgreSQL + Auth + Storage) | 2.99.2 |
| AI | Anthropic Claude (builder, insights, chat) | 0.79.0 |
| AI | Kimi / Moonshot (onboarding tuning) | — |
| Payments | Stripe | 20.4.1 |
| Email | Resend | 6.9.4 |
| SMS | Twilio | — |
| Testing | Vitest + Playwright | 4.1.1 / 1.58.2 |
| Deployment | Vercel | — |

## Architecture

Three-layer feature-primitive system. Modules are not hardcoded — they are compositions of generic renderers configured by schema definitions. Onboarding answers drive AI to assemble persona-specific workspaces.

```
Layer 3: Module Assembly    (persona selection + AI tuning)
Layer 2: Module Schemas     (fields, views, status flows, actions)
Layer 1: Feature Primitives (10 generic renderers)
```

### Data Flow

```
Onboarding → assembleWorkspaceSync() → assembled-schemas store
→ useModuleSchema(moduleId) → components read personalized labels
→ Sidebar shows persona-tailored module names and order
```

## Modules

**31 total modules** across the platform. 7 are production-ready with full Supabase sync. 24 are in beta.

### Production (7)

| Module | Slug | Description |
|--------|------|-------------|
| Clients | `/clients` | Contact management, tags, notes, relationships, custom fields |
| Leads | `/leads` | Kanban pipeline, web form capture, conversion to client |
| Messages | `/communication` | Multi-channel inbox (email, SMS, Instagram, WhatsApp) |
| Billing | `/invoicing` | Invoices, quotes, proposals, PDF generation, payment links |
| Scheduling | `/bookings` | Calendar, appointments, availability, waitlist, reminders |
| Products | `/products` | Product/service catalog with stock tracking |
| Documents | `/documents` | Contracts, file uploads, sharing via Supabase Storage |

### Beta (24)

Projects, Marketing, Team, Client Portal, Automations, Reporting, Support, Memberships, Before & After, Forms, Treatment Notes, Loyalty & Referrals, Win-Back, Storefront, AI Insights, Notes & Docs, Gift Cards, Class Timetable, Vendors, Proposals, Waitlist — accessible via `/dashboard/addons` with "Coming Soon" labels.

## Personas

9 beauty & wellness specialties, each with tailored onboarding, vocabulary, default modules, and sample data:

| Persona | Category | Key Modules |
|---------|----------|-------------|
| Hair Salon / Hairstylist | Hair | Appointments, Clients, Products |
| Barber | Barber | Appointments, Clients, Walk-ins |
| Nail Tech | Nails | Appointments, Aftercare, Products |
| Lash & Brow Tech | Lashes & Brows | Appointments, Aftercare, Clients |
| Cosmetic Tattoo Artist | Cosmetic Tattoo | Consent Forms, SOAP Notes, Before/After |
| Skin Therapist | Skin Clinic | SOAP Notes, Treatment Plans, Products |
| Spa / Massage Therapist | Spa & Massage | Schedule, Memberships, Team |
| Makeup Artist | Makeup | Inquiries, Proposals, Bookings |
| Multi-Service Studio | Multi-Service | Full module access |

## Onboarding Flow

6-step guided setup that builds a personalized workspace:

1. **Welcome** — set expectations (2 min, free, no card)
2. **Persona Selection** — category grid → auto-select or pick from multi-persona categories
3. **Business Details** — name + description with persona-specific placeholders
4. **Operating Context** — 5 slides of chip-based questions, persona-tailored labels and options
5. **Follow-up Questions** — AI-generated contextual questions + communication channel picker
6. **Summary & Signup** — review enabled modules, create account, workspace assembly

Assembly pipeline: base schemas + persona variants → Kimi AI tuning → 4-level validation → workspace blueprint.

## Database

**30 tables** in Supabase PostgreSQL with full Row Level Security (RLS). Multi-tenant via `workspace_id` on every table.

Key tables: `workspaces`, `workspace_members`, `clients`, `bookings`, `services`, `invoices`, `leads`, `jobs`, `proposals`, `documents`, `messages`, `payments`, `automation_rules`, `activity_log`.

All workspace data is isolated — every query filters by `workspace_id` enforced at the RLS policy level.

## Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| Stripe | Invoice payments, subscriptions | Code ready, needs credentials |
| Resend | Transactional email (invoices, reminders) | Wired, graceful fallback |
| Twilio | SMS booking reminders, notifications | Code ready, needs credentials |
| Google Calendar | Two-way calendar sync | OAuth flow ready, needs credentials |
| Xero | Accounting sync | OAuth flow ready, needs credentials |
| Unipile | Social DM aggregation (IG, FB, WhatsApp) | Code ready, needs credentials |
| Claude (Anthropic) | AI Builder, AI Chat, AI Insights | Active |
| Kimi (Moonshot) | Onboarding question generation, tuning | Active |

## Security

- Supabase RLS on all tables with `get_my_workspace_id()` helper
- `requireWorkspaceAccess(workspaceId, role)` auth guard on all API routes
- Input sanitization on invoice PDF generation (XSS prevention)
- Stripe webhook signature verification
- Twilio webhook signature verification
- Rate limiting on public endpoints (in-memory sliding window)
- Security headers: X-Frame-Options DENY, nosniff, strict referrer
- CRON_SECRET protection for scheduled jobs

## Testing

- **317 unit/integration tests** across 12 test files (Vitest)
- Coverage: schema validation, persona flows (all 9), assembly pipeline, workspace blueprints, feature registry, cascade delete, rate limiting, proposal status
- **E2E tests** via Playwright: auth flows, onboarding, dashboard navigation, critical paths

## Commands

```bash
npm run dev          # Development server (Turbopack)
npm run build        # Production build
npm run test         # Run vitest (317 tests)
npm run test:watch   # Watch mode
npm run test:e2e     # Playwright e2e tests
npm run lint         # ESLint
npm run typecheck    # TypeScript strict check
```

## Project Structure

```
src/
  app/                 Next.js App Router pages + API routes
  components/
    modules/           31 module page components
    primitives/        Schema-driven renderers (SchemaTable, SchemaForm, etc.)
    ui/                Shared UI (DataTable, KanbanBoard, Modal, Button, etc.)
    onboarding/        6 onboarding step components
  store/               43 Zustand stores (localStorage + Supabase persistence)
  lib/
    module-schemas/    Base schemas (8) + persona variants (9)
    workspace-blueprints/  Blueprint resolver pipeline
    integrations/      Third-party API clients (Stripe, Twilio, etc.)
    db/                Supabase database operations (30+ files)
  hooks/               Custom React hooks (useAuth, useFeature, useSupabaseSync, etc.)
  types/               TypeScript type definitions
supabase/
  migration.sql        Full database schema (30 tables + RLS policies)
```

## Deployment

Hosted on Vercel at `magiccrm-taupe.vercel.app`. Cron job runs hourly for booking reminders. Auto-deploys on push to `main`.

## Status

The platform's core is production-ready: onboarding, 7 modules with full database sync, auth, multi-tenancy, and payment infrastructure. 24 additional modules are in beta, hidden from the sidebar but accessible for development. Integrations are code-complete and activate when credentials are configured in the environment.
