## Context

A root `design.md` at `/design.md` now exists as the single source of truth for all UI patterns — theme tokens, spacing, typography, component composition, state handling, effects, and navigation conventions. This change implements those standards across every page and feature component.

The codebase currently has ~50+ component/page files using various degrees of non-standard styling. The most critical pattern violations found during audit:

1. **Hardcoded Tailwind colors** instead of CSS variable tokens (especially `bg-gray-*`, `text-white`) 
2. **`src/components/forms/`** uses hardcoded dark grays (`bg-gray-800`, `text-gray-300`) — breaks theme switching
3. **`Skeleton`** component exists in `ui/skeleton.tsx` but is never used (0 usages)
4. **No `loading.tsx`** boundaries in any route group
5. **`error.tsx`** only exists in `(dashboard)/` — missing from `(auth)/` and `(client-portal)/`
6. **No `not-found.tsx`** files anywhere
7. Inconsistent empty state styling across feature components

## Goals / Non-Goals

**Goals:**
- Every page and feature component uses CSS variable tokens exclusively (no literal Tailwind color classes)
- `loading.tsx` boundaries in all 3 route groups
- `error.tsx` boundaries in all 3 route groups  
- `not-found.tsx` pages in all 3 route groups
- `Skeleton` component used consistently for loading skeletons
- Empty states, loading states, and error states follow templates from design.md
- Spacing and typography aligned with design.md conventions
- `forms/` components migrated to theme variables

**Non-Goals:**
- No layout or UX changes — same structure, same behavior
- No functional logic changes
- No new components or features
- No data model or API changes
- No color palette changes — only token indirection

## Decisions

### 1. Incremental by Page Group, Not by Concern

Each route group (auth, dashboard, portal) gets fully standardized in sequence, rather than doing "all loading.tsx first then all colors." This ensures each route group is complete and testable before moving on.

### 2. Root design.md is the Reference

The root `/design.md` is THE source. This change's `design.md` is just the implementation plan — all patterns, tokens, and templates live at root.

### 3. Forms Components Get Isolated Treatment

`src/components/forms/` is the most divergent (hardcoded dark grays). It gets its own task with a full token mapping pass. Since these are rendered in a dark-themed dialog-like panel, they use `bg-card`/`bg-muted`/`text-foreground` variants.

### 4. Skeleton Replaces Manual animate-pulse

The Shadcn `Skeleton` component (`animate-pulse rounded-md bg-primary/10`) replaces all manual `animate-pulse` divs. This is a drop-in replacement.

### 5. loading.tsx Uses Centered Spinner Pattern

All loading boundaries use a consistent pattern:
```tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
```

### 6. New error.tsx Uses design.md Template

Auth and portal error boundaries follow the dashboard pattern: styled card with destructive border, error message, and "Try again" reset button.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Theme regression in portal (currently light, may break during dark migration) | Each portal page tested in both light and dark after migration |
| Forms builder becomes unusable if token colors don't match the intended dark aesthetic | Preview after each field-editor/style-editor change; hardcoded gray palette already served the dark dialog intent — tokens will render identically |
| Large diff makes code review difficult | Changes organized by route group; each group is a separable commit |
| Missing a hardcoded color class | Grep for `bg-gray-`, `text-gray-`, `border-gray-`, `text-white`, `bg-white` after each phase — systematic sweep |
