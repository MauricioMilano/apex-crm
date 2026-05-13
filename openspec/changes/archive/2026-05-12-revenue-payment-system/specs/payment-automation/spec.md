## ADDED Requirements

### Requirement: Payment auto-generated on standalone appointment completion

The system SHALL auto-generate a Payment record when a standalone appointment (not covered by a subscription plan) is marked as `completed`.

#### Scenario: Standalone appointment completed generates payment
- **WHEN** `updateAppointmentStatus` is called with status `completed`
- **AND** the appointment has no `clientSubscriptionId`
- **THEN** a Payment SHALL be created with:
  - `amount` = the appointment's `Service.price`
  - `referenceType` = `appointment`
  - `referenceId` = the appointment's `id`
  - `status` = `completed`
  - `paidAt` = current timestamp

#### Scenario: Plan-covered appointment completed does not generate payment
- **WHEN** `updateAppointmentStatus` is called with status `completed`
- **AND** the appointment HAS a `clientSubscriptionId`
- **THEN** NO Payment SHALL be auto-generated (the appointment is covered by the plan)

#### Scenario: Non-completed status does not generate payment
- **WHEN** `updateAppointmentStatus` is called with any status other than `completed`
- **THEN** NO Payment SHALL be auto-generated

### Requirement: Payment auto-generated on subscription creation (pro-rata)

The system SHALL generate a pro-rata Payment when a subscription is created if the first period is partial.

#### Scenario: Subscription starts mid-cycle generates pro-rata payment
- **WHEN** a `ClientSubscription` is created
- **AND** the subscription starts on a date that is not the first day of the billing period
- **THEN** a Payment SHALL be created with:
  - `amount` = `planPrice * (activeDays / totalDaysInPeriod)` (rounded to 2 decimals)
  - `referenceType` = `subscription`
  - `referenceId` = the subscription's `id`
  - `status` = `completed`
  - `description` indicating pro-rata charge

#### Scenario: Subscription starts on first day of period generates full payment
- **WHEN** a `ClientSubscription` is created
- **AND** it's considered a full period start
- **THEN** a Payment SHALL be created with `amount` = full `planPrice`

### Requirement: Payment auto-generated on subscription renewal

The system SHALL generate a Payment record each time a subscription renews (when `currentPeriodEnd` passes and the period advances).

#### Scenario: Auto-renewal generates payment
- **WHEN** `renewPeriodIfNeeded` advances the subscription period
- **THEN** a Payment SHALL be created with:
  - `amount` = full `planPrice`
  - `referenceType` = `subscription`
  - `referenceId` = the subscription's `id`
  - `status` = `completed`
  - `paidAt` = the renewal date

#### Scenario: Subscription renewal respects billing period
- **WHEN** a subscription renews
- **THEN** the new `currentPeriodEnd` SHALL be calculated based on `SubscriptionPlan.billingPeriod`:
  - `monthly` → +30 days
  - `quarterly` → +90 days
  - `semiannual` → +180 days
  - `annual` → +365 days

### Requirement: Refund Payment generated on cancellation

The system SHALL generate a negative Payment (refund) when an active subscription is cancelled mid-cycle.

#### Scenario: Active subscription cancelled mid-cycle generates refund
- **WHEN** `cancelSubscription` is called on an active subscription
- **AND** the cancellation date is before `currentPeriodEnd`
- **THEN** a Payment SHALL be created with:
  - `amount` = negative value of `planPrice * (unusedDays / periodDays)`
  - `referenceType` = `subscription`
  - `referenceId` = the subscription's `id`
  - `status` = `refunded`
  - `description` indicating prorated refund

#### Scenario: Subscription cancelled at period end generates no refund
- **WHEN** `cancelSubscription` is called on an active subscription
- **AND** the cancellation date is at or after `currentPeriodEnd`
- **THEN** NO refund Payment SHALL be generated
