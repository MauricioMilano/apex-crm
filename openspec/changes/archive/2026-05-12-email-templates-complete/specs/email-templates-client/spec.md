## ADDED Requirements

### Requirement: Send welcome email when admin creates client manually

The system SHALL send a welcome email when an admin creates a client via the CRM interface (not via self-registration).

#### Scenario: Email sent on manual client creation
- **WHEN** `createClient()` succeeds via admin action and the client has an email and SMTP is enabled
- **THEN** the system SHALL send an email using the `client-welcome-admin` template to the client's email

#### Scenario: Manual welcome email variables populated
- **WHEN** a manual client welcome email is sent
- **THEN** the following variables SHALL be populated: `{{clientName}}`, `{{email}}`, `{{orgName}}`, `{{loginUrl}}`, `{{adminName}}`

#### Scenario: Email skipped when client created via lead conversion
- **WHEN** `createClient()` is called from `convertLeadToClient()` (has `leadId`)
- **THEN** no `client-welcome-admin` email SHALL be sent (the `lead-converted` template covers this case)

### Requirement: Send notification when client is assigned to employee

The system SHALL send an email to an employee when a client is assigned to them.

#### Scenario: Email sent on client assignment
- **WHEN** `createClient()` or `updateClient()` sets an `assignedTo` field and SMTP is enabled
- **THEN** the system SHALL send an email using the `client-assigned` template to the assignee's email

#### Scenario: Client assigned email variables populated
- **WHEN** a client assignment email is sent
- **THEN** the following variables SHALL be populated: `{{employeeName}}`, `{{clientName}}`, `{{email}}`, `{{phone}}`, `{{orgName}}`

#### Scenario: Email skipped when assignee changed to same person
- **WHEN** the `assignedTo` value is updated to the same employee
- **THEN** no assignment email SHALL be sent
