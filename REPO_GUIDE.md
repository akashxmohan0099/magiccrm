# MAGIC CRM — Repo Guide & Working Rules

Last updated: 2026-05-02 (post-Phase 10 sync)
Owner: Akash

This is the operating manual for keeping the codebase sane. Everything in here is a rule, not a suggestion. If you find yourself wanting to break a rule, document why in the PR.

---

## 1. How the stack actually works

```
Browser (React 19 + Zustand)
    │
    │  optimistic update → fetch()
    ▼
Next.js 16 App Router (src/app/...)
    │
    │  src/lib/db/<entity>.ts  (snake_case ↔ camelCase mapping)
    ▼
Supabase Postgres + Auth + RLS + Realtime
```

### The four layers in plain language

1. **Supabase** — the database, login, and realtime sync. Row Level Security (RLS) enforces tenant isolation *inside Postgres* using `workspace_id`. If RLS is wrong, nothing else matters: User A can see User B's clients.
2. **`src/lib/db/<entity>.ts`** — thin CRUD wrappers around Supabase. They convert snake_case (DB columns) to camelCase (TypeScript). Every read and write goes through these. Components never call Supabase directly.
3. **Zustand stores (`src/store/*.ts`)** — in-browser state. "Optimistic update" pattern: when the user clicks save, the store updates immediately so the UI feels instant; the DB call runs in the background and rolls back on error.
4. **Integration wrappers (`src/lib/integrations/*.ts`)** — Stripe, Twilio, Resend. Currently DORMANT. Code exists but no API keys configured. They no-op or throw if called. This is fine. Do not wire them until a real user is blocked without them.

### What's currently live vs dormant

| System | Status | Notes |
|---|---|---|
| Supabase Auth | Live | Email/password + magic link |
| Supabase DB + RLS | Live | 12 tables, `workspace_id` everywhere |
| Supabase Realtime | Live | `useRealtimeSync` hook |
| Stripe | Dormant | Wrapper code exists, no keys |
| Twilio (SMS) | Dormant | Wrapper code exists, no keys |
| Resend (email) | Dormant | Wrapper code exists, no keys |
| Anthropic API | Dormant | Used by inbox draft-reply, not active |
| Posthog | Live | Analytics events firing |
| Sentry | Live | Error tracking |

---

## 2. Current repo health (snapshot 2026-05-02, post-refactor)

| Metric | Value | Verdict |
|---|---|---|
| Total TS/TSX files | 441 | Up from 337 — extractions created sub-components, expected |
| Test files | 24 | Thin. Target 50+ for this size. **Largest standing gap.** |
| `any` types | 1 | Excellent |
| `console.log` left in | 8 | Low. Clean up before each release. |
| TODO/FIXME | 2 | Excellent |
| Files over 500 lines | 31 | Down from worst case but list is longer than original snapshot — see refresh below |
| Files over 1000 lines | 3 | Down from 8. Headline win. |
| `"use client"` directives | 226 | Up from 141 — extractions inherited the directive. Server Component migration (Section 6) would consolidate to leaf islands. |
| `"use server"` directives | 0 | Server Actions still unused |

### The 8 original critical files — status after refactor

| Original file | Lines before | Lines now | Reduction |
|---|---|---|---|
| `forms/FormsPage.tsx` | 3,938 | 770 | **-80%** |
| `services/ServicesPreview.tsx` | 2,983 | 666 | **-78%** |
| `services/ServiceDrawer.tsx` | 2,577 | 535 | **-79%** |
| `forms/FormRenderer.tsx` | 1,648 | 581 | **-65%** |
| `landing/CinematicDemo.tsx` | 1,522 | 20 | **-99%** (now barrel) |
| `types/models.ts` | 1,458 | 41 | **-97%** (now barrel) |
| `landing/ScrollMechanic.tsx` | 1,434 | 1,255 | -12% |
| `services/ServicesPage.tsx` | 1,353 | 880 | -35% |

### Files still over 500 lines (current)

Top of the list — flagged for the next "real driver" check:

