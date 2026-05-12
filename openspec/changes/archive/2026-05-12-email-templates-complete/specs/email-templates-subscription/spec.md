## ADDED Requirements

### Requirement: Send confirmation when subscription plan is activated

The system SHALL send a confirmation email to the client when a subscription plan is assigned to them.

#### Scenario: Email sent on plan assignment
- **WHEN** `assignPlan()` succeeds and the client has an email and SMTP is enabled
- **THEN** the system SHALL send an email using the `subscription-activated` template to the client's email

#### Scenario: Subscription activated email variables populated
- **WHEN** a subscription activation email is sent
- **THEN** the following variables SHALL be populated: `{{clientName}}`, `{{planName}}`, `{{price}}`, `{{billingPeriod}}`, `{{startDate}}`, `{{orgName}}`

### Requirement: Send notification when subscription is cancelled

The system SHALL send a notification email when a client's subscription is cancelled.

#### Scenario: Email sent on subscription cancellation
- **WHEN** `cancelSubscription()` succeeds and the client has an email and SMTP is enabled
- **THEN** the system SHALL send an email using the `subscription-cancelled` template to the client's email

#### Scenario: Subscription cancelled email variables populated
- **WHEN** a subscription cancellation email is sent
- **THEN** the following variables SHALL be populated: `{{clientName}}`, `{{planName}}`, `{{endDate}}`, `{{orgName}}`

### Requirement: Send notification when subscription expires

The system SHALL send a notification when a subscription status changes to "expired".

#### Scenario: Email sent on subscription expiry
- **WHEN** the cron job detects a subscription whose `currentPeriodEnd` has passed and the status changes to "expired" and SMTP is enabled
- **THEN** the system SHALL send an email using the `subscription-expired` template to the client's email

#### Scenario: Subscription expired email variables populated
- **WHEN** a subscription expiry email is sent
- **THEN** the following variables SHALL be populated: `{{clientName}}`, `{{planName}}`, `{{orgName}}`

### Requirement: Send warning before subscription expires

The system SHALL send a warning email X days before a subscription's current period ends.

#### Scenario: Expiring soon email scheduled
- **WHEN** a subscription's `currentPeriodEnd` is within 7 days in the future
- **THEN** the cron job SHALL create an `EmailSchedule` for `subscription-expiring-soon`

#### Scenario: Expiring soon email sent by cron
- **WHEN** the cron endpoint runs and finds a pending schedule for `subscription-expiring-soon`
- **THEN** the system SHALL send the email with variables `{{clientName}}`, `{{planName}}`, `{{expiryDate}}`, `{{orgName}}`

### Requirement: Send notification when subscription renews

The system SHALL send a notification when a subscription's period auto-renews.

#### Scenario: Email sent on period renewal
- **WHEN** `renewPeriodIfNeeded()` successfully advances the subscription period and SMTP is enabled
- **THEN** the system SHALL send an email using the `subscription-renewed` template to the client's email

#### Scenario: Subscription renewed email variables populated
- **WHEN** a subscription renewal email is sent
- **THEN** the following variables SHALL be populated: `{{clientName}}`, `{{planName}}`, `{{newPeriodStart}}`, `{{newPeriodEnd}}`, `{{orgName}}`

### Requirement: Send warning when subscription usage nears limit

The system SHALL send a warning email when a subscription's appointment usage reaches 80% or more of the period limit.

#### Scenario: Limit warning sent on appointment creation
- **WHEN** `createAppointment()` increments `appointmentsUsed` to >= 80% of the plan's `maxApptsPerPeriod` and SMTP is enabled
- **THEN** the system SHALL send an email using the `subscription-limit-warning` template

#### Scenario: Limit warning only sent once per period
- **WHEN** the limit warning has already been sent in the current period
- **THEN** no duplicate warning SHALL be sent

#### Scenario: Limit warning variables populated
- **WHEN** a subscription limit warning is sent
- **THEN** the following variables SHALL be populated: `{{clientName}}`, `{{planName}}`, `{{used}}`, `{{max}}`, `{{remaining}}`, `{{orgName}}`
