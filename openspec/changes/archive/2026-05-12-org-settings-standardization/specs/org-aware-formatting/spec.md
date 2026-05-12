## ADDED Requirements

### Requirement: Currency formatting respects organization settings
The system SHALL provide a `formatCurrency(amount, currency?, locale?)` utility that formats monetary values according to the organization's settings.

#### Scenario: Format USD in en-US
- **WHEN** `formatCurrency(1500, "USD", "en-US")` is called
- **THEN** the result SHALL be `"$1,500.00"`

#### Scenario: Format BRL in pt-BR
- **WHEN** `formatCurrency(1500, "BRL", "pt-BR")` is called
- **THEN** the result SHALL be `"R$ 1.500,00"`

#### Scenario: Format JPY in ja-JP
- **WHEN** `formatCurrency(1500, "JPY", "ja-JP")` is called
- **THEN** the result SHALL be `"￥1,500"`
- **AND** zero decimal places SHALL be shown (JPY has no fractional unit)

#### Scenario: Uses defaults when arguments omitted
- **WHEN** `formatCurrency(1500)` is called without currency or locale
- **THEN** the function SHALL default to `"USD"` and `"en-US"`

### Requirement: Date formatting respects organization settings
The system SHALL provide a `formatDate(date, options?)` utility that formats dates according to the organization's timezone, dateFormat, and timeFormat.

#### Scenario: Format date with org settings
- **WHEN** `formatDate("2025-01-15T14:30:00Z", { timezone: "America/Chicago", dateFormat: "MM/DD/YYYY", timeFormat: "12h" })`
- **THEN** the result SHALL be `"01/15/2025"` (date only) or include time based on the `includeTime` option

#### Scenario: Format date with 24h time
- **WHEN** `formatDate("2025-01-15T14:30:00Z", { timezone: "Europe/Berlin", dateFormat: "DD/MM/YYYY", timeFormat: "24h", includeTime: true })`
- **THEN** the result SHALL be `"15/01/2025 15:30"` (Berlin is UTC+1 in winter)

### Requirement: React hook provides pre-bound formatters
The system SHALL provide a `useOrgFormat()` hook that returns `formatCurrency` and `formatDate` functions pre-bound to the current organization's settings.

#### Scenario: Hook returns bound formatters
- **WHEN** a component calls `const { formatCurrency, formatDate } = useOrgFormat()`
- **THEN** `formatCurrency(1500)` SHALL use the org's currency and locale automatically
- **AND** `formatDate(date)` SHALL use the org's timezone, dateFormat, and timeFormat automatically

### Requirement: React context provides org settings
The system SHALL provide an `OrgSettingsProvider` and a `useOrgSettings()` hook.

#### Scenario: Provider loads settings on mount
- **WHEN** `OrgSettingsProvider` mounts
- **THEN** it SHALL call `getOrganizationSettings()` to load settings from the server
- **AND** cache the result in React state

#### Scenario: Hook returns settings
- **WHEN** a component calls `useOrgSettings()`
- **THEN** it SHALL return `{ currency, timezone, dateFormat, timeFormat, locale, isLoading }`
- **AND** if called outside the provider, SHALL throw an error

### Requirement: Settings page persists to database
The general settings page SHALL save timezone, dateFormat, timeFormat, currency, and locale to the database via `updateOrganizationSettings()` instead of `localStorage`.

#### Scenario: Save settings
- **WHEN** a user changes the timezone and clicks "Save Changes"
- **THEN** the system SHALL call `updateOrganizationSettings()` with the new values
- **AND** show a success toast on completion

#### Scenario: Load settings on mount
- **WHEN** the settings page loads
- **THEN** it SHALL populate form fields from `getOrganizationSettings()` response
- **AND** fall back to defaults if the server call fails