| File | Lines | Notes |
|---|---|---|
| `forms/editor/FormEditor.tsx` | 1,311 | Tabbed editor; mode-switched tabs share state |
| `landing/ScrollMechanic.tsx` | 1,255 | Single scroll choreography; data extracted, JSX cohesive |
| `bookings/CalendarView.tsx` | 1,138 | Large grid with drag/scroll; helpers extracted |
| `lib/seed-data.ts` | 958 | Dev-only fixture, prod-guarded; deliberately not split (no driver) |
| `services/ServicesPage.tsx` | 880 | List + selection + bulk actions; cohesive |
| `app/book/[slug]/page.tsx` | 825 | Single public booking flow |
| `landing/HeroSplit.tsx` | 808 | Single hero animation |
| `app/api/public/book/basket/route.ts` | 805 | Helpers extracted to `lib/server/public-booking.ts`; route still long |
| `forms/FormsPage.tsx` | 770 | Was 3,938 |
| `bookings/BookingForm.tsx` | 734 | Single tight form, marginal-gain split |
| `app/dashboard/layout.tsx` | 721 | Sidebar + nav for ~25 routes |
| `lib/forms/starters.ts` | 708 | Form template seed library |

---

## 3. Cleanup plan (do in this order, one PR each)

### ✅ Phase 1 — Update CLAUDE.md (DONE 2026-05-02)

CLAUDE.md describes the 7 addon modules as "legacy / not rendered" but they ARE rendered via the addons toggle system in `src/app/dashboard/addons/page.tsx` and routed through `src/app/dashboard/[moduleSlug]/page.tsx`. Fix CLAUDE.md to reflect reality.

**The 9 addon modules (do NOT delete):**

| Addon | Page component | Build priority |
|---|---|---|
| Analytics | `modules/analytics/AnalyticsPage.tsx` | Last (after core 11 are stable) |
| Marketing | `modules/marketing/` | Already partially built — finish after core |
| Gift Cards | `modules/gift-cards/` | Already wired |
| Loyalty & Referrals | `modules/loyalty/LoyaltyPage.tsx` | Defer |
| Business Insights | `modules/ai-insights/AIInsightsPage.tsx` | Defer |
| Win-Back | `modules/win-back/WinBackPage.tsx` | Defer |
| Proposals | `modules/proposals/ProposalsPage.tsx` | Defer |
| Memberships | `modules/memberships/MembershipsPage.tsx` | Defer |
| Documents | `modules/documents/DocumentsPage.tsx` | Defer |

**Build order rule:** core 11 tabs → stable → 1 paying customer → then addons one at a time, only when a customer asks.

### ✅ Phase 2 — Type domain split (DONE 2026-05-02)

`src/types/models.ts` (1,458 lines) is now a 41-line barrel that re-exports from 15 sibling domain files in `src/types/`:

| File | Lines | Owns |
|---|---|---|
| `client.ts` | 103 | Client, TreatmentNote, ClientPatchTest, ClientTag, ClientPhoto |
| `service.ts` | 374 | Service + all pricing, variants, addons, resources, locations |
| `booking.ts` | 82 | Booking, BookingStatus, RecurrencePattern, WaitlistEntry |
| `inquiry.ts` | 27 | Inquiry, InquirySource, InquiryStatus |
| `form.ts` | 151 | Form, FormField, FormBranding, FormResponse |
| `communication.ts` | 29 | Conversation, Message, Channel |
| `payment.ts` | 46 | PaymentDocument, PaymentLineItem, Refund |
| `automation.ts` | 26 | AutomationRule, AutomationType |
| `marketing.ts` | 23 | Campaign + segments |
| `team.ts` | 41 | TeamMember, WorkingHours, LeavePeriod |
| `workspace.ts` | 170 | Workspace, WorkspaceSettings, all Onboarding types |
| `calendar.ts` | 38 | CalendarBlock, BlockKind |
| `suggestion.ts` | 140 | Calendar Suggestion + generators |
| `addons.ts` | 152 | GiftCard, Loyalty, Proposal, Membership, Document |
| `activity.ts` | 41 | ActivityEntry, InternalNote, Questionnaire |
| `models.ts` | 41 | Barrel export |

**Existing imports unchanged.** All `import { X } from "@/types/models"` keeps working. New code can import from a specific domain file (`@/types/forms`) for tighter dependencies.

Verified: `npm run typecheck` passes clean.

