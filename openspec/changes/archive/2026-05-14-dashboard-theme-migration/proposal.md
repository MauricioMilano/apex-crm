## Why

The dual-theme system (Phase 1) added `data-theme` context scoping + CSS variable tokens for the portal and BookingFlow. But the entire dashboard side — sidebar, header, all dashboard pages, all settings pages, and shared components — still uses hard-coded dark Tailwind classes (`bg-gray-900`, `text-white`, `border-gray-700`, etc.). When dashboard users toggle to light mode, these components won't adapt. ~1,300 instances across ~50 files need migration.

## What Changes

- All dashboard structural components (sidebar, header, nav, stats-card) migrate from literal dark Tailwind to CSS variable tokens
- All dashboard pages (dashboard home, reports, calendar, appointments, leads, forms) migrate their className strings
- All settings sub-pages (15+ files) migrate their className strings  
- All shared dashboard components (leads kanban/card/form, calendar grid, email components, payment modals, form builder, client panels) migrate their className strings
- No functional or behavioral changes — pure class name migration

## Capabilities

### New Capabilities
- `dashboard-structural-theme`: Dashboard layout shell — sidebar, header, navigation, stats card
- `dashboard-pages-theme`: All dashboard route pages (dashboard, reports, calendar, appointments, leads, forms, error)
- `settings-pages-theme`: All settings sub-pages (profile, team, services, plans, hours, email, webhooks, api, payment-methods, locations, lead-statuses)
- `shared-dashboard-components-theme`: Shared components used in dashboard context (calendar grid, leads, email, payments, form builder, client panels)

### Modified Capabilities
<!-- None — no spec-level requirements are changing, only implementation details (Tailwind class names) -->

## Impact

| Area | Change |
|------|--------|
| `src/components/dashboard/` (4 files) | ~49 class instances migrated |
| `src/app/(dashboard)/` pages (10+ files) | ~430 class instances migrated |
| `src/app/(dashboard)/settings/` (15 files) | ~468 class instances migrated |
| Shared `src/components/` (15+ files) | ~350 class instances migrated |
| **Total** | **~50 files, ~1,300 class instances** |
