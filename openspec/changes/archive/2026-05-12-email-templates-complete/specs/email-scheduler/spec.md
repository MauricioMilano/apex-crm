## ADDED Requirements

### Requirement: Email scheduling system

The system SHALL provide a mechanism to schedule emails for future delivery.

#### Scenario: Schedule email for future delivery
- **WHEN** a `scheduleEmail()` function is called with a template name, recipient, variables, and a future timestamp
- **THEN** the system SHALL create a record in the `EmailSchedule` table with the scheduled time

#### Scenario: Scheduled email not sent before scheduled time
- **WHEN** the cron endpoint runs before a scheduled email's `scheduledFor` time
- **THEN** the email SHALL NOT be sent

#### Scenario: Scheduled email sent after scheduled time
- **WHEN** the cron endpoint runs after a scheduled email's `scheduledFor` time and `sentAt` is null
- **THEN** the system SHALL send the email via `sendEmail()` and set `sentAt` to the current timestamp

#### Scenario: Failed scheduled email is retried
- **WHEN** sending a scheduled email fails (SMTP error, template not found)
- **THEN** the `sentAt` field SHALL remain null and the email SHALL be retried on the next cron run

### Requirement: Cron endpoint for email scheduler

The system SHALL expose an HTTP endpoint that processes pending scheduled emails.

#### Scenario: Cron endpoint processes pending emails
- **WHEN** `GET /api/cron/email` is called
- **THEN** the system SHALL query all `EmailSchedule` records where `sentAt IS NULL` and `scheduledFor <= now()` and attempt to send each one

#### Scenario: Cron endpoint returns summary
- **WHEN** the cron endpoint finishes processing
- **THEN** it SHALL return a JSON response with counts: `{ processed: number, succeeded: number, failed: number }`

### Requirement: Clean up expired schedules

The system SHALL clean up old EmailSchedule records to prevent table bloat.

#### Scenario: Old sent records deleted
- **WHEN** an `EmailSchedule` record has `sentAt` older than 30 days
- **THEN** the cron job SHALL delete the record

#### Scenario: Old unsent records marked as expired
- **WHEN** an `EmailSchedule` record has `scheduledFor` older than 7 days and `sentAt` is null
- **THEN** the cron job SHALL set `sentAt` to a special value or delete the record (it's too late to send)

### Requirement: Cancel scheduled emails when source event is cancelled

The system SHALL cancel pending scheduled emails when the triggering event is no longer relevant (e.g., appointment cancelled).

#### Scenario: Reminder cancelled on appointment cancellation
- **WHEN** an appointment is cancelled
- **THEN** the system SHALL delete all `EmailSchedule` records related to that appointment

#### Scenario: Schedule records reference source entity
- **WHEN** an `EmailSchedule` record is created
- **THEN** it SHALL include optional `referenceType` and `referenceId` fields to link back to the source entity (appointment, subscription, etc.)
