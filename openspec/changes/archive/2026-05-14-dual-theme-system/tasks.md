## 1. Foundation — CSS Infrastructure

- [x] 1.1 `src/app/globals.css` — Add `[data-theme="portal"]`, `[data-theme="dashboard"]`, `.portal-dark`, `.dashboard-light` blocks with context-specific CSS variable sets; relocate sidebar tokens into context blocks
- [x] 1.2 (New) `src/components/theme/theme-provider.tsx` — React context that reads/sets `data-theme` on `<html>`, manages variant class, persists to localStorage per context
- [x] 1.3 (New) `src/components/theme/theme-toggle.tsx` — Sun/moon icon button accepting `context: "dashboard" | "portal"` prop, toggles between default and variant
- [x] 1.4 `src/app/(dashboard)/layout.tsx` — Wrap with ThemeProvider (`context="dashboard"`), set `data-theme="dashboard"`, add ThemeToggle to header
- [x] 1.5 `src/app/(client-portal)/layout.tsx` — Wrap with ThemeProvider (`context="portal"`), set `data-theme="portal"`, add ThemeToggle to header, migrate layout colors to CSS variable tokens

## 2. BookingFlow Migration

- [x] 2.1 `src/components/appointments/booking-flow.tsx` — Replace all hard-coded dark Tailwind classes with CSS variable tokens (see design.md for token mapping)
- [x] 2.2 `src/app/(client-portal)/portal/book/page.tsx` — Remove dark wrapper div and comment; render `<BookingFlow />` directly; migrate remaining literal colors to CSS variable tokens

## 3. Portal Page Migration

- [x] 3.1 `src/app/(client-portal)/portal/dashboard/page.tsx` — Migrate literal colors to CSS variable tokens
- [x] 3.2 `src/app/(client-portal)/portal/appointments/page.tsx` — Migrate literal colors to CSS variable tokens
- [x] 3.3 `src/app/(client-portal)/portal/profile/page.tsx` — Migrate literal colors to CSS variable tokens
- [x] 3.4 `src/app/(client-portal)/portal/plans/page.tsx` — Migrate literal colors to CSS variable tokens
- [x] 3.5 `src/app/(client-portal)/portal/subscriptions/page.tsx` — Migrate literal colors to CSS variable tokens
- [x] 3.6 `src/app/(client-portal)/portal/login/page.tsx` — Migrate literal colors to CSS variable tokens
- [x] 3.7 `src/app/(client-portal)/portal/register/page.tsx` — Migrate literal colors to CSS variable tokens

## 4. Verification

- [x] 4.1 Verify all Shadcn components render correctly in both themes; patch globals.css if needed
- [x] 4.2 Verify BookingFlow in both contexts (dashboard dark + portal light)
- [x] 4.3 Verify theme toggle persists correctly per context independently
