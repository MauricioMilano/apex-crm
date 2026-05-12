## ADDED Requirements

### Requirement: Server Action reads organization settings
The system SHALL provide a `getOrganizationSettings(organizationId)` Server Action that returns the full settings record.

#### Scenario: Successful read
- **WHEN** `getOrganizationSettings(orgId)` is called with a valid organization ID
- **THEN** the system SHALL return `{ success: true, data: OrganizationSetting }`
- **AND** the data SHALL include `currency`, `timezone`, `dateFormat`, `timeFormat`, and `locale`

#### Scenario: Missing record triggers creation
- **WHEN** the organization has no `OrganizationSetting` record
- **THEN** the system SHALL create one with defaults before returning

### Requirement: Server Action updates organization settings
The system SHALL provide an `updateOrganizationSettings(organizationId, settings)` Server Action that accepts partial updates.

#### Scenario: Partial update
- **WHEN** `updateOrganizationSettings(orgId, { currency: "BRL" })` is called
- **THEN** only the `currency` field SHALL be updated
- **AND** other fields SHALL retain their previous values

#### Scenario: Validation on update
- **WHEN** `updateOrganizationSettings(orgId, { timeFormat: "24hours" })` is called
- **THEN** the system SHALL return `{ success: false, error: "..." }`
- **AND** NOT modify any records

### Requirement: REST endpoint reads organization settings
The system SHALL provide `GET /api/v1/organization/settings` that returns the current organization's settings.

#### Scenario: Authenticated GET request
- **WHEN** an authenticated user sends `GET /api/v1/organization/settings`
- **THEN** the system SHALL return `{ success: true, data: { currency, timezone, dateFormat, timeFormat, locale } }`
- **AND** the response SHALL use the same upsert-on-read behavior

### Requirement: REST endpoint updates organization settings
The system SHALL provide `PATCH /api/v1/organization/settings` that accepts partial updates.

#### Scenario: Authenticated PATCH request
- **WHEN** an authenticated user sends `PATCH /api/v1/organization/settings` with `{ "currency": "EUR" }`
- **THEN** the system SHALL update the `currency` field
- **AND** return the updated record

#### Scenario: Validation error
- **WHEN** an authenticated user sends `PATCH /api/v1/organization/settings` with an invalid `dateFormat`
- **THEN** the system SHALL return a `400` status with an error message
- **AND** NOT modify any records
