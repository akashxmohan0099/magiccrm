# Magic CRM

Business management platform that builds a personalized workspace from your onboarding answers. Not a generic CRM — a workspace assembled specifically for how you work.

## Setup

```bash
npm install
cp .env.local.example .env.local  # fill in your keys
npm run dev
```

## Tech Stack

- Next.js 16 (App Router)
- React 19, TypeScript 5
- Zustand (state), Tailwind 4 (styling), Framer Motion (animations)
- Supabase (database + auth)
- Claude API (MagicAI assistant)
- Kimi/Moonshot (onboarding tuning)

See CLAUDE.md for architecture details.
