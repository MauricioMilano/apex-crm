## Why

The CRM currently has no persistent, organization-wide settings for currency, timezone, date format, or locale. The Settings page has selectors for these fields but saves them **only to localStorage** — meaning they're per-browser, lost on cache clear, invisible to other users, and inaccessible to Server Actions. Meanwhile, monetary values are hardcoded with `$` in 15+ files and dates are formatted in 8 different patterns across the codebase. This makes multi-currency, multi-region, and multi-language evolution impossible without first standardizing how org-level regional settings are stored, served, and consumed.

## What Changes

### Schema & Data Layer
- Extend `OrganizationSetting` model with: `currency`, `timezone`, `dateFormat`, `timeFormat`, `locale`
- Add `currency` override field to `Location` model
- Implement upsert-on-read pattern: if an organization has no `OrganizationSetting` record on lookup, create one with sensible defaults

### Backend / API
- Create Server Actions: `getOrganizationSettings`, `updateOrganizationSettings`
- Create REST endpoints: `GET /api/v1/organization/settings`, `PATCH /api/v1/organization/settings`
- Update `updateOrganization` action to delegate settings persistence properly
- Implement upsert logic in the read path for zero-migration adoption

### Frontend — Context & Hooks
- Create `OrgSettingsProvider` (dedicated React context, simple state cache)
- Create `useOrgSettings()` hook exposing `{ currency, timezone, dateFormat, timeFormat, locale }`
- Create formatting utilities in `src/lib/format.ts`:
  - `formatCurrency(amount, currency?)` — uses `Intl.NumberFormat`
  - `formatDate(date, options?)` — respects org timezone + dateFormat + timeFormat
- Create `useOrgFormat()` hook returning pre-bound formatters

### Frontend — Settings Page
- Migrate settings page from localStorage persistence to `updateOrganizationSettings()` Server Action
- Load settings from DB on mount via `getOrganizationSettings()`

### Frontend — Migration (15+ files)
- Replace all hardcoded `$` string templates with `formatCurrency()`
- Replace all hardcoded `format(date, 'MMM d, yyyy')` patterns with org-aware `formatDate()`
- Replace all bare `toLocaleDateString()` calls with org-aware formatting

## Capabilities

### New Capabilities
- `org-regional-settings`: Persistent storage and retrieval of organization-level currency, timezone, date format, time format, and locale preferences, with optional per-location currency override.
- `org-settings-api`: Server Actions and REST endpoints for reading and updating organization settings, with upsert-on-read behavior.
- `org-aware-formatting`: Client-side utilities, hooks, and React context for currency and date formatting that respect the current organization's settings, replacing hardcoded formatting across the application.

### Modified Capabilities
*None — no existing specs to modify.*

## Impact

| Area | Files / Modules |
|------|----------------|
| **DB Schema** | `prisma/schema.prisma` — `OrganizationSetting` + `Location` models |
| **Types** | `src/types/index.ts` — new `OrgSettings` interface |
| **Actions** | `src/actions/settings.ts` — new `getOrganizationSettings`, `updateOrganizationSettings` |
| **API Routes** | `src/app/api/v1/organization/settings/route.ts` — GET + PATCH |
| **Context** | `src/contexts/org-settings-context.tsx` — new provider |
| **Hooks** | `src/hooks/use-org-settings.ts`, `src/hooks/use-org-format.ts` — new hooks |
| **Utils** | `src/lib/format.ts` — new formatting utilities |
| **Seed** | `src/lib/seed.ts` — create `OrganizationSetting` record |
| **Frontend (migration)** | 15+ components/pages using `$` or `format(date, ...)` — see tasks.md for full list |
| **Settings Page** | `src/app/(dashboard)/settings/page.tsx` — migrate localStorage → DB |
