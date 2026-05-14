## Context

The dual-theme system (Phase 1) added `data-theme` context scoping, ThemeProvider/ThemeToggle components, and CSS variable token mappings. Portal pages and BookingFlow were migrated. The dashboard side — structural components, all route pages, settings, and shared components — still uses hard-coded dark Tailwind classes (~1,300 instances across ~50 files).

When the dashboard is toggled to light mode (`.dashboard-light`), these hard-coded classes won't adapt. All files in this change read their theme from `data-theme="dashboard"` on `<html>`, so the only change needed is replacing literal class names with CSS variable tokens.

## Goals / Non-Goals

**Goals:**
- Migrate all ~50 files with hard-coded dark classes to CSS variable tokens
- Preserve exact visual appearance in dark mode (no regressions)
- Enable correct rendering in dashboard light mode after toggle
- Follow consistent token mapping across all files
- Use replaceAll where safe; handle edge cases (hover states, nested selectors) individually

**Non-Goals:**
- Any functional or behavioral changes to components
- CSS variable definition changes (globals.css already has all theme tokens from Phase 1)
- Any changes to portal-side files (already done in Phase 1)

## Decisions

### 1. Token Mapping Table (Single Source of Truth)

All files use the same mapping:

| Literal Class | CSS Variable Token | Notes |
|--------------|--------------------|-------|
| `bg-gray-950` | `bg-background` | Page-level backgrounds |
| `bg-gray-900` | `bg-card` | Card/surface backgrounds |
| `bg-gray-800` | `bg-muted` | Nested surface backgrounds |
| `bg-gray-700` | `bg-muted` | Nested surfaces (step circles, etc.) |
| `bg-gray-50` | `bg-muted` | Rare in dashboard; portal-side |
| `bg-white` | `bg-card` | Rare in dashboard; portal-side |
| `text-white` | `text-foreground` | Default text |
| `text-gray-100` | `text-foreground` | High-emphasis text |
| `text-gray-200` | `text-foreground/90` | Near-foreground emphasis |
| `text-gray-300` | `text-muted-foreground` | Secondary text |
| `text-gray-400` | `text-muted-foreground` | Muted/hint text |
| `text-gray-500` | `text-muted-foreground/80` | Low-emphasis hints |
| `text-gray-600` | `text-muted-foreground` | Body text |
| `text-gray-700` | `text-foreground/80` | Medium-emphasis text |
| `text-gray-900` | `text-foreground` | Headings |
| `border-gray-600` | `border-border` | Borders |
| `border-gray-700` | `border-border` | Standard borders |
| `border-gray-800` | `border-border` | Subtle borders |
| `bg-blue-600` | `bg-primary` | Primary buttons, badges |
| `hover:bg-blue-700` | `hover:bg-primary/90` | Primary button hover |
| `bg-blue-500` | `bg-primary` | Solid primary fills |
| `bg-blue-500/20` | `bg-primary/20` | Badge backgrounds |
| `text-blue-400` | `text-primary` | Primary-colored text |
| `text-blue-500` | `text-primary` | Primary-colored text |
| `text-blue-300` | `text-primary/80` | Subtle primary text |
| `border-blue-500` | `border-primary` | Primary borders |
| `border-blue-500/30` | `border-primary/30` | Subtle primary borders |
| `bg-blue-600/15` | `bg-primary/15` | Light primary fills |
| `bg-blue-600/20` | `bg-primary/20` | Light primary fills |
| `hover:bg-blue-500/20` | `hover:bg-primary/20` | Hover state |
| `hover:text-blue-400` | `hover:text-primary` | Hover state |
| `hover:bg-blue-400/10` | `hover:bg-primary/10` | Hover state |
| `ring-blue-500` | `ring-primary` | Focus rings |
| `ring-blue-600` | `ring-primary` | Focus rings |
| `bg-red-600` | `bg-destructive` | Destructive buttons |
| `hover:bg-red-700` | `hover:bg-destructive/90` | Destructive hover |
| `hover:bg-red-500` | `hover:bg-destructive/90` | Destructive hover |
| `text-red-400` | `text-destructive/80` | Destructive text |
| `text-red-300` | `text-destructive/60` | Subtle destructive |
| `border-red-800` | `border-destructive/50` | Destructive border |
| `bg-red-950` | `bg-destructive/20` | Destructive bg |
| `bg-red-950/50` | `bg-destructive/10` | Destructive bg |
| `hover:text-red-400` | `hover:text-destructive/80` | Destructive hover |
| `hover:text-red-300` | `hover:text-destructive/60` | Destructive hover |
| `hover:bg-red-400/10` | `hover:bg-destructive/10` | Destructive hover bg |
| `focus:text-red-300` | `focus:text-destructive/60` | Destructive focus |

**Kept as semantic** (work in both light and dark):
- `bg-green-*`, `text-green-*`, `border-green-*` (success)
- `bg-amber-*`, `text-amber-*`, `border-amber-*` (warning)
- `bg-yellow-*`, `text-yellow-*`, `border-yellow-*` (pending)
- `text-emerald-*`, `bg-emerald-*` (miscellaneous success)
- `text-green-300` (used in settings/api)
- `bg-purple-600` (used in appointments detail page)

### 2. Migration Phasing

Files grouped by dependency order (leaf → root):

1. **Shared components** (no dashboard page imports them)
2. **Dashboard pages** (load self-contained)
3. **Settings pages** (load self-contained, template-like patterns)
4. **Structural components** (sidebar, header — last because they wrap everything)

### 3. Replace Strategy

- `replaceAll` for exact class matches (`bg-gray-900` → `bg-card`)
- Per-line edits for multi-class strings that need partial replacement
- Specific handling for status badge patterns (`bg-blue-500/20 text-blue-400 border-blue-500/30` → `bg-primary/20 text-primary border-primary/30`)
- Specific handling for button patterns (`bg-blue-600 hover:bg-blue-700 text-white` → `bg-primary hover:bg-primary/90 text-primary-foreground`)

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| replaceAll on short strings like `text-white` could match in JavaScript string values, not just className | Always verify with grep after replaceAll; fix edge cases 
| Some components use CSS variable-compatible Shadcn primitives (Card, Button) but wrapper divs use literal classes | Only migrate literal wrapper classes — Shadcn internals already use CSS vars
| `focus:bg-gray-700` pattern (settings select items) has no direct CSS variable equivalent | Use `focus:bg-accent` which maps to same visual
| `bg-gray-800/50`, `bg-gray-900/40` opacity variants need opacity-aware tokens | Use `bg-muted/50`, `bg-card/40` respectively
| `hover:border-gray-600` — no direct hover border token | Use `hover:border-border` which will subtly darken in light mode
| Large number of files makes review difficult | Group by capability; each can be reviewed independently
