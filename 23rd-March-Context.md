# Magic — Complete Platform Context (23 March 2026)

## What is Magic?

Magic is a modular, persona-driven business software platform. Instead of a one-size-fits-all tool, it asks users what they do and assembles a custom workspace with only the modules, features, and vocabulary they need. A hair salon gets "Clients" and "Appointments" with colour formula tracking. A plumber gets "Clients" and "Jobs" with site address fields and permit tracking. Same platform, completely different experience.

**Stack**: Next.js 16 (App Router, Turbopack), React 19, Supabase (Postgres + Auth + RLS), Zustand (37 stores with localStorage persistence), Tailwind CSS v4, Framer Motion.

---

## 1. Signup Flow

| Step | What happens |
|------|-------------|
| 1 | User lands on `/signup`, enters **email** and **password** (min 6 chars) |
| 2 | Client POSTs to `/api/auth/signup` — server uses Supabase admin API to create user with `email_confirm: true` (no verification email) |
| 3 | Client signs in immediately via `signInWithPassword` |
| 4 | Client creates workspace (`workspaces` table), workspace member (role: `owner`), and workspace settings |
| 5 | Redirects to `/onboarding` |

No email verification. No business name on signup — that's collected in onboarding step 2.

**Key files**: `src/app/signup/page.tsx`, `src/app/api/auth/signup/route.ts`

---

## 2. Onboarding Flow (8 Steps)

| Step | Screen | What the user does |
|------|--------|--------------------|
| 0 | **Welcome** | Sees intro, clicks "Get started" |
| 1 | **Industry + Persona** | Picks one of 9 industries, then a specific persona (e.g., Beauty & Wellness → Hair Salon) |
| 2 | **Business Context** | Enters business name, description, location (all required) |
| 3 | **Setup Method** | Chooses: "Answer a few questions" (guided) or "I'll pick myself" (self-serve) |
| 4a | **Needs Assessment** (guided) | 5–12 yes/no persona-specific questions, one at a time, keyboard shortcuts (Y/N, arrow keys) |
| 4b | **Self-Serve Picker** (self-serve) | Browse all modules, toggle on/off, expand to see sub-features |
| 5a | **Feature Drilldown** (guided) | Detailed follow-up questions on "yes" answers — auto-selects specific sub-features |
| 5b | **Summary** (self-serve) | Review selections, click "Complete Setup" |
| 6 | **Feature Selection** (guided only) | Granular toggle of every sub-feature per module |
| 7 | **Summary** (guided only) | Review all selected modules + feature counts, click "Complete Setup" |
| — | **Building Screen** | Animated transition, syncs to Supabase, then redirects to `/dashboard` |

**Key files**: `src/app/onboarding/page.tsx`, `src/components/onboarding/*.tsx` (11 components)

---

## 3. Industries & Personas

9 industries, each with 0–7 personas. Each persona customises vocabulary, default modules, discovery questions, custom fields, and hidden features.

### Beauty & Wellness (✨)
**Personas**: Hair Salon, Barber, Nail Tech, Lash & Brow Tech, Makeup Artist, Spa/Massage
- Vocabulary: Clients, Appointments, Receipts
- Default needs: manageCustomers, acceptBookings, sendInvoices, communicateClients, runMarketing, receiveInquiries
- Custom fields: Allergies, skin type, preferred products, last service date

### Trades & Construction (🔧)
**Personas**: Plumber, Electrician, Builder/Carpenter, Painter, HVAC, Landscaper, Cleaner
- Vocabulary: Clients, Jobs, Invoices
- Default needs: manageCustomers, sendInvoices, manageProjects, receiveInquiries, communicateClients, manageDocuments
- Custom fields: Site address, property type, access notes, permit required
- Invoice mode: milestone-based

### Professional Services (💼)
**Personas**: Accountant/Bookkeeper, Lawyer/Solicitor, Consultant, Real Estate Agent, Financial Advisor, Marketing Agency
- Vocabulary: Clients, Projects, Meetings (Lawyer: Matters, Consultations)
- Default needs: all 9 needs enabled
- Custom fields: Company name, ABN/Tax ID, engagement type, billing contact
- Invoice mode: recurring

### Health & Fitness (🏋️)
**Personas**: Personal Trainer, Gym/Studio Owner, Yoga/Pilates Studio, Physio/Chiro, Nutritionist
- Vocabulary: Clients, Sessions, Receipts (Physio: Patients, Appointments)
- Custom fields: Fitness goals, injuries/conditions, emergency contact

### Creative & Design (🎨)
**Personas**: Photographer, Graphic Designer, Web Designer/Developer, Videographer, Interior Designer
- Vocabulary: Clients, Projects, Proposals
- Custom fields: Project type, brand assets URL, delivery deadline