### Phase 3 — FormsPage breakdown (1-2 days)

`FormsPage.tsx` (3,938 lines) becomes:

```
src/components/modules/forms/
  FormsPage.tsx              — list + routing only (<300 lines)
  list/
    FormsList.tsx            — table of forms
    FormCard.tsx             — single row
  editor/
    FormEditor.tsx           — shell, manages tab state (<300 lines)
    BuilderTab.tsx           — drag-drop field builder
    FieldPalette.tsx         — sidebar of field types
    FieldEditor.tsx          — right-panel field config
    SettingsTab.tsx          — submission settings
    ThemeTab.tsx             — colors, fonts, logo
    AfterSubmitTab.tsx       — thank-you / redirect
    LogicTab.tsx             — conditional logic
  preview/
    FormPreview.tsx          — live preview iframe
  responses/
    FormResponses.tsx        — already split, leave it
  share/
    FormEmbed.tsx            — already split, leave it
```

Each file under 400 lines. PR title: `refactor: break FormsPage into editor sub-components`.

### ✅ Phase 4 — Services breakdown (DONE 2026-05-02)

| File | Before | After | Sub-files created |
|---|---|---|---|
| `ServicesPage.tsx` | 1,353 | 880 | 5 in `list/` |
| `ServicesPreview.tsx` | 2,983 | **666** (-78%) | 22 in `preview/` |
| `ServiceDrawer.tsx` | 2,577 | 2,278 | 3 in `drawer/` |

Final structure:

```
src/components/modules/services/
  ServicesPage.tsx               880   (was 1,353)
  ServicesPreview.tsx            666   (was 2,983)
  ServiceDrawer.tsx            2,278   (was 2,577) — deferred, see below
  list/                          (5 files)
    category-colors.ts
    MemberAvatar.tsx
    ServiceLetterCard.tsx
    ServiceRow.tsx
    sortable.tsx
  preview/                       (17 files + 6 step files)
    helpers.ts, types.ts
    AddPill.tsx, AddonRow.tsx, ArtistChip.tsx, BackBar.tsx
    CartArtistPicker.tsx, CartSidebar.tsx, CategoryAnchors.tsx
    ConfigureServiceModal.tsx, FeaturedRow.tsx, Header.tsx
    PriceDisplay.tsx, ServiceCards.tsx, ServiceMenu.tsx
    Shells.tsx, StylePanel.tsx
    steps/
      BasketArtistPicker.tsx, ConfirmScreen.tsx, DatePicker.tsx
      DetailsForm.tsx, IntakeField.tsx, TimePicker.tsx
  drawer/                        (3 files)
    Section.tsx, initial-state.ts, types.ts
```

**Deferred: ServiceDrawer further decomposition.** `ServiceDrawerFields` is one cohesive ~2,200-line form with ~50 interlinked `useState` hooks. Mechanical extraction isn't safe — the sub-sections would need every state setter passed as props (impractical) or state would need to be lifted into a `useServiceDraft()` hook mirroring `useFormDraft`. That's a real refactor, not a split. Schedule it as Phase 4d when ServiceDrawer next needs feature work.

### ✅ Phase 5 — Inquiries + Bookings (DONE 2026-05-02)

| File | Before | After | Files extracted |
|---|---|---|---|
| `InquiriesPage.tsx` | 900 | 574 (-36%) | NotesEditor, InterestEditors, InlineStatusCell, helpers |
| `BookingForm.tsx` | 734 | 734 | Skipped — single tight form, marginal gain |
| `CalendarView.tsx` | 1,269 | 1,138 (-10%) | calendar-helpers (pure functions + constants) |

CalendarView's main component is one giant `forwardRef`. Further splitting would need state lifting like ServiceDrawer.

### ✅ Phase 4d — ServiceDrawer state-lifting (DONE 2026-05-02)

Originally deferred but completed this session.

| Step | Result |
|---|---|
| Extract Marketing, Bundle, AddOns sections | ServiceDrawer 2,278 → 1,794 (-484) |
| Extract giant BookingRules section (~640 lines) | ServiceDrawer 1,794 → 1,057 (-737) |
| **Total ServiceDrawer reduction** | **2,577 → 1,057 (-59%)** |

