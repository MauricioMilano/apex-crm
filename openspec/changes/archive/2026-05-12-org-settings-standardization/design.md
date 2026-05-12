## Context

The Apex CRM currently has no standardized way to store or consume organization-level regional settings. The `OrganizationSetting` model exists but only covers SMTP/email configuration. Currency, timezone, date format, and locale preferences are absent from the database entirely. The Settings page at `/settings` has UI controls for these fields but persists everything to `localStorage` — invisible to the server, other users, and lost on cache clear.

Meanwhile, monetary values are hardcoded with the `$` prefix in 15+ components, and dates are formatted with 8 different `date-fns` pattern strings scattered across the frontend. This makes the CRM effectively single-currency and single-format, blocking any evolution toward multi-region or multi-language support.

### Current Architecture

```
User's Browser           Server DB
┌──────────────┐        ┌────────────────────┐
│  localStorage │        │  Organization       │
│  crm_org_sets│        │  ├─ name: string    │
│  ├─ currency │        │  └─ ...              │
│  ├─ timezone │        │                      │
│  ├─ dateFmt  │        │  OrganizationSetting │
│  └─ ...      │        │  ├─ smtpEnabled     │
│              │        │  └─ ...só email     │
│  Components  │        │                      │
│  ├─ $hard   │        │  Location            │
│  ├─ format()│        │  └─ timezone         │
│  └─ ...     │        └────────────────────┘
└──────────────┘
```

### Target Architecture

```
User's Browser              Server DB
┌──────────────────┐       ┌──────────────────────────┐
│  OrgSettingsCtx   │◄─────│  OrganizationSetting      │
│  ├─ currency      │      │  ├─ currency: "USD"      │
│  ├─ timezone      │      │  ├─ timezone: "America"  │
│  ├─ dateFormat    │      │  ├─ dateFormat           │
│  ├─ timeFormat    │      │  ├─ timeFormat           │
│  ├─ locale        │      │  └─ locale               │
│  └─ ...           │      │                          │
│                   │      │  Location                │
│  useOrgFormat()   │      │  ├─ timezone (exists)    │
│  ├─ fmtCurrency() │      │  └─ currency (new)       │
│  └─ fmtDate()     │      └──────────────────────────┘
└──────────────────┘
```

## Goals / Non-Goals

**Goals:**
- Add `currency`, `timezone`, `dateFormat`, `timeFormat`, `locale` fields to the `OrganizationSetting` model
- Add optional `currency` override field to the `Location` model
- Provide Server Actions (`getOrganizationSettings`, `updateOrganizationSettings`) and REST endpoints (`GET/PATCH /api/v1/organization/settings`) for CRUD
- Implement upsert-on-read: if no `OrganizationSetting` record exists for an org when queried, create one with defaults
- Create `OrgSettingsProvider` React context that loads settings once and caches in state
- Create `useOrgSettings()` hook exposing all settings
- Create `src/lib/format.ts` with `formatCurrency()` (via `Intl.NumberFormat`) and `formatDate()` (respecting org timezone + format)
- Create `useOrgFormat()` hook returning pre-bound formatters
- Migrate the Settings page from localStorage to DB persistence
- Replace hardcoded `$` and raw `date-fns format()` calls across 15+ files with org-aware formatters
- Update seed to create an `OrganizationSetting` record for the seeded org

**Non-Goals:**
- Full i18n / UI translation (the `locale` field is preparatory but translation system is out of scope)
- Currency conversion between different currencies
- Timezone-aware scheduling engine (locations already have independent timezones; org timezone is for display/reporting only)
- Deleting legacy localStorage data (backward-compatible; old data is simply ignored)
- Migration script for existing orgs (upsert-on-read handles it)

## Decisions

### D1: Extend `OrganizationSetting` rather than `Organization`
The `OrganizationSetting` model already exists as a 1:1 extension of `Organization`. Adding fields there keeps the `organizations` table lean and follows the existing pattern. A single query with `include: { organizationSettings: true }` loads everything.

### D2: `timeFormat` as simple `"12h" | "24h"` selector
A free-form pattern string would give maximum flexibility but at the cost of UX complexity and potential for invalid values. Two explicit options map cleanly to `date-fns` format tokens (`h:mm a` / `HH:mm`) and `Intl.DateTimeFormat` options.

### D3: Org timezone is independent of location timezone
Location timezones are where the business operates (for scheduling). Org timezone is where the admin sits (for dashboards, reports, and display). A Chicago-based admin with locations in São Paulo and London needs org-level UTC-5 for their own reporting while each location keeps its local timezone for appointments.

### D4: Upsert-on-read for zero-migration adoption
Instead of writing a backfill migration, the `getOrganizationSettings()` action checks for the record and creates one with defaults if missing. This means:
- No downtime
- No migration script
- Existing orgs automatically get settings on first access
- The single `pnpm db:migrate` only needs to add columns (nullable or with defaults)

### D5: Dedicated `OrgSettingsProvider` context
Separating org settings from `CRMContext` keeps concerns clean. The `CRMContext` is already large (11 entity types). A focused `OrgSettingsProvider` with its own `useOrgSettings()` hook is easier to reason about, test, and maintain.

### D6: `Intl.NumberFormat` for currency, `date-fns` (with timezone support) for dates
`Intl.NumberFormat` is the standard JS API for locale-aware currency formatting and avoids pulling additional dependencies. For dates, the project already uses `date-fns`; we'll use `Intl.DateTimeFormat`-compatible patterns or `date-fns-tz` (or native `Intl.DateTimeFormat` with `timeZone` option) to handle timezone-aware display.

```
Example formatCurrency(1500, "USD", "en-US") → "$1,500.00"
Example formatCurrency(1500, "BRL", "pt-BR") → "R$ 1.500,00"
Example formatCurrency(1500, "JPY", "ja-JP") → "￥1,500"
```

### D7: REST endpoints in addition to Server Actions
Server Actions are the primary client-side mechanism, but REST endpoints (`GET/PATCH /api/v1/organization/settings`) enable external consumers (webhooks, integrations, CLI tools). Both share the same validation layer (Zod schemas in `src/actions/settings.ts`).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Orgs with no OrganizationSetting record cause null-pointer during first access | Upsert-on-read ensures a record is always created before returning |
| Timezone-aware date formatting adds complexity | Use `Intl.DateTimeFormat` with `timeZone` option — native, no extra dependency |
| Location `currency` override adds query complexity (need to resolve org vs location currency per entity) | Keep it simple: use org currency as default, location override as explicit field. A single `getEffectiveCurrency(locationId)` helper resolves it. |
| 15+ file migration touches many areas | Handle as discrete task per component/page in tasks.md; each is a find-replace with testable output |
| Existing localStorage data becomes orphaned | Harmless — old data is simply ignored. Could add a one-time migration that reads localStorage and writes to DB but not worth the complexity. |
| `dateFormat` string in DB could mismatch `date-fns` format tokens if user enters custom value | Only predefined options from the settings page are valid. Server-side Zod validation ensures only known formats are accepted. |

## Open Questions

*None resolved during design phase.*