### Hospitality & Events (🍽️)
**Personas**: Wedding Planner, Event Planner, Caterer, Venue Manager, Florist
- Vocabulary: Clients, Events, Invoices
- Custom fields: Event date, venue, guest count, dietary requirements
- Relationships: partner, event-planner

### Education & Coaching (📚)
**Personas**: Tutor, Life/Business Coach, Music Teacher, Driving Instructor, Online Course Creator
- Vocabulary: Students, Lessons, Invoices (inherits to all personas)
- Custom fields: Year level, school, subjects, learning notes
- Relationships: parent, sibling

### Retail & E-commerce (🛒)
**Personas**: Online Store, Boutique Shop, Handmade/Artisan, Food & Beverage
- Vocabulary: Customers, Orders, Invoices
- Default needs: manageCustomers, sendInvoices, communicateClients, runMarketing, receiveInquiries, handleSupport

### Something Else (🚀)
- Generic industry — no smart defaults, no hidden features
- No personas — user picks everything manually

**Key files**: `src/types/onboarding.ts` (INDUSTRY_CONFIGS), `src/lib/industry-configs/*.ts` (9 config files)

---

## 4. Core Modules (14)

| Module ID | Default Name | Group | Sub-Features | Description |
|-----------|-------------|-------|-------------|-------------|
| `leads-pipeline` | Leads | business | 7 | Lead inbox, pipeline stages, conversion to client |
| `communication` | Messages | business | 13 | Unified inbox (email, SMS, Instagram, WhatsApp, LinkedIn, Facebook) |
| `client-database` | Clients | business | 9 | Client profiles, tags, activity timeline, import/export |
| `bookings-calendar` | Scheduling | business | 21 | Appointments, calendar, availability, services, reminders |
| `jobs-projects` | Projects | business | 11 | Job/project tracking, tasks, time entries, files |
| `quotes-invoicing` | Billing | business | 28 | Quotes, invoices, line items, payment tracking, proposals |
| `documents` | Documents | business | 8 | File uploads, contracts, templates, e-signatures |
| `products` | Products | business | 6 | Product catalog, categories, stock tracking |
| `marketing` | Marketing | grow | 7 | Campaigns, email sequences, social scheduling, reviews, coupons |
| `team` | Team | grow | 8 | Team members, roles, permissions, shifts, availability |
| `support` | Support | grow | 8 | Ticket system, knowledge base, satisfaction tracking |
| `client-portal` | Client Portal | grow | 6 | Self-service client hub |
| `automations` | Automations | system | 5 | Rule-based automation (triggers + actions) |
| `reporting` | Reporting | system | 11 | Dashboards, goal tracking, export, activity feed |

**Total: 148 toggleable sub-features** across 14 core modules.

Module names are vocabulary-aware — "Clients" becomes "Students" for Education, "Scheduling" becomes "Appointments" for Beauty, etc.

**Group labels**: business = "Your Business", grow = "Grow", system = "Insights"

**Key file**: `src/lib/module-registry.ts` (28 modules total: 14 core + 14 add-on)

---

## 5. Add-On Modules (14)

Add-ons are optional modules enabled from `/dashboard/addons`. They can be toggled on/off anytime.

| Add-On ID | Name | Has Feature Block | Description |
|-----------|------|-------------------|-------------|
| `memberships` | Memberships | Yes (5) | Session packs, recurring plans, freeze/pause, expiry alerts, revenue report |
| `loyalty` | Loyalty & Referrals | Yes (5) | Points per visit, punch card, reward tiers, auto-notify, custom rewards |
| `intake-forms` | Forms | Yes (7) | Auto-send, consent signature, pre-fill, conditional fields, file upload, response viewer, notifications |
| `soap-notes` | Treatment Notes | Yes (6) | Templates, auto-link to client, practitioner filter, body map, note locking, treatment plans |
| `win-back` | Win-Back | Yes (5) | Auto-detect lapsed clients, auto-send offers, tracking, custom thresholds, performance report |
| `storefront` | Storefront | Yes (3) | Photo gallery, reviews display, business info |
| `ai-insights` | AI Insights | Yes (5) | Rebooking alerts, revenue forecast, churn risk, weekly digest, lifetime value |
| `before-after` | Before & After | Yes (3) | Side-by-side photos, client consent, share to storefront |
| `notes-docs` | Notes & Docs | No | Rich text editor with formatting, pinning, search |
| `gift-cards` | Gift Cards | No | Create, sell, redeem, track digital gift cards |
| `class-timetable` | Class Timetable | No | Visual weekly schedule, capacity, enrollment |
| `vendor-management` | Vendors | No | Supplier directory, contracts, payments, ratings |
| `proposals` | Proposals | No | Branded proposal pages, templates, e-signature, share links |
| `waitlist-manager` | Waitlist | No | Track waiting clients, auto-notify on availability |