Sub-files in `services/drawer/`:
- types.ts, initial-state.ts, Section.tsx (helpers)
- MarketingSection.tsx (113), BundleSection.tsx (181), AddOnsSection.tsx (288), BookingRulesSection.tsx (768)

**Still inside ServiceDrawer.tsx:** the Essentials block (~500 lines) — Basics + Pricing + Duration + Team. Most state-coupled section (per-staff overrides cross-reference variants/tiers/members). Defer until next time it needs feature work.

### ✅ Phases 6-8 — Cross-cutting refactors (DONE 2026-05-02)

| File | Before | After | Reduction |
|---|---|---|---|
| `forms/FormRenderer.tsx` | 1,648 | 581 | **-65%** |
| `editor/FormEditor.tsx` | 1,373 | 1,311 | -5% (style-options extracted) |
| `app/onboarding/page.tsx` | 836 | 357 | -57% |
| `modules/teams/TeamsPage.tsx` | 932 | 254 | **-73%** |
| `modules/settings/GeneralSettings.tsx` | 730 | 314 | -57% |
| `app/page.tsx` (landing) | 778 | 145 | **-81%** |
| `bookings/CalendarView.tsx` | 1,269 | 1,138 | -10% |
| `services/ServiceDrawer.tsx` | 2,577 | 1,057 | **-59%** (full extraction) |

Sub-files created across these phases:
- `forms/FieldRow.tsx`, `forms/FormChrome.tsx`, `forms/ThemeScope.tsx`, `forms/renderer-helpers.ts`, `forms/renderer-types.ts`
- `app/onboarding/_components/` (7 files: PillOption, PersonaStep, StructuralStep, MultiSelectStep, SummaryStep, SignupStep, constants)
- `modules/teams/` (4 sub-files: TeamMemberForm, InviteMemberModal, SocialInput, TikTokIcon, constants)
- `modules/settings/` (5 sub-files: SettingsSection, SettingsLogoUpload, ColorPicker, BrandPreview, AppearanceSection, general-helpers)
- `components/landing/` (3 sub-files: AddonsGrid, ComparisonToggle, AIChatDemo)
- `bookings/calendar-helpers.ts`
- `services/drawer/` (8 files: types, initial-state, Section, MarketingSection, BundleSection, AddOnsSection, BookingRulesSection)
- `forms/editor/style-options.tsx`

### ✅ Phase 9 — Final senior-dev pass (DONE 2026-05-02)

After research on React form patterns and Next.js route handler conventions, applied a "real driver?" lens to the deferred list:

| File | Real driver? | Verdict |
|---|---|---|
| `services/ServiceDrawer.tsx` (was 1,057) | Yes — operator opens dozens/day | **Done. 1,057 → 535 (-49%).** Basics, Duration, Team, Pricing blocks extracted via props pattern. Per-staff overrides handled by passing setters as props (no useReducer migration). Total session reduction: **2,577 → 535 (-79%)**. |
| `app/api/public/book/basket/route.ts` (805) | No — works, no tests planned | **Leave** in Phase 9; revisited in Phase 10 (helpers extracted to `lib/server/public-booking.ts`). |
| `landing/CinematicDemo.tsx` (1,522) | No — single Framer Motion choreography | Originally **Leave**. **Reversed in Phase 10:** had real nested components rendering separately, not one choreography. Split into `cinematic/` sub-folder; barrel kept for backwards compat. |
| `landing/ScrollMechanic.tsx` (1,434) | No — single scroll choreography | Originally **Leave**. **Reversed in Phase 10:** data + helpers + inline SVG icons extracted to `scroll-mechanic-data.tsx`. JSX choreography intact. |
| `landing/HeroSplit.tsx` (808) | No — single hero animation | **Leave.** Verified Phase 10. |
| `editor/FormEditor.tsx` (1,311) | No — mode-switched tabs share state | **Leave** until next feature work. |
| `bookings/CalendarView.tsx` (1,138) | No — large grids with drag/scroll commonly cohesive | **Leave.** Risk > reward. |
| `lib/seed-data.ts` (958) | No — dev-only fixture, prod-guarded | **Leave.** Re-verified Phase 10 — splitting trades single-file Cmd+F navigation for import-graph complexity in code that never ships. |
| `lib/onboarding.ts` (806) | No — cohesive domain logic | Originally **Leave**. **Reversed in Phase 10:** option arrays consumed by other modules → split into `onboarding-options`, `onboarding-actions`, `onboarding-service-templates`, `onboarding-types`. Now 401 lines as a re-export shim. |
| `app/book/[slug]/page.tsx` (825) | No — single booking flow | **Leave.** |

