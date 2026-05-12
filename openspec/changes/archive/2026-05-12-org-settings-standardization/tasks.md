## 1. Schema — Prisma Models

- [x] 1.1 Add `currency`, `timezone`, `dateFormat`, `timeFormat`, `locale` fields to `OrganizationSetting` model in `prisma/schema.prisma`
- [x] 1.2 Add optional `currency` field to `Location` model in `prisma/schema.prisma`
- [x] 1.3 Run `pnpm db:migrate` to generate and apply migration

## 2. Types — Shared Interfaces

- [x] 2.1 Add `OrgSettings` interface to `src/types/index.ts` with `currency`, `timezone`, `dateFormat`, `timeFormat`, `locale`
- [x] 2.2 Add optional `currency` to the existing `Location` interface in `src/types/index.ts`

## 3. Backend — Server Actions

- [x] 3.1 Create `getOrganizationSettings(organizationId)` action in `src/actions/settings.ts` with upsert-on-read logic
- [x] 3.2 Create `updateOrganizationSettings(organizationId, data)` action with Zod schema validation (only known dateFormat values, timeFormat in 12h/24h, etc.)
- [x] 3.3 Add validation schemas for allowed timezone list, dateFormat options, and currency codes

## 4. Backend — REST API

- [x] 4.1 Create `GET /api/v1/organization/settings` route returning the organization's settings (with upsert-on-read)
- [x] 4.2 Create `PATCH /api/v1/organization/settings` route for partial updates with validation

## 5. Frontend — Formatting Utilities

- [x] 5.1 Create `src/lib/format.ts` with `formatCurrency(amount, currency?, locale?)` using `Intl.NumberFormat`
- [x] 5.2 Add `formatDate(date, options?)` to `src/lib/format.ts` supporting timezone, dateFormat, timeFormat via `Intl.DateTimeFormat`

## 6. Frontend — Context & Hooks

- [x] 6.1 Create `src/contexts/org-settings-context.tsx` with `OrgSettingsProvider` that loads settings on mount and caches in React state
- [x] 6.2 Create `src/hooks/use-org-settings.ts` hook returning `{ currency, timezone, dateFormat, timeFormat, locale, isLoading }`
- [x] 6.3 Create `src/hooks/use-org-format.ts` hook returning `formatCurrency` and `formatDate` pre-bound to org settings
- [x] 6.4 Integrate `OrgSettingsProvider` into the root layout (or dashboard layout)

## 7. Frontend — Settings Page Migration

- [x] 7.1 Add `timeFormat` (12h/24h selector) and `locale` (language selector) UI to the settings page
- [x] 7.2 Migrate "Load" to call `getOrganizationSettings()` from the server instead of `localStorage`
- [x] 7.3 Migrate "Save" to call `updateOrganizationSettings()` Server Action instead of `localStorage`
- [x] 7.4 Remove `localStorage` read/write logic from the settings page

## 8. Frontend — Money Format Migration (replace `$` hardcoded)

- [x] 8.1 `src/app/(dashboard)/dashboard/page.tsx` — replace `$${...}` with `formatCurrency()`
- [x] 8.2 `src/app/(dashboard)/leads/page.tsx` — replace `$${totalValue...}` with `formatCurrency()`
- [x] 8.3 `src/app/(dashboard)/leads/[id]/page.tsx` — replace `$${lead.value...}` with `formatCurrency()`
- [x] 8.4 `src/components/leads/kanban-board.tsx` — replace `$${lead.value...}` with `formatCurrency()`
- [x] 8.5 `src/components/leads/lead-card.tsx` — replace `$${lead.value...}` with `formatCurrency()`
- [x] 8.6 `src/components/ui/chart.tsx` — Reviewed: generic chart component with existing `formatter` prop. Default `toLocaleString()` is appropriate for non-currency chart data.

## 9. Frontend — Date Format Migration (replace hardcoded patterns)

- [x] 9.1 `src/components/appointments/appointment-card.tsx` — replace `format(startDate, 'MMM d, yyyy')` with `formatDate()`
- [x] 9.2 `src/app/(dashboard)/appointments/page.tsx` — replace date formats
- [x] 9.3 `src/app/(dashboard)/appointments/[id]/page.tsx` — replace date formats
- [x] 9.4 `src/components/calendar/calendar-grid.tsx` and `src/app/(dashboard)/calendar/page.tsx` — replace date formats
- [x] 9.5 `src/app/(dashboard)/clients/[id]/page.tsx` — replace date formats
- [x] 9.6 `src/components/clients/client-card.tsx`, `client-list.tsx`, `client-subscriptions-panel.tsx` — replace date formats
- [x] 9.7 `src/app/(dashboard)/forms/page.tsx` — replace date format
- [x] 9.8 `src/app/(dashboard)/leads/[id]/page.tsx` — replace date formats
- [x] 9.9 `src/app/(dashboard)/settings/webhooks/page.tsx` and `settings/api/page.tsx` — replace `toLocaleDateString()` with `formatDate()`
- [x] 9.10 `src/components/email/template-list.tsx` — replace `toLocaleDateString()`
- [x] 9.11 Client portal pages (4 files in `src/app/(client-portal)/`) — replace date formats

## 10. Seed

- [x] 10.1 Add `OrganizationSetting` record creation to `src/lib/seed.ts` for the seeded organization

## 11. Tests

- [x] 11.1 Unit tests for `formatCurrency()` — USD, BRL, JPY, JPY-zero-decimal, missing args
- [x] 11.2 Unit tests for `formatDate()` — timezone conversion, 12h/24h, date-only, date+time
- [x] 11.3 Unit tests for `getOrganizationSettings()` — existing record, upsert on missing, error handling
- [x] 11.4 Unit tests for `updateOrganizationSettings()` — partial update, validation rejection, full update
- [ ] 11.5 Integration test for REST endpoints — SKIPPED: requires test DB setup. Unit tests cover action logic.

## 12. Validation & Cleanup

- [x] 12.1 Run full typecheck (`pnpm exec tsc --noEmit`) — ✅ PASSED
- [x] 12.2 Run full lint (`pnpm lint`) — ⚠️ Now works after fixing ESLint config. Remaining errors are all pre-existing (unused imports across codebase). No errors from our changes.
- [x] 12.3 Run full build (`pnpm build`) — ✅ PASSED (compiled successfully)
- [x] 12.4 Run test suite (`pnpm test:unit`) — ✅ 73/73 tests pass
