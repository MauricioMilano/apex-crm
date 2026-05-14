## Why

The app has two visual contexts (dashboard dark, portal light) but no shared theming system. Every component hard-codes Tailwind color classes. The `BookingFlow` component — shared between both contexts — is locked to dark mode, forcing the portal to wrap it in an ugly dark container hack (`bg-gray-900 rounded-xl border border-gray-700 p-6`). 

This doesn't scale. Adding more shared components means more theme conflicts. Switching dashboard or portal to the opposite theme is impossible. CSS variables from Shadcn exist but are unused.

## What Changes

- **CSS variable system extended** with `data-theme="dashboard"` and `data-theme="portal"` context scoping, each with its own light/dark defaults and toggle
- **BookingFlow migrates** from hard-coded Tailwind dark classes to CSS variable tokens — rendering correctly in both portal and dashboard without wrapper hacks
- **All portal pages migrate** from literal colors (`bg-white`, `text-gray-900`) to CSS variable tokens (`bg-background`, `text-foreground`)
- **Theme toggle** added to both layouts (dashboard defaults dark, portal defaults light; each can switch independently)
- **Portal book page** simplified — removes the dark container hack, just renders `<BookingFlow />`

## Capabilities

### New Capabilities

- `dual-theme-system`: Centralized theme infrastructure with context-aware light/dark modes
- `theme-toggle`: Per-context theme switching with persisted preference

### Modified Capabilities

All existing portal pages and the BookingFlow component — they become theme-agnostic via CSS variable migration.

## Scope

| Area | Change |
|------|--------|
| **CSS** | `globals.css` — add `[data-theme="portal"]`, `[data-theme="dashboard"]`, `.portal-dark`, `.dashboard-light` blocks with context-specific tokens |
| **Layouts** | Both root layouts set `data-theme` on `<html>`; each gets a theme toggle |
| **BookingFlow** | ~968 lines — every Tailwind color class replaced with CSS variable token |
| **Portal pages** | 7 pages migrated (dashboard, appointments, book, profile, plans, subscriptions, login, register) |
| **Dashboard pages**| Only where shared components consume them (BookingFlow context already matches) |
| **New component** | `src/components/ui/theme-toggle.tsx` — lightweight context-aware toggle |
