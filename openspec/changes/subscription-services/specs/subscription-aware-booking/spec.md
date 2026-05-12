## ADDED Requirements

### Requirement: Booking flow detects active subscriptions
When a client uses the booking flow, the system SHALL check their active subscriptions and determine which services are covered.

#### Scenario: Service covered by one subscription
- **WHEN** a client with one active subscription that includes "Haircut" selects "Haircut" in the booking flow
- **THEN** the service card SHALL show "Included in [Plan Name]" instead of the price, and the price SHALL NOT be displayed

#### Scenario: Service covered by multiple subscriptions
- **WHEN** a client has two active subscriptions both covering "Haircut"
- **THEN** the service card SHALL show "Included in [Plan A] or [Plan B]" and the client SHALL be prompted to select which plan to use at confirmation

#### Scenario: Service not covered by any subscription
- **WHEN** a client selects a service not included in any of their active subscriptions
- **THEN** the service card SHALL show the normal price "$X.XX"

#### Scenario: Client with no subscriptions at all
- **WHEN** a client with no subscriptions uses the booking flow
- **THEN** all services SHALL show normal prices (existing behavior unchanged)

### Requirement: Booking under a plan increments usage
When an appointment is created under a subscription, the system SHALL increment `appointmentsUsed` on the `ClientSubscription` and link via `clientSubscriptionId`.

#### Scenario: Book appointment under plan
- **WHEN** a client books "Haircut" under their "Premium" plan and the appointment is created
- **THEN** the Appointment SHALL have `clientSubscriptionId` set, and the ClientSubscription's `appointmentsUsed` SHALL increment by 1

#### Scenario: Booking standalone (no plan)
- **WHEN** a client books a service without using a plan
- **THEN** the Appointment SHALL have `clientSubscriptionId` null (existing behavior)

### Requirement: Booking enforces per-period limits
The system SHALL prevent booking if the subscription has reached its usage limit for the period.

#### Scenario: Global limit reached
- **WHEN** a client has used 8 of 8 appointments in their "Premium" plan this period
- **THEN** the booking flow SHALL show the service with its price (fallback to standalone) and display a message "You've used all appointments in [Plan Name] this period"

#### Scenario: Per-service limit reached
- **WHEN** a client has used 4 of 4 allowed "Haircut" appointments under their "Premium" plan this period
- **THEN** the booking flow SHALL show "Haircut" with its price (fallback to standalone) with a note that the per-service limit for this plan has been reached

#### Scenario: Multiple limits — most restrictive applies
- **WHEN** a plan has maxApptsPerPeriod 8 and a service has maxPerPeriod 4, and the client has used 4 haircuts
- **THEN** the system SHALL block using the plan for "Haircut" (per-service limit hit first) even though total is 4/8
