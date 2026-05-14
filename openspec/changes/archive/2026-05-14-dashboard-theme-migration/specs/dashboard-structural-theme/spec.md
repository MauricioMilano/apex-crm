## Description

Migrate dashboard structural components (sidebar, sidebar-nav, header, stats-card) from hard-coded dark Tailwind classes to CSS variable tokens.

## Scope

- `src/components/dashboard/sidebar.tsx` — ~12 class instances
- `src/components/dashboard/sidebar-nav.tsx` — ~8 class instances  
- `src/components/dashboard/header.tsx` — ~27 class instances
- `src/components/dashboard/stats-card.tsx` — ~2 class instances

## Acceptance

- Visual appearance in dashboard dark mode is unchanged
- Dashboard light mode renders these components correctly (no dark islands)
- Theme toggle switches both structural and page content consistently