8 add-ons have toggleable sub-feature blocks; 6 are simple on/off modules.

**Key files**: `src/store/addons.ts`, `src/app/dashboard/addons/page.tsx`, `src/types/features.ts` (ADDON_FEATURE_BLOCKS)

---

## 6. Feature Assignment Logic

### How modules get enabled

Three paths:

1. **Needs assessment** (guided path): User answers "Do you send invoices?" → YES → `needs.sendInvoices = true` → maps to `quotes-invoicing` module
2. **Self-serve toggle**: User directly enables/disables modules
3. **Auto-enable rules**: Some modules auto-enable based on other selections

### Needs → Module mapping

| Need Key | Module |
|----------|--------|
| `manageCustomers` | client-database |
| `receiveInquiries` | leads-pipeline |
| `communicateClients` | communication |
| `acceptBookings` | bookings-calendar |
| `sendInvoices` | quotes-invoicing |
| `manageProjects` | jobs-projects |
| `runMarketing` | marketing |
| `handleSupport` | support |
| `manageDocuments` | documents |

### Auto-enable rules

| Module | Auto-enabled when |
|--------|------------------|
| `products` | `acceptBookings` is true (service catalog needed) |
| `team` | `manageProjects` is true |
| `client-portal` | triggered by `manageCustomers` |
| `automations` | `acceptBookings` OR `sendInvoices` OR `manageProjects` |
| `reporting` | `sendInvoices` OR `manageProjects` |

### Runtime feature checks

```typescript
useModuleEnabled("bookings-calendar")
// → true if featureSelections["bookings-calendar"] has any selected features

useFeature("bookings-calendar", "waitlist")
// → core features: always true when module enabled
// → sub-features: checks featureSelections[moduleId].find(f => f.id === featureId)?.selected
```

**Key file**: `src/hooks/useFeature.ts`

---

## 7. Persona Discovery Questions

Each persona has 5–12 tailored yes/no questions. Answering YES:
- Enables specific modules
- Auto-selects relevant sub-features
- May trigger follow-up questions

**Example — Hair Salon persona (10 questions)**:
1. "Do you keep track of client colour formulas and service history?" → enables client-database + custom-fields
2. "Do clients book appointments with you?" → enables bookings-calendar
3. "Do you get inquiries from new clients?" → enables leads-pipeline + web-forms
4. "Do you send invoices or process payments?" → enables quotes-invoicing
5. "Do you message clients (reminders, follow-ups)?" → enables communication
6. "Do you run promotions or ask for reviews?" → enables marketing
7. "Do you have a team?" → enables team
8. "Do you take before-and-after photos?" → enables before-after add-on
9. "Would you like a loyalty or referral program?" → enables loyalty add-on
10. "Would you like to automatically re-engage lapsed clients?" → enables win-back add-on

Follow-ups: If Q2 is YES → "Do you want a cancellation policy?", "Do you need online booking?", "Want automated reminders?"

**Key file**: `src/lib/persona-questions.ts`

---

## 8. Vocabulary System

Every industry/persona can override how modules and actions are labelled throughout the UI:

| Default | Beauty | Trades | Professional | Education | Retail |
|---------|--------|--------|-------------|-----------|--------|
| Clients | Clients | Clients | Clients | Students | Customers |
| Add Client | Add Client | Add Client | Add Client | Add Student | Add Customer |
| Scheduling | Appointments | Scheduling | Meetings | Lessons | Appointments |
| Projects | Services | Jobs | Projects | Courses | — |
| Leads | Leads | Leads | Prospects | Inquiries | Leads |
| Billing | Receipts | Invoices | Invoices | Invoices | Invoices |

Persona-level overrides stack on top: Lawyer gets "Matters" instead of "Projects", Physio gets "Patients" instead of "Clients".

The sidebar, page headers, empty states, buttons, and command palette all respect vocabulary overrides.

**Key files**: `src/hooks/useVocabulary.ts`, `src/lib/industry-configs/*.ts`

---

## 9. Dashboard Structure

After onboarding, the dashboard at `/dashboard` shows:

- **Sidebar** (left, 240px): dynamically built from enabled modules + add-ons + custom features
  - Top: logo + business name
  - Grouped by: "Your Business", "Grow", "Insights"
  - Add-ons section with "Browse Add-ons" link
  - Custom features section with "Build Your Own" link + credit badge
  - Bottom: Settings
- **Header**: search bar (⌘K command palette), module customizer button, notifications, avatar menu with sign out
- **Main content**: module pages loaded via `next/dynamic` code splitting (27 lazy-loaded components)
- **Widgets**: customizable dashboard cards (stats, recent activity, upcoming bookings, revenue)

