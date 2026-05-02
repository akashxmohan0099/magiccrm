# Review Handoff — Post-Refactor State

Date: 2026-05-02
Owner: Akash
Purpose: snapshot for self-review and then external review.

## TL;DR

The cleanup plan in `REPO_GUIDE.md` is done. Typecheck and lint are clean. Test count moved from 24 → 50 (hit the doc target). CI workflow includes typecheck + lint + tests + build. The Server Component migration is documented as deferred and explained why.

One regression caught and fixed during the verify-end-to-end pass: `PatchTestSection` was deleted during the BookingRules split but never re-wired into the drawer, leaving `requiresPatchTest` / `patchTestValidityDays` / `patchTestMinLeadHours` / `patchTestCategory` form fields with no UI to set them. Recreated the component and wired it back in between BookingRulesSection and IntakeSection.

## What changed since the original audit

| Headline | Before | Now |
|---|---|---|
| Files over 1,000 lines | 8 | 3 |
| `models.ts` | 1,458 lines | 41-line barrel + 15 domain files |
| `FormsPage.tsx` | 3,938 lines | 770 lines (-80%) |
| `ServicesPreview.tsx` | 2,983 lines | 666 lines (-78%) |
| `ServiceDrawer.tsx` | 2,577 lines | 535 lines (-79%) |
| `FormRenderer.tsx` | 1,648 lines | 581 lines (-65%) |
| `CinematicDemo.tsx` | 1,522 lines | 20-line barrel + 5 sub-files |
| `app/page.tsx` (landing) | 778 lines | 145 lines (-81%) |
| `TeamsPage.tsx` | 932 lines | 254 lines (-73%) |
| `lib/onboarding.ts` | 806 lines | 401-line shim + 4 per-concern files |
| Test files | 24 | 50 |
| `any` types | 1 | 1 |
| `console.log` | 8 | 8 (all in webhook routes, deliberate) |
| TODO/FIXME | 2 | 2 |

## What was deliberately NOT changed

| Item | Reason |
|---|---|
| `lib/seed-data.ts` (958 lines) | Dev-only, prod-guarded; single-file Cmd+F is the intended workflow. Splitting trades navigation for import-graph complexity. |
| `editor/FormEditor.tsx` (1,311 lines) | Tabbed editor; tabs share state. Splitting needs state lifting, which is real refactor not split. Defer to next feature work. |
| `bookings/CalendarView.tsx` (1,138 lines) | Large grid with drag/scroll; cohesive. Risk > reward. |
| `landing/HeroSplit.tsx` (808 lines) | Single hero animation. Splitting breaks timing. |
| `landing/ScrollMechanic.tsx` (1,255 lines) | Data extracted; choreography intact. JSX is one timeline. |
| `app/book/[slug]/page.tsx` (825 lines) | Single public booking flow. |
| Server Component migration | Architectural change, not a refactor. See `REPO_GUIDE.md` Section 6 for the deferred-pilot rationale. |

## Standing gaps for the external reviewer to flag

1. **Test coverage covers high-risk layers, not full surface.** 50 test files for 441 src files. db-mapping (snake/camel), pricing math, conflict detection, patch-test gate, public-submission sanitisation, server sanitiser are covered. Page components, hooks (other than `useFormDraft`), and most server actions are not.
2. **226 `"use client"` files, 0 `"use server"`.** Whole app is treating App Router as a client app. Real fix is moving Zustand → Server Components + Server Actions. Not started.
3. **3 files still over 1,000 lines** (`forms/editor/FormEditor.tsx`, `landing/ScrollMechanic.tsx`, `bookings/CalendarView.tsx`). Each has a documented "leave" reason — reviewer should pressure-test those reasons.
4. **42 files over 400-line rule limit.** Most are page components or large form sections; not all are problems but the rule is being violated.
5. **CI exists** (`.github/workflows/ci.yml`) running typecheck + lint + tests + build, but is not enforcing the file-size rule from REPO_GUIDE Section 4. A reviewer might want a check that fails when a new file goes over 400 lines.
6. **Integrations dormant.** Stripe, Twilio, Resend wrappers exist but no API keys. Reviewer should confirm the "wire only when blocked" rule is the right call vs proactive setup.
7. **No RLS test fixture.** Section 9 says "test it: as User A, attempt a write with User B's workspace_id. Should fail." Nothing actually exercises this. A single Vitest spec against a local Supabase instance would close the highest-stakes gap in the codebase.

## Files the external reviewer should focus on

For architectural review:

- `REPO_GUIDE.md` — operating rules + cleanup history
- `CLAUDE.md` — architecture map
- `src/lib/db/clients.ts` — representative DB mapper (snake/camel + CRUD pattern)
- `src/store/services.ts` — representative Zustand store (optimistic update pattern)
- `src/app/api/public/book/route.ts` + `lib/server/public-booking.ts` — representative API route after lib extraction
- `src/components/modules/services/ServiceDrawer.tsx` + `services/drawer/` — representative refactor outcome (was 2,577 lines)
- `supabase/migration.sql` — schema, especially RLS policies

For code-quality review:

- Pick any file from the >400 list and check whether the "no real driver" justification holds
- Check that the split components don't leak their original file's smells into 8 sub-files

## Run before review

```
npm run typecheck    # currently passes
npm run lint         # currently passes
npm run test         # vitest, run on macOS — sandbox arm64 binaries differ
npm run test:e2e     # Playwright, only if pages or API routes touched
```

## Questions worth asking the external reviewer

1. Is the optimistic-update Zustand pattern compatible with the eventual Server Components migration? If not, what's the right migration sequence?
2. Is the "real driver?" refactor heuristic too lax? Specifically the `seed-data.ts` and `CalendarView.tsx` decisions to leave them.
3. RLS coverage — `migration.sql` has policies on every table, but is the test-as-User-A-write-User-B pattern actually exercised anywhere?
4. The `forms/starters.ts` (708 lines) is a big seed file like `seed-data.ts` but ships to prod. Same "leave" verdict, or should it be split?
5. Should the landing page (`landing/CinematicDemo.tsx`, `ScrollMechanic.tsx`, `HeroSplit.tsx`) live in a separate Next.js project entirely? Currently they bloat the dashboard bundle.
