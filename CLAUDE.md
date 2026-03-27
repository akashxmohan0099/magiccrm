# MAGIC CRM — Development Guide

## Architecture

Feature-primitive composable module system. Modules are NOT hardcoded — they are compositions of 10 feature primitives (table, form, calendar, kanban, etc.) configured by ModuleSchema definitions. Onboarding answers drive Kimi AI to assemble features into persona-specific modules.

### Three Layers

```
Layer 3: Module Assembly (persona selection + AI tuning)
Layer 2: Module Schema (fields, views, status flows, actions)
Layer 1: Feature Primitives (10 generic renderers)
```

### Key Directories

```
src/
  app/            — Next.js App Router pages + API routes
  components/
    modules/      — Legacy module pages (31 modules)
    primitives/   — Schema-driven renderers (SchemaTable, SchemaForm, etc.)
    ui/           — Shared UI components (DataTable, KanbanBoard, Modal, etc.)
    onboarding/   — Onboarding step components
  store/          — 40 Zustand stores (all persist to localStorage)
  lib/
    module-schemas/  — Base schemas + persona variants
    workspace-blueprints/ — Blueprint resolver pipeline
    integrations/  — Third-party API clients
    db/            — Supabase database operations
  hooks/          — Custom React hooks
  types/          — TypeScript type definitions
```

### Data Flow

```
Onboarding → assembleWorkspaceSync() → assembled-schemas store
→ useModuleSchema(moduleId) → legacy component reads labels
→ Sidebar reads from assembled schemas for personalized labels
→ Legacy components render with full functionality + schema labels
```

### Schema System

- Base schemas: `src/lib/module-schemas/base/` (8 modules)
- Persona variants: `src/lib/module-schemas/variants/` (12 personas)
- Validator: `src/lib/schema-validator.ts` (4-level validation)
- Assembly: `src/lib/assembly-pipeline.ts`

Schema renderer is opt-in via `?renderer=schema`. Production uses legacy components + `useModuleSchema` hook for personalized labels.

## Tech Stack

- Next.js 16.1.7 (App Router)
- React 19.2.3
- TypeScript 5 (strict mode)
- Tailwind CSS 4
- Zustand 5 (state management, 40 stores)
- Framer Motion 12 (animations)
- Supabase (database + auth)
- Kimi / Moonshot AI (onboarding tuning)
- Claude / Anthropic (AI builder + insights)

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run test         # Run vitest tests
npm run test:watch   # Watch mode tests
```

## Environment Variables

See `.env.local.example` for all required variables. Critical ones:
- `NEXT_PUBLIC_APP_URL` — Required for OAuth callbacks, invoice links, sitemap
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase connection
- `KIMI_API_KEY` — Onboarding AI questions + assembly tuning
- `ANTHROPIC_API_KEY` — AI Builder + AI Insights

## Testing

381 tests across 11 test files. Run with `npx vitest run`.

Tests cover: schema validation, persona flows (12 personas), assembly pipeline, workspace blueprints, feature registry, cascade delete, rate limiting.

## Conventions

- Components: PascalCase files
- Hooks: camelCase with `use` prefix
- Lib/Store: kebab-case files
- Schema IDs match module registry IDs (e.g., `client-database`, `leads-pipeline`)
- All stores use Zustand `persist` middleware with versioned migrations
- Errors: centralized via `sync-error-handler.ts` + toast notifications
