## ADDED Requirements

### Requirement: Appointment confirmation email sent on booking

The system SHALL send a confirmation email to the client when an appointment is created and SMTP is enabled.

#### Scenario: Email sent on appointment creation
- **WHEN** `createAppointment()` succeeds and the client has an email address and SMTP is enabled
- **THEN** the system SHALL send an email using the `appointment-confirmed` template to the client's email

#### Scenario: Email skipped when SMTP disabled
- **WHEN** `createAppointment()` succeeds but SMTP is disabled
- **THEN** no email SHALL be sent

#### Scenario: Email skipped when client has no email
- **WHEN** `createAppointment()` succeeds but the client has no email address
- **THEN** no email SHALL be sent

#### Scenario: Email failure does not block appointment creation
- **WHEN** `createAppointment()` succeeds but sending the email fails (SMTP unreachable, template not found)
- **THEN** the appointment SHALL still be created successfully and the error SHALL be silently logged

### Requirement: Lead notification email sent on form submission

The system SHALL send a notification email when a lead is created via public form submission.

#### Scenario: Email sent on lead creation from form
- **WHEN** `submitFormEntry()` creates a lead successfully and SMTP is enabled
- **THEN** the system SHALL send an email using the `lead-notification` template to the organization's configured from address

#### Scenario: Email skipped on form submission with SMTP disabled
- **WHEN** `submitFormEntry()` succeeds but SMTP is disabled
- **THEN** no email SHALL be sent

### Requirement: Welcome email sent on client registration

The system SHALL send a welcome email when a client registers via the client portal.

#### Scenario: Email sent on client registration
- **WHEN** a client registers via the portal and SMTP is enabled
- **THEN** the system SHALL send an email using the `client-welcome` template to the client's registered email

#### Scenario: Email skipped on client registration with SMTP disabled
- **WHEN** a client registers but SMTP is disabled
- **THEN** no email SHALL be sent

### Requirement: Template variables are populated with real data

The system SHALL populate template {{var}} placeholders with actual data from the triggering event.

#### Scenario: Appointment confirmation variables populated
- **WHEN** an appointment confirmation email is sent
- **THEN** the following variables SHALL be populated: `{{clientName}}`, `{{date}}`, `{{time}}`, `{{serviceName}}`, `{{employeeName}}`, `{{locationName}}`, `{{orgName}}`

#### Scenario: Lead notification variables populated
- **WHEN** a lead notification email is sent
- **THEN** the following variables SHALL be populated: `{{firstName}}`, `{{lastName}}`, `{{email}}`, `{{phone}}`, `{{company}}`, `{{service}}`, `{{orgName}}`

#### Scenario: Client welcome variables populated
- **WHEN** a client welcome email is sent
- **THEN** the following variables SHALL be populated: `{{clientName}}`, `{{email}}`, `{{orgName}}`, `{{loginUrl}}`
