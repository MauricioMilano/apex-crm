## ADDED Requirements

### Requirement: Send notification when lead is assigned to employee

The system SHALL send an email to an employee when a lead is assigned to them.

#### Scenario: Email sent on lead creation with assignee
- **WHEN** `createLead()` succeeds with an `assignedTo` field and SMTP is enabled
- **THEN** the system SHALL send an email using the `lead-assigned` template to the assignee's email address

#### Scenario: Email sent on lead update with new assignee
- **WHEN** `updateLead()` changes the `assignedTo` field and SMTP is enabled
- **THEN** the system SHALL send an email using the `lead-assigned` template to the new assignee's email address

#### Scenario: Lead assigned email variables populated
- **WHEN** a lead assignment email is sent
- **THEN** the following variables SHALL be populated: `{{employeeName}}`, `{{leadName}}`, `{{email}}`, `{{phone}}`, `{{company}}`, `{{source}}`, `{{orgName}}`

#### Scenario: Email skipped when assignee has no email
- **WHEN** the assigned employee has no email address
- **THEN** no email SHALL be sent

### Requirement: Send notification when lead is converted to client

The system SHALL send a welcome email when a lead is converted to a client.

#### Scenario: Email sent on lead conversion
- **WHEN** `convertLeadToClient()` succeeds and the lead has an email and SMTP is enabled
- **THEN** the system SHALL send an email using the `lead-converted` template to the lead's email

#### Scenario: Lead converted email variables populated
- **WHEN** a lead conversion email is sent
- **THEN** the following variables SHALL be populated: `{{clientName}}`, `{{email}}`, `{{orgName}}`, `{{loginUrl}}`

### Requirement: Send notification when lead status changes

The system SHALL send an email to the lead assignee when a lead's status is changed.

#### Scenario: Email sent on status change
- **WHEN** `updateLead()` changes the `statusId` field and the lead has an assignee with email and SMTP is enabled
- **THEN** the system SHALL send an email using the `lead-status-changed` template to the assignee

#### Scenario: Status changed email variables populated
- **WHEN** a lead status change email is sent
- **THEN** the following variables SHALL be populated: `{{leadName}}`, `{{oldStatus}}`, `{{newStatus}}`, `{{orgName}}`

### Requirement: Send lead notification on manual lead creation

The system SHALL send a notification email when a lead is created manually (not via form submission), using the same `lead-notification` template.

#### Scenario: Email sent on manual lead creation
- **WHEN** `createLead()` succeeds (without originating from a form) and SMTP is enabled
- **THEN** the system SHALL send an email using the `lead-notification` template to the organization's `smtpFrom` address

#### Scenario: Manual lead notification variables populated
- **WHEN** a manual lead notification is sent
- **THEN** the following variables SHALL be populated: `{{firstName}}`, `{{lastName}}`, `{{email}}`, `{{phone}}`, `{{company}}`, `{{service}}` (as "Manual entry"), `{{orgName}}`