### Module page routing
`/dashboard/[moduleSlug]` → dynamically loads the correct module component.

### Command palette (⌘K)
- Navigation: jump to any enabled module page
- Actions: add client, new booking, create invoice, new lead
- Client search: find clients by name/email

**Key file**: `src/app/dashboard/layout.tsx`, `src/app/dashboard/[moduleSlug]/page.tsx`

---

## 10. Custom Feature Builder (AI)

Users can describe a feature in plain English and the AI generates a custom module:

- **25 credits** included (each generation costs 1 credit)
- User writes a prompt (e.g., "Track inventory with low-stock alerts")
- System sends to Claude API → returns a feature brief
- Feature gets custom data collections with table and kanban views
- Custom features appear as nav items in the sidebar under "Custom"
- Each custom feature has its own data tables with full CRUD operations

**Example prompts**: "Gift card system", "Loyalty points tracker", "Inventory alerts", "Intake form builder", "Waitlist manager", "Referral tracking"

**Key files**: `src/store/builder.ts`, `src/app/dashboard/builder/page.tsx`

---

## 11. Authentication & Security

| Layer | Implementation |
|-------|---------------|
| **Route protection** | Middleware protects all routes except `/`, `/login`, `/signup`, `/onboarding`, `/proposal`, `/api`, `/auth` |
| **API auth** | All integration routes use `requireAuth()` helper — returns 401 without valid Supabase session |
| **Webhook security** | Stripe: built-in `constructEvent` signature verification; Twilio: HMAC verification with `crypto.timingSafeEqual` |
| **Open redirect prevention** | `safeRedirect()` validates paths start with `/` and not `//` |
| **Database security** | Row Level Security on all tables via `get_my_workspace_id()` function |
| **Security headers** | Via `next.config.ts`: X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy (strict-origin-when-cross-origin), Permissions-Policy |

**Key files**: `src/middleware.ts`, `src/lib/api-auth.ts`, `src/lib/safe-redirect.ts`, `next.config.ts`

---

## 12. Data Persistence

### Local (Zustand + localStorage)
37 stores, each using `zustand/persist` with localStorage. Data is available immediately on page load without waiting for Supabase.

### Remote (Supabase Postgres)
On dashboard load, `useSupabaseSync` parallel-loads all stores from Supabase in two batches. Local state is the source of truth for UI, with fire-and-forget syncs to Supabase on every mutation.

### Store list (37 stores)
activity, addons, ai-insights, automations, before-after, bookings, builder, class-timetable, client-portal, clients, communication, dashboard, discussions, documents, gift-cards, intake-forms, invoices, jobs, leads, loyalty, marketing, memberships, onboarding, payments, products, proposals, rebooking, reminders, services, soap-notes, storefront, support, team, vendor-management, waitlist, win-back, workflow-settings

### Storage key convention
All localStorage keys: `magic-crm-{storeName}` (e.g., `magic-crm-clients`, `magic-crm-bookings`)

---

## 13. Key File Reference

| File | Purpose |
|------|---------|
| `src/app/signup/page.tsx` | Signup UI (email + password) |
| `src/app/api/auth/signup/route.ts` | Server-side user creation (auto-confirm) |
| `src/app/onboarding/page.tsx` | Onboarding step router |
| `src/components/onboarding/*.tsx` | 11 onboarding step components |
| `src/types/onboarding.ts` | Industry configs, needs assessment, feature categories |
| `src/types/features.ts` | Feature blocks (14 core) + addon feature blocks (8) |
| `src/types/models.ts` | All data model interfaces |
| `src/lib/module-registry.ts` | Module registry (28 modules: 14 core + 14 add-on) |
| `src/lib/industry-configs/*.ts` | 9 industry configuration files |
| `src/lib/persona-questions.ts` | Persona-specific discovery questions |
| `src/lib/api-auth.ts` | Shared auth helper for API routes |
| `src/lib/safe-redirect.ts` | Open redirect prevention |
| `src/store/*.ts` | 37 Zustand stores (one per domain) |
| `src/hooks/useFeature.ts` | Feature/module enabled logic + auto-enable rules |
| `src/hooks/useAuth.ts` | Auth state + workspace member |
| `src/hooks/useSupabaseSync.ts` | Parallel Supabase data loading |
| `src/hooks/useVocabulary.ts` | Industry-aware label overrides |
| `src/app/dashboard/layout.tsx` | Dashboard shell (sidebar + header) |
| `src/app/dashboard/[moduleSlug]/page.tsx` | Dynamic module page loader (27 lazy imports) |
| `src/middleware.ts` | Route protection |
| `next.config.ts` | Security headers |
| `supabase/migration.sql` | Complete database schema + RLS policies |
