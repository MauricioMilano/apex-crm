## ADDED Requirements

### Requirement: Organization setting record exists for every organization
The system SHALL ensure that every organization has exactly one `OrganizationSetting` record available.

#### Scenario: Query settings for org without a record
- **WHEN** `getOrganizationSettings()` is called for an organization that has no `OrganizationSetting` record
- **THEN** the system SHALL create a new `OrganizationSetting` record with default values (currency: `USD`, timezone: `America/New_York`, dateFormat: `MM/DD/YYYY`, timeFormat: `12h`, locale: `en-US`)
- **AND** return the newly created record

### Requirement: Organization stores regional preferences
The `OrganizationSetting` model SHALL include fields for `currency`, `timezone`, `dateFormat`, `timeFormat`, and `locale`.

#### Scenario: Default values on new record
- **WHEN** a new `OrganizationSetting` record is auto-created
- **THEN** `currency` SHALL default to `"USD"`
- **AND** `timezone` SHALL default to `"America/New_York"`
- **AND** `dateFormat` SHALL default to `"MM/DD/YYYY"`
- **AND** `timeFormat` SHALL default to `"12h"`
- **AND** `locale` SHALL default to `"en-US"`

#### Scenario: Valid timeFormat values
- **WHEN** `timeFormat` is set
- **THEN** the system SHALL accept only `"12h"` or `"24h"` as valid values
- **AND** reject any other value with a validation error

### Requirement: Location can override organization currency
The `Location` model SHALL include an optional `currency` field that overrides the organization-level default.

#### Scenario: Location without currency override
- **WHEN** a location has `currency` set to `null`
- **THEN** the effective currency for that location SHALL be the organization's `currency` from `OrganizationSetting`

#### Scenario: Location with currency override
- **WHEN** a location has `currency` set to `"BRL"`
- **THEN** the effective currency for that location SHALL be `"BRL"`, regardless of the organization's default

### Requirement: Timezone is independent per context
Organization timezone and location timezone SHALL be stored independently.

#### Scenario: Different org and location timezones
- **WHEN** an organization's `timezone` is `"America/Chicago"` and a location's `timezone` is `"America/Sao_Paulo"`
- **THEN** the org timezone SHALL be used for dashboards, reports, and aggregate displays
- **AND** the location timezone SHALL be used for appointment scheduling at that location
