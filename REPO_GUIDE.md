# MAGIC CRM — Repo Guide & Working Rules

Last updated: 2026-05-02
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

## 2. Current repo health (snapshot 2026-05-02)

| Metric | Value | Verdict |
|---|---|---|
| Total TS/TSX files | 337 | Healthy size for the feature surface |
| Test files | 24 | Thin. Should be 50+ for this size. |
| `any` types | 1 | Excellent |
| `console.log` left in | 8 | Low. Clean up before each release. |
| TODO/FIXME | 2 | Excellent |
| Files over 500 lines | 20 | **Problem area** |
| Files over 1000 lines | 8 | **Critical** |
| `"use client"` directives | 141 | **Architectural smell** — see Section 6 |
| `"use server"` directives | 0 | Server Actions completely unused |

### The 7 critical files (refactor priority order)

1. `src/components/modules/forms/FormsPage.tsx` — 3,938 lines
2. `src/components/modules/services/ServicesPreview.tsx` — 2,983 lines
3. `src/components/modules/services/ServiceDrawer.tsx` — 2,577 lines
4. `src/components/forms/FormRenderer.tsx` — 1,648 lines
5. `src/components/landing/CinematicDemo.tsx` — 1,522 lines
6. ~~`src/types/models.ts` — 1,458 lines~~ ✅ **Done 2026-05-02** — split into 15 domain files, models.ts is now a 41-line barrel
7. `src/components/landing/ScrollMechanic.tsx` — 1,434 lines
8. `src/components/modules/services/ServicesPage.tsx` — 1,353 lines

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

### Phase 4 — Services breakdown (2 days)

```
src/components/modules/services/
  ServicesPage.tsx           — list shell only (<300)
  list/
    ServicesGrid.tsx
    ServiceCard.tsx
  drawer/
    ServiceDrawer.tsx        — shell, tab state (<300)
    PricingTab.tsx
    ScheduleTab.tsx
    IntakeTab.tsx
    ResourcesTab.tsx
    PackagesTab.tsx
    AddOnsTab.tsx
  preview/
    ServicesPreview.tsx      — shell (<300)
    PreviewHeader.tsx
    PreviewServiceList.tsx
    PreviewBookingFlow.tsx
    PreviewPaymentStep.tsx
```

PR title: `refactor: split ServiceDrawer + ServicesPreview by tab`.

### Phase 5 — Inquiries + Bookings (1 day)

`InquiriesPage.tsx` (900) → split list, detail panel, status pipeline.
`BookingForm.tsx` (734) → split client picker, service picker, datetime, summary.
`CalendarView.tsx` (1,269) → already complex; separate week/day/month views into siblings.

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

**Current state: 141 `"use client"` files, 0 `"use server"`.** You're using Next.js App Router but treating everything as a client app. This means:

- All your pages ship to the browser as JS bundles, even when they don't need to.
- Initial page loads are slower than they need to be.
- You're missing Server Actions, which would replace many of your `/api/*` routes with simpler form-action functions.

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
