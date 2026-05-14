## Context

The app has two visual contexts — the internal dashboard and the client portal — that use completely different color schemes:

| Context | Current Theme | Background | Cards | Text |
|---------|--------------|------------|-------|------|
| Dashboard | Dark (hard-coded) | `bg-gray-950` | `bg-gray-900` | `text-white` |
| Client Portal | Light (hard-coded) | `bg-gray-50` | `bg-white` | `text-gray-900` |

The problem: **every component uses literal Tailwind color classes**. The only shared component (`BookingFlow`) is hard-coded to dark, forcing the portal to wrap it in an isolated dark container (`bg-gray-900 rounded-xl border border-gray-700`). CSS variables defined in `globals.css` (`--background`, `--foreground`, `--card`, etc.) exist but are virtually unused — all pages bypass them for hard-coded colors.

Goal: Create a dual-theme system where both dashboard and portal support light **and** dark modes, with a single source of truth for theme tokens.

---

## Goals / Non-Goals

### Goals

- Dashboard defaults to dark, supports light toggle
- Portal defaults to light, supports dark toggle
- All existing literal color classes replaced with CSS variable tokens
- `BookingFlow` becomes theme-agnostic (uses CSS variables, not hard-coded dark)
- Theme preference persisted per user
- Shadcn/UI components continue to work without modification
- Incremental migration path — no big-bang rewrite

### Non-Goals

- Per-organization theme customization (future capability)
- Custom color palettes beyond light/dark
- Animations or transitions for theme switching
- Server-side theme detection

---

## Decisions

### 1. Context-Based Theme via `data-theme` Attributes

**Decision**: Introduce two theme contexts using `data-theme` attributes on `<html>`, with the Shadcn CSS variable system extended for context-specific defaults.

```
data-theme="dashboard"    → dark-first defaults, .dashboard-light override
data-theme="portal"       → light-first defaults, .portal-dark override
```

**Structure**:

```
globals.css
├── :root                    → base tokens (unchanged)
├── .dark                    → base dark tokens (unchanged)
├── [data-theme="dashboard"] → dashboard-specific overrides (dark-first)
├── [data-theme="portal"]    → portal-specific overrides (light-first)
├── .dashboard-light         → dashboard variant override
└── .portal-dark             → portal variant override
```

Each route's root layout applies the appropriate `data-theme` on the `<html>` element. Users can toggle their variant within each context.

**Rationale**: Keeps the existing Shadcn system intact while adding context awareness. No new provider needed for pure CSS tokens — Shadcn components already use `bg-background`, `text-foreground`, etc. internally.

### 2. Portal Default Colors = Current Light Palette

The portal theme tokens will map to the existing hard-coded colors:

| CSS Variable | Portal (light default) | Equivalent Today |
|-------------|----------------------|------------------|
| `--background` | `0 0% 100%` | `bg-white` |
| `--foreground` | `0 0% 3.9%` | `text-gray-900` |
| `--muted` | `0 0% 96.1%` | `bg-gray-50` |
| `--muted-foreground` | `0 0% 45.1%` | `text-gray-500` |
| `--primary` | `221.2 83.2% 53.3%` | `blue-600` |
| `--card` | `0 0% 100%` | `bg-white` |
| `--border` | `0 0% 89.8%` | `border-gray-200` |

### 3. Dashboard Default Colors = Current Dark Palette

| CSS Variable | Dashboard (dark default) | Equivalent Today |
|-------------|-------------------------|------------------|
| `--background` | `0 0% 3.9%` | `bg-gray-950` |
| `--foreground` | `0 0% 98%` | `text-white` |
| `--muted` | `0 0% 14.9%` | `bg-gray-900` |
| `--muted-foreground` | `0 0% 63.9%` | `text-gray-400` |
| `--primary` | `221.2 83.2% 53.3%` | `blue-600` |
| `--card` | `0 0% 3.9%` | `bg-gray-900` |
| `--border` | `0 0% 14.9%` | `border-gray-700` |

### 4. Sidebar Tokens Relocated to Context Themes

Current sidebar tokens live in `:root` and `.dark` — they'll move to `[data-theme="dashboard"]` and `[data-theme="portal"]` respectively, so each context can have its own sidebar appearance.

### 5. BookingFlow Migrates to CSS Variable Tokens

All hard-coded Tailwind classes in `booking-flow.tsx` get replaced with their CSS variable equivalents:

| Current (hard-coded) | Replacement |
|---------------------|-------------|
| `bg-gray-800` | `bg-muted` or `bg-card` |
| `bg-gray-900` | `bg-background` |
| `text-white` | `text-foreground` |
| `text-gray-400` | `text-muted-foreground` |
| `border-gray-700` | `border-border` |
| `bg-gray-700` | `bg-muted` |

This makes BookingFlow render correctly in both light portal and dark dashboard without any wrapper hack.

### 6. No Global Theme Toggle — Context-Scoped

The dashboard layout gets a light/dark toggle in its header. The portal layout gets a light/dark toggle in its header. Each stores preference independently (separate keys in localStorage or user settings).

