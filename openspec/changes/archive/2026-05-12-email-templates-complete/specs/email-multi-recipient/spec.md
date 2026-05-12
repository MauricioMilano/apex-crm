## ADDED Requirements

### Requirement: Send email to multiple recipients

The system SHALL support sending a single email to multiple recipients.

#### Scenario: Send to array of email addresses
- **WHEN** `sendEmail()` is called with `to` as an array of email addresses
- **THEN** the system SHALL send a single email with all addresses in the To: header

#### Scenario: Send with CC recipients
- **WHEN** `sendEmail()` is called with a `cc` array of email addresses
- **THEN** the system SHALL include CC recipients in the email

#### Scenario: Single recipient still works
- **WHEN** `sendEmail()` is called with `to` as a single string
- **THEN** the system SHALL send the email to that single address (backward compatible)

### Requirement: Deduplicate recipients

The system SHALL not send duplicate emails to the same address when the same address appears in both `to` and `cc`.

#### Scenario: Duplicate addresses removed
- **WHEN** the same email address appears in `to` and `cc`
- **THEN** the system SHALL deduplicate and send only one copy

### Requirement: Multi-recipient from appointment triggers

The system SHALL be capable of sending appointment-related emails to both the client and the assigned employee in a single call.

#### Scenario: Cancellation email sent to client and employee
- **WHEN** an appointment is cancelled
- **THEN** the system SHALL send the cancellation email to both the client and the employee (if both have emails), using the multi-recipient feature

#### Scenario: Each recipient sees same content
- **WHEN** an email is sent to multiple recipients
- **THEN** all recipients SHALL receive the same rendered template content (personalization is per-template, not per-recipient)