**Senior-dev principle that drove the call:** refactor when there's a real cost (testability, shared use, edit pain, onboarding friction). Don't refactor for vanity metrics. The Phase 10 reversals applied the same lens — if a "Leave" file turned out to have a real driver on second look (multiple components, cross-module reuse), it got split; if it didn't (seed-data, HeroSplit), it stayed.

Sub-files added in Phase 9 (`services/drawer/`):
- BasicsBlock.tsx (70), DurationBlock.tsx (104), TeamBlock.tsx (179), PricingBlock.tsx (317)

### ✅ Phase 10 — Deferred-file audit + ServiceDrawer cleanup (DONE 2026-05-02)

Re-examined every "Leave" verdict from Phase 9 with the same "real driver?" lens:

| File | Outcome |
|---|---|
| `landing/CinematicDemo.tsx` | Split — 1,522 → 20 line barrel + 5 sub-files in `cinematic/` (data, ModulePickerDemo, FeatureCustomizeDemo, MobileFeatureDemo, DemoContent) |
| `landing/ScrollMechanic.tsx` | Data layer extracted — 1,434 → 1,255; new `scroll-mechanic-data.tsx` (202 lines) |
| `lib/onboarding.ts` | Split — 806 → 401 line shim + 4 per-concern files (options, actions, service-templates, types) |
| `lib/seed-data.ts` | **Held.** Dev-only fixture, prod-guarded, single-file Cmd+F is the workflow. No driver. |
| `app/api/public/book/basket/route.ts` | Helpers extracted to `lib/server/public-booking.ts` (465 lines). Route still 805 due to inline validation; revisit when adding tests. |
| `services/drawer/BookingRulesSection.tsx` | Further split — 768 → 566; pulled out `IntakeSection`, `PatchTestSection`, `WhereSection`, `PaymentsSection` (combined Deposits + Cancellation) |

Lint cleanup pass: removed 7 unused imports + 1 dead helper (`subtractIntervals` in `lib/calendar/utilization.ts`) + 1 redundant lint suppression. Fixed 1 `react-hooks/set-state-in-effect` error in `services/ServicesPage.tsx` by replacing the sync useEffect with a single `exitSelectionMode` callback wired into all dismissal points.

**Final state: typecheck clean, lint clean.**

### Phase 6 — Landing page (optional, 1 day)

`CinematicDemo.tsx` (1,522) and `ScrollMechanic.tsx` (1,434) are landing-page bling. Lower priority. Tackle when they actively block landing-page changes.

### Phase 7 — API route audit (half day)

`src/app/api/public/book/basket/route.ts` (805 lines) is a single route handler. Extract business logic into `src/lib/server/booking-basket.ts`. Route file should be < 100 lines, just request parsing + delegation.

---

## 4. File organization rules (going forward)

### Top-level layout (pinned)

```
src/
  app/                      Next.js routes only. Page files thin.
    api/                    Route handlers. < 100 lines each.
    (route)/page.tsx        Pages thin (<200 lines), import from components/.
  components/
    ui/                     Pure design system. No business logic.
    modules/<domain>/       Per-tab UI. Sub-folders for sub-views.
    forms/                  Cross-cutting form primitives.
    landing/                Marketing site only. Quarantined.
    providers/              Context/provider wrappers.
  hooks/                    Cross-domain React hooks.
  lib/
    db/<entity>.ts          Supabase CRUD wrappers. One per table.
    services/               Domain logic for services tab.
    forms/                  Domain logic for forms tab.
    calendar/               Domain logic for calendar/booking.
    server/                 Server-only helpers (cron, public flows).
    integrations/           External API wrappers (Stripe, Twilio, Resend).
    auth/                   Auth helpers.
    format/                 Display formatting (dates, currency).
  store/                    Zustand stores. One per domain.
  types/
    models/<domain>.ts      Type definitions split by domain.
    models/index.ts         Barrel export.
supabase/
  migration.sql             Single source of truth for schema.
  *.sql                     Backfill / hotfix scripts. Date-prefixed.
e2e/                        Playwright specs.
```

