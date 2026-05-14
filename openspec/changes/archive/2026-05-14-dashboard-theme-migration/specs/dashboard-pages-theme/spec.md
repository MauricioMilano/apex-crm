## Description

Migrate all dashboard route pages from hard-coded dark Tailwind classes to CSS variable tokens.

## Scope

- `src/app/(dashboard)/dashboard/page.tsx` — ~43 instances
- `src/app/(dashboard)/reports/page.tsx` — ~60 instances
- `src/app/(dashboard)/calendar/page.tsx` — ~45 instances
- `src/app/(dashboard)/appointments/page.tsx` — ~30 instances
- `src/app/(dashboard)/appointments/[id]/page.tsx` — ~78 instances
- `src/app/(dashboard)/leads/page.tsx` — ~13 instances
- `src/app/(dashboard)/leads/[id]/page.tsx` — ~86 instances
- `src/app/(dashboard)/forms/page.tsx` — ~49 instances
- `src/app/(dashboard)/forms/builder/[id]/page.tsx` — ~4 instances
- `src/app/(dashboard)/error.tsx` — ~10 instances

## Acceptance

- All pages render identically in dashboard dark mode
- All pages render correctly in dashboard light mode
- Status badges, buttons, cards, tables, and dialogs adapt to theme