- `dashboard_theme` ∈ `{ dark, light }` — default `dark`
- `portal_theme` ∈ `{ light, dark }` — default `light`

### 7. Incremental Migration Strategy

Not all pages need to change at once. The approach:

1. Install `next-themes` or build a lightweight context-specific provider
2. Add `data-theme` attribute to both root layouts
3. Migrate BookingFlow (highest priority — fixes the wrapper hack)
4. Migrate portal pages one at a time replacing literal Tailwind → CSS variable tokens
5. Migrate dashboard pages where the same components are reused
6. Add theme toggle components

---

## Visual Model

```
┌─────────────────────────────────────────────────────────┐
│                    THEME ARCHITECTURE                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  globals.css                                             │
│  ┌─────────────────────────────────────────────────┐    │
│  │ :root { --background: 0 0% 100%; ... }          │    │
│  │ .dark { --background: 0 0% 3.9%; ... }          │    │
│  │ [data-theme="portal"] { ...light defaults... }   │    │
│  │ [data-theme="dashboard"] { ...dark defaults... } │    │
│  │ .portal-dark { @extend .dark overrides }         │    │
│  │ .dashboard-light { @extend :root overrides }     │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  Layouts apply data-theme                                │
│  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │ (dashboard)/layout   │  │ (client-portal)/layout│    │
│  │ <html data-theme=    │  │ <html data-theme=     │    │
│  │   "dashboard">      │  │   "portal">          │    │
│  │ Toggle → .dashboard- │  │ Toggle → .portal-dark │    │
│  │   light class       │  │   class               │    │
│  └──────────────────────┘  └──────────────────────┘    │
│                                                          │
│  All components use CSS variable tokens                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │ <div className="bg-background text-foreground    │    │
│  │              border-border">                     │    │
│  │   Renders correctly in BOTH themes              │    │
│  │ </div>                                          │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Component Migration Map

```
Literal Tailwind              CSS Variable Token
────────────────────────────────────────────────────
bg-white                      bg-background
bg-gray-50                    bg-muted
bg-gray-100                   bg-muted (alt)
bg-gray-900 (BookingFlow)     bg-card

text-gray-900                 text-foreground
text-gray-700                 text-foreground (secondary)
text-gray-600                 text-muted-foreground
text-gray-500                 text-muted-foreground
text-gray-400                 text-muted-foreground
text-white (BookingFlow)      text-foreground

border-gray-200               border-border
border-gray-300               border-border
border-gray-700 (BookingFlow) border-border

bg-blue-50                    bg-primary/10
text-blue-600                 text-primary
text-blue-700                 text-primary
border-blue-200               border-primary/20
border-blue-500               border-primary

bg-blue-600                   bg-primary
text-blue-400                 text-primary
hover:bg-blue-700             hover:bg-primary/90
```

---

## Theme Toggle Component

A small client component rendered in each layout header:

```tsx
// src/components/ui/theme-toggle.tsx
"use client"

interface ThemeToggleProps {
  context: "dashboard" | "portal"
}

// Reads current data-theme + variant class
// Toggles between default/variant
// Persists to localStorage
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/globals.css` | Add `[data-theme="portal"]`, `[data-theme="dashboard"]`, `.portal-dark`, `.dashboard-light` blocks |
| `src/app/(dashboard)/layout.tsx` | Set `data-theme="dashboard"` on `<html>`, add theme toggle |
| `src/app/(client-portal)/layout.tsx` | Set `data-theme="portal"` on `<html>`, add theme toggle |
| `src/components/appointments/booking-flow.tsx` | Replace all literal dark Tailwind classes with CSS variable tokens |
| `src/app/(client-portal)/portal/dashboard/page.tsx` | Migrate to CSS variable tokens |
| `src/app/(client-portal)/portal/appointments/page.tsx` | Migrate to CSS variable tokens |
| `src/app/(client-portal)/portal/book/page.tsx` | Remove dark wrapper, simplify to `<BookingFlow />` |
| `src/app/(client-portal)/portal/profile/page.tsx` | Migrate to CSS variable tokens |
| `src/app/(client-portal)/portal/plans/page.tsx` | Migrate to CSS variable tokens |
| `src/app/(client-portal)/portal/subscriptions/page.tsx` | Migrate to CSS variable tokens |
| `src/app/(client-portal)/portal/login/page.tsx` | Migrate to CSS variable tokens |
| `src/app/(client-portal)/portal/register/page.tsx` | Migrate to CSS variable tokens |
| (New) `src/components/ui/theme-toggle.tsx` | Theme toggle component |

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Shadcn components may not fully respect CSS variable tokens | Verify each Shadcn component variant; patch globals.css if needed |
| `next-themes` may conflict with `data-theme` approach | Build custom lightweight provider (under 50 lines) |
| Portal & dashboard share the same `<body>` — theme leak between contexts | `data-theme` on `<html>` scopes by selector specificity; dashboard routes and portal routes are in separate layout trees |
| Large diff from migrating all pages at once | Do it incrementally — BookingFlow first (4 files), then portal pages one by one |
