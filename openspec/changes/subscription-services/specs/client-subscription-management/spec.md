## ADDED Requirements

### Requirement: Admin can assign a plan to a client
The system SHALL allow admins to assign an active subscription plan to a client, creating a new ClientSubscription with a 30-day initial period.

#### Scenario: Assign plan to client
- **WHEN** an admin assigns plan "Premium" to client "John Doe"
- **THEN** the system SHALL create a ClientSubscription with status "active", startDate now, currentPeriodStart now, currentPeriodEnd now+30 days, and appointmentsUsed 0

#### Scenario: Assign plan to client that already has it
- **WHEN** an admin assigns the same plan to a client who already has an active subscription for that plan
- **THEN** the system SHALL create a second independent subscription (client can have multiple)

### Requirement: Admin can cancel a client subscription
The system SHALL allow admins to set a ClientSubscription status to "cancelled".

#### Scenario: Cancel active subscription
- **WHEN** an admin cancels a client's subscription
- **THEN** the system SHALL set status to "cancelled" and set endDate to now

#### Scenario: Cancel already cancelled subscription
- **WHEN** an admin attempts to cancel a subscription that is already cancelled
- **THEN** the system SHALL return the current state without error

### Requirement: Admin can list client subscriptions
The system SHALL display all subscriptions for a given client with status, plan details, period dates, and usage.

#### Scenario: View client subscriptions
- **WHEN** an admin views a client's profile
- **THEN** the system SHALL list all subscriptions (active, cancelled, expired) with plan name, status, period, and appointmentsUsed/max

### Requirement: System auto-advances subscription periods
The system SHALL check and advance subscription periods when reading subscription data, resetting the usage counter.

#### Scenario: Auto-renew period
- **WHEN** a subscription's currentPeriodEnd is in the past and status is "active"
- **THEN** the system SHALL advance currentPeriodStart to currentPeriodEnd, set currentPeriodEnd to +30 days, and reset appointmentsUsed to 0

#### Scenario: Expire subscription with endDate
- **WHEN** a subscription's endDate is in the past and status is not "cancelled"
- **THEN** the system SHALL set status to "expired"
