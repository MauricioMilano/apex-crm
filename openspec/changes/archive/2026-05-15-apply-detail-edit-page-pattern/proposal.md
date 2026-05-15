## Why

Detail/edit pages across the CRM have inconsistent headers — some have a back button but no title, some have a title but no back button, some use the wrong icon, and spacing/margins vary page to page. The design system now defines a standardized pattern (§3.8), but no pages follow it yet. This creates visual friction and makes maintenance harder.

## What Changes

- Standardize all detail/edit page headers to the §3.8 pattern: `← Back | Page Title` on the left, action buttons on the right
- Normalize spacing, typography, and icon usage across 7 pages in dashboard, client portal, and settings
- Add a new `PageHeader` reusable component to `src/components/ui/` to prevent future drift
- Update the `ui-standards` spec to include the detail/edit page layout requirement

## Capabilities

### New Capabilities

- `page-header-component`: A reusable `PageHeader` React component that renders the §3.8 header pattern with configurable back navigation, title, subtitle, and right-side action slots

### Modified Capabilities

- `ui-standards`: Add a new requirement for detail/edit page headers to follow §3.8 pattern — back button with `ArrowLeft`, `text-xl font-semibold` title, right-aligned action buttons

## Impact

- `src/app/(dashboard)/leads/[id]/page.tsx` — restructure header
- `src/app/(dashboard)/clients/[id]/page.tsx` — restructure header
- `src/app/(dashboard)/appointments/[id]/page.tsx` — restructure header
- `src/app/(dashboard)/forms/builder/[id]/page.tsx` — replace breadcrumb with §3.8 header
- `src/app/(dashboard)/settings/email/templates/[id]/page.tsx` — add title + restructure
- `src/app/(client-portal)/profile/page.tsx` — add back button + action header
- `src/app/(client-portal)/book/page.tsx` — add back button + action header
- `src/components/ui/page-header.tsx` — new reusable component
- `design.md` — already updated with §3.8; no further changes needed
