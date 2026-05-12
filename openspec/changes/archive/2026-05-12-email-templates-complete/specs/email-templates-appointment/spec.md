## ADDED Requirements

### Requirement: Send cancelled appointment email to client

The system SHALL send a cancellation email to the client when an appointment status is changed to "cancelled" and SMTP is enabled.

#### Scenario: Email sent on appointment cancellation
- **WHEN** `updateAppointmentStatus("cancelled")` succeeds and the client has an email address and SMTP is enabled
- **THEN** the system SHALL send an email using the `appointment-cancelled` template to the client's email

#### Scenario: Email sent to lead when appointment cancelled
- **WHEN** the appointment has no client but has a lead with email
- **THEN** the system SHALL send the cancellation email to the lead's email

#### Scenario: Cancellation email includes reason
- **WHEN** a `cancelReason` is provided
- **THEN** the `{{reason}}` variable SHALL be populated with the cancel reason text

#### Scenario: Cancellation email skipped when SMTP disabled
- **WHEN** SMTP is disabled or no recipient email is available
- **THEN** no email SHALL be sent

### Requirement: Send rescheduled appointment email to client

The system SHALL send a rescheduling notification email when an appointment's startTime changes.

#### Scenario: Email sent on date/time change
- **WHEN** `updateAppointment()` changes the `startTime` field and the client has an email and SMTP is enabled
- **THEN** the system SHALL send an email using the `appointment-rescheduled` template with old and new date/time variables

#### Scenario: Email skipped on non-time changes
- **WHEN** `updateAppointment()` changes only notes or other non-time fields
- **THEN** no reschedule email SHALL be sent

#### Scenario: Old and new date/time are populated
- **WHEN** a reschedule email is sent
- **THEN** `{{oldDate}}`, `{{oldTime}}`, `{{newDate}}`, `{{newTime}}` SHALL be populated with the before/after values

### Requirement: Send appointment reminder email before appointment

The system SHALL send a reminder email to the client X hours before the appointment start time.

#### Scenario: Reminder scheduled on appointment creation
- **WHEN** `createAppointment()` succeeds and the client has an email
- **THEN** the system SHALL create an `EmailSchedule` record for the `appointment-reminder` template, scheduled for 24 hours before `startTime`

#### Scenario: Reminder sent by cron job
- **WHEN** the cron endpoint `GET /api/cron/email` runs and finds a pending `EmailSchedule` for `appointment-reminder` whose `scheduledFor` has passed
- **THEN** the system SHALL send the email and mark it as sent

#### Scenario: Reminder cancelled when appointment cancelled
- **WHEN** an appointment is cancelled
- **THEN** any pending `EmailSchedule` for that appointment SHALL be deleted or marked as cancelled

#### Scenario: Reminder variables populated
- **WHEN** an appointment reminder email is sent
- **THEN** the following variables SHALL be populated: `{{clientName}}`, `{{serviceName}}`, `{{date}}`, `{{time}}`, `{{employeeName}}`, `{{locationName}}`, `{{orgName}}`

### Requirement: Send completed appointment email to client

The system SHALL send a follow-up email when an appointment is marked as completed.

#### Scenario: Email sent on completion
- **WHEN** `updateAppointmentStatus("completed")` succeeds and the client has an email and SMTP is enabled
- **THEN** the system SHALL send an email using the `appointment-completed` template to the client's email

#### Scenario: Completed email includes feedback URL
- **WHEN** a completion email is sent
- **THEN** the `{{feedbackUrl}}` variable SHALL be populated with a link to a feedback page

### Requirement: Send no-show notification to client

The system SHALL send a notification when a client is marked as no-show for an appointment.

#### Scenario: Email sent on no-show
- **WHEN** `updateAppointmentStatus("no_show")` succeeds and the client has an email and SMTP is enabled
- **THEN** the system SHALL send an email using the `appointment-no-show` template