### Naming

| Thing | Convention | Example |
|---|---|---|
| React component file | PascalCase.tsx | `ServiceDrawer.tsx` |
| Hook file | camelCase, `use` prefix | `useRealtimeSync.ts` |
| Lib / store file | kebab-case.ts | `booking-cart.ts` |
| Type file | kebab-case.ts | `service.ts` |
| Test file | `*.test.ts` co-located in `__tests__/` | `services/__tests__/category.test.ts` |
| API route | folder name = URL segment | `app/api/public/inquiry/route.ts` |
| Migration / SQL script | `YYYY-MM-DD-<slug>.sql` | `2026-05-02-add-form-versions.sql` |

### Hard limits (enforce in PR review)

| Thing | Limit | Action if exceeded |
|---|---|---|
| Component file | 400 lines | Split into sub-components, same folder |
| Page component | 200 lines | Move logic into `components/modules/<domain>/` |
| API route handler | 100 lines | Move logic into `src/lib/server/` |
| Zustand store | 300 lines | Split into slices, compose in one store file |
| Type file | 300 lines | Split by domain |
| Function | 50 lines | Extract helpers |
| Function arguments | 4 | Pass an object |

### Folder ownership rule

If a folder has 3+ files of the same kind (Modal, Drawer, Form), make a sub-folder. Example: `services/` had 6 files; should be `services/{drawer,preview,modals}/`.

---

## 5. The feature workflow (every new feature, every time)

```
1. Type first
   Add types to src/types/models/<domain>.ts

2. Schema
   Add migration to supabase/migration.sql with date comment.
   Verify RLS: every new table needs `workspace_id` + policy.

3. DB layer
   Create or extend src/lib/db/<entity>.ts.
   Functions: list, get, create, update, archive.
   Add at least one happy-path test in __tests__/.

4. Store
   Create or extend src/store/<entity>.ts.
   Pattern: optimistic update → DB call → rollback on error.

5. UI
   Page in src/app/dashboard/<slug>/page.tsx (thin).
   Components in src/components/modules/<domain>/.
   Every component < 400 lines.

6. E2E
   Add a Playwright spec to e2e/ covering the happy path.

7. Hygiene before PR
   npm run typecheck && npm run lint && npm run test && npm run test:e2e
   Check no new file > 400 lines: find src -name "*.tsx" | xargs wc -l | sort -rn | head -10

8. PR
   Title: <type>(<scope>): <verb-led description>
   types: feat, fix, refactor, chore, docs, test
   example: feat(services): add membership debit on booking
```

---

## 6. Server vs Client Components — the missing rule

**Current state: 226 `"use client"` files, 0 `"use server"`.** You're using Next.js App Router but treating everything as a client app. This means:

- All your pages ship to the browser as JS bundles, even when they don't need to.
- Initial page loads are slower than they need to be.
- You're missing Server Actions, which would replace many of your `/api/*` routes with simpler form-action functions.

### Why a pilot conversion was deferred

Started a pilot in Phase 10 — looked at `app/dashboard/page.tsx` and concluded that this isn't a 1-page pilot. The dashboard reads from 7 Zustand stores. Converting to Server Component means:

1. Fetch initial data on the server from Supabase (`listBookings`, `listClients`, etc.)
2. Pass as props to a thin Client island
3. Replace `useStore()` calls with prop reads
4. Move mutations from `store.update()` → Server Actions
5. Delete the Zustand store (or keep it for optimistic UI only)

Step 4-5 means rewriting the optimistic-update pattern that exists across all 12 stores. That's not a pilot, it's an architectural migration. **Phase 11 candidate, not review-blocking.**

### The rule going forward

**Default to Server Components. Add `"use client"` only when the file uses one of:**

- `useState`, `useEffect`, `useRef`, `useReducer`
- Event handlers (`onClick`, `onChange`, `onSubmit`)
- Browser APIs (`window`, `localStorage`, `navigator`)
- Zustand store hooks
- Framer Motion components
- Custom hooks that use any of the above

