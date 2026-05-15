## Why

The codebase lacks a centralized UI design system. While Shadcn/UI and CSS variable tokens exist, they are inconsistently applied across pages. Components use hardcoded Tailwind colors (`bg-gray-*`, `text-white`), spacing is ad-hoc, loading/empty/error states are non-uniform, and critical UI primitives (`Skeleton`, `loading.tsx`, `error.tsx`, `not-found.tsx`) are either unused or missing. This causes visual drift between dashboard and portal, makes theme switching unreliable, and increases maintenance overhead.

A root `design.md` has been created codifying all patterns. This change implements it across every page.

## What Changes

- All pages and feature components migrate from literal Tailwind color classes to CSS variable tokens (`bg-background`, `text-foreground`, `border-border`, etc.)
- Hardcoded gray colors in `forms/` components replaced with theme variables
- `Skeleton` component adopted universally for loading states
- `loading.tsx` boundaries added to all route groups
- `error.tsx` boundaries added to auth and portal route groups
- `not-found.tsx` pages added to all route groups
- Empty, loading, and error states standardized per design.md templates
- Spacing, typography, and component composition aligned with design.md
- No functional changes — pure UI standardization

## Capabilities

### New Capabilities
- `ui-standards`: Centralized UI design system with theme token usage, spacing conventions, typography hierarchy, state handling patterns, and component rules — everything codified in `design.md`

### Modified Capabilities
- `dashboard-pages-theme`: Updated to use CSS variable tokens instead of hardcoded dark classes
- `shared-dashboard-components-theme`: Updated to use CSS variable tokens
- `settings-pages-theme`: Updated to use CSS variable tokens
- `dashboard-structural-theme`: Updated to use CSS variable tokens
- `email-templates`: Style consistency with new design system
- `smtp-config`: Style consistency with new design system
- `avatar-upload`: Style consistency with new design system
- `data-driven-navigation`: Maintained as-is (already clean)
- `internal-profile`: Style consistency with new design system
- `client-profile`: Style consistency with new design system

## Impact

- **50+ files** across `src/components/`, `src/app/(dashboard)/`, `src/app/(client-portal)/`, and `src/app/(auth)/`
- No API or data layer changes
- No Prisma schema changes
- No dependency changes
- Visual behavior preserved — same layout, same UX, only the token references change
- Theme switching becomes reliable (light/dark in both dashboard and portal)
