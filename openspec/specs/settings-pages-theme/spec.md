## Description

Migrate all settings sub-pages from hard-coded dark Tailwind classes to CSS variable tokens.

## Scope

- `src/app/(dashboard)/settings/layout.tsx`
- `src/app/(dashboard)/settings/page.tsx`
- `src/app/(dashboard)/settings/profile/page.tsx`
- `src/app/(dashboard)/settings/team/page.tsx`
- `src/app/(dashboard)/settings/services/page.tsx`
- `src/app/(dashboard)/settings/plans/page.tsx`
- `src/app/(dashboard)/settings/hours/page.tsx`
- `src/app/(dashboard)/settings/email/page.tsx`
- `src/app/(dashboard)/settings/email/templates/[id]/page.tsx`
- `src/app/(dashboard)/settings/webhooks/page.tsx`
- `src/app/(dashboard)/settings/api/page.tsx`
- `src/app/(dashboard)/settings/payment-methods/page.tsx`
- `src/app/(dashboard)/settings/locations/page.tsx`
- `src/app/(dashboard)/settings/lead-statuses/page.tsx`

## Acceptance

- All settings pages render identically in dashboard dark mode
- All settings pages render correctly in dashboard light mode
- Forms, tables, dialogs, and settings-specific components adapt to theme