**Pattern:** Make the page a Server Component that fetches initial data from Supabase, then pass data as props to a small Client Component island for interactivity.

```tsx
// app/dashboard/services/page.tsx — Server Component (no "use client")
import { listServices } from "@/lib/db/services"
import { ServicesPage } from "@/components/modules/services/ServicesPage"

export default async function Page() {
  const services = await listServices()
  return <ServicesPage initialServices={services} />
}
```

This is a slow migration, not a big-bang refactor. Apply the rule only to *new* pages and *refactored* pages. Don't touch the 141 existing ones until they need work.

---

## 7. Testing discipline

### What to test

| Layer | What to test | Tool |
|---|---|---|
| `src/lib/db/*.ts` | Snake/camel mapping, error handling | Vitest |
| `src/lib/services/*.ts`, `src/lib/forms/*.ts` | Business logic, edge cases | Vitest |
| API routes (`src/app/api/*`) | Auth checks, validation, happy path | Vitest |
| Critical user flows | Signup → onboarding → first form submit → first inquiry | Playwright |

### Coverage target

Not 100%. Target: **every PR adds at least one test**. Over time, the lib/ layer should be near-complete; UI components only need tests for genuinely complex logic.

### Run before every PR

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e   # if you touched pages or API routes
```

---

## 8. Integration discipline (the rule that stops bloat)

You have wrapper code for Stripe, Twilio, Resend, Nylas, Meta, Anthropic. **None are needed yet.** The rule:

> An integration only gets API keys and goes live when a real user is actively blocked without it.

| Integration | Wire it when |
|---|---|
| Resend | A real user submits an inquiry and asks why they didn't get a confirmation email |
| Stripe | A real user wants to take a deposit on a booking |
| Twilio | A real user asks for SMS booking reminders |
| Nylas | A real user has more than 5 booked appointments per day |
| Anthropic (inbox draft-reply) | A real user has more than 10 inquiries per day to triage |

Until then, leave the wrapper code dormant. Don't delete it (you'll want it later), but don't waste a Friday wiring it up "just in case".

---

## 9. Database discipline

### RLS rule (non-negotiable)

Every table must have:

1. A `workspace_id uuid not null` column.
2. An index on `workspace_id`.
3. A policy: `using (workspace_id = get_my_workspace_id())`.
4. A `WITH CHECK` clause on inserts to prevent cross-tenant writes.

Test it: as User A, attempt a write with User B's `workspace_id`. Should fail.

### Migration discipline

- One source of truth: `supabase/migration.sql`.
- Date-comment every change: `-- 2026-05-02: add form_versions table`.
- Hotfix scripts go in `supabase/` with date-prefix filenames, then folded into `migration.sql` once verified in prod.
- Never `DROP COLUMN` without a 2-week deprecation window with the column unused first.

### Snake/camel mapping

DB is snake_case, TS is camelCase. Mapping happens in `src/lib/db/<entity>.ts`. Components must never see snake_case. If you find a snake_case property in a component, fix the DB layer.

---

## 10. Weekly hygiene checklist (15 minutes, every Friday)

```
[ ] git log --oneline -20             — any commits without tests? backfill them
[ ] npm run typecheck                  — must pass
[ ] npm run test                       — must pass
[ ] npm run test:e2e                   — must pass
[ ] find src -name "*.tsx" | xargs wc -l | sort -rn | head -10
    Anything new over 400? Refactor before next feature.
[ ] grep -rn "TODO\|FIXME" src/       — pick one, do it
[ ] grep -rn "console.log" src/        — remove any new ones
[ ] Review supabase/migration.sql     — any changes since last week need RLS check?
```

---

## 11. PR checklist template

Copy this into every PR description:

```
## Changes
- [ ] Types added to src/types/models/<domain>.ts
- [ ] Migration added to supabase/migration.sql (with date comment)
- [ ] DB layer (src/lib/db/) updated
- [ ] Store updated with optimistic pattern
- [ ] No new file over 400 lines
- [ ] No new "use client" without justification
- [ ] At least one test added
- [ ] typecheck + lint + test + e2e pass locally
- [ ] No new console.log / TODO / FIXME
- [ ] RLS verified for any new table
- [ ] All affected .md files updated (README, CLAUDE.md, REPO_GUIDE.md)
```

---

## 12. Documentation discipline (keep all .md files in sync)

The repo has 3 markdown files. Each has a specific purpose. **If you change behavior in code, you must update the matching doc in the same PR.** Out-of-date docs are worse than no docs.

### The 3 docs and what each owns

| File | Purpose | Update when |
|---|---|---|
| `README.md` | Quick-start for a brand-new developer cloning the repo | Setup steps change, env vars added, scripts renamed |
| `CLAUDE.md` | Architecture overview for AI assistants and future-you | Module list changes, tech stack changes, conventions evolve |
| `REPO_GUIDE.md` | Working rules, refactor plan, hygiene checklist (this file) | Cleanup plan progresses, new rules added, metrics change |

### When to touch each doc

| Code change | Update README | Update CLAUDE.md | Update REPO_GUIDE.md |
|---|---|---|---|
| New env var | Yes | No | No |
| New `npm` script | Yes | Yes | No |
| New core module / tab | No | Yes | No |
| New addon module | No | Yes | Yes (Phase 1 table) |
| New top-level folder in `src/` | No | Yes | Yes (Section 4 layout) |
| New convention or rule | No | Yes | Yes |
| Refactor phase complete | No | If structure changed | Yes (mark phase done) |
| New integration wired | Yes | Yes | Yes (Section 8 table) |
| New RLS pattern | No | No | Yes (Section 9) |
| Health metrics change | No | No | Yes (Section 2 table) |

### Doc update workflow (every PR)

```
1. Make the code change.
2. Open the relevant docs side by side (use grep to find references):
   grep -ln "<thing-you-changed>" *.md
3. Update each doc that mentions the thing.
4. If a rule in REPO_GUIDE.md no longer reflects reality — fix the rule, don't ignore it.
5. Add to PR checklist: "[ ] All affected .md files updated"
```

### Monthly doc audit (1st of each month, 20 min)

```
[ ] Read README.md end to end. Does setup still work on a fresh clone?
[ ] Read CLAUDE.md. Does it match the actual src/ structure?
    Run: ls src/components/modules/ — match the tab list?
[ ] Read REPO_GUIDE.md Section 2. Re-run health checks, update numbers.
[ ] Read REPO_GUIDE.md Section 3. Mark completed phases. Add new ones.
[ ] Last-modified date at top of each doc — update it.
```

### Doc style rules

- **Lead with the answer.** No preamble.
- **Tables for comparisons.** Lists for sequences.
- **Code blocks for commands.** Always copy-pasteable.
- **Date stamps at the top of any doc that gets revised.** Format: `Last updated: YYYY-MM-DD`.
- **No marketing language.** This is internal documentation, not a sales page.
- **Link instead of duplicating.** If something is documented in CLAUDE.md, link to it from REPO_GUIDE.md instead of restating.
- **Delete stale sections.** Don't leave "TODO: update this" — either update or delete.

### Adding a new .md file

Three rules:

1. **Justify the new file in commit message.** Why doesn't an existing doc cover this?
2. **Add it to the table at the top of Section 12.** Or it gets forgotten.
3. **Date stamp + owner at the top.** Same format as the others.

---

## 13. When in doubt

- **Big component getting bigger?** Stop. Split. Then continue.
- **Need a new integration?** Re-read Section 8. Is a real user blocked? If no, don't.
- **Confused about file location?** Find the closest existing parallel and copy its placement.
- **Tempted to skip a test?** That's how you get a 4,000-line FormsPage. Write the test.
- **Behavior changed but you didn't touch the docs?** Stop. Update the docs. Then ship.

---

## Appendix A — Sources for these conventions

- [Next.js Project Structure docs](https://nextjs.org/docs/app/getting-started/project-structure)
- [Next.js Server vs Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Zustand Slices Pattern](https://zustand.docs.pmnd.rs/learn/guides/slices-pattern)
- [Supabase RLS best practices](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices)
- [React component size guidance](https://eslint.org/docs/latest/rules/max-lines)
- [Next.js 16 colocation guide](https://makerkit.dev/blog/tutorials/nextjs-app-router-project-structure)
