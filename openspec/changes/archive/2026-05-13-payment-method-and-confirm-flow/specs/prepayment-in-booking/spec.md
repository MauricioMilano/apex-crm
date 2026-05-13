## ADDED Requirements

### Requirement: Booking flow shows payment step when service requires prepayment
When the selected service has `requiresPrepayment = true`, the booking flow SHALL include an additional payment step between Date/Time selection and Confirmation. This step captures method and installments. If the service is covered by a subscription plan, the prepayment step is skipped.

#### Scenario: Prepayment step appears for prepay service
- **WHEN** a user selects a service with `requiresPrepayment = true`
- **THEN** the booking flow SHALL show a step 4 (Payment) between Date/Time and Confirm
- **AND** step 4 SHALL display: method selector (active methods only), installment selector (shown only if method requires installments), card last four digits (optional)

#### Scenario: Prepayment step hidden for non-prepay service
- **WHEN** a user selects a service with `requiresPrepayment = false`
- **THEN** the booking flow SHALL remain at 4 steps (no payment step)

#### Scenario: Prepayment step skipped when subscription covers the service
- **WHEN** a user selects a service with `requiresPrepayment = true`
- **AND** the selected client has an active subscription that covers this service
- **THEN** the payment step SHALL be skipped
- **AND** the booking proceeds directly to confirmation

#### Scenario: Prepayment creates pending Payment
- **WHEN** the operator confirms a booking with prepayment
- **THEN** a Payment record SHALL be created with: amount = service price, paymentMethodId, installments, cardLastFour (if provided), status = pending, referenceType = appointment
- **AND** the appointment SHALL be created linked to this payment
- **AND** the payment SHALL appear as "Pending" in the appointment detail

#### Scenario: Prepayment method shown in payment history
- **WHEN** viewing the appointment detail page
- **AND** a prepayment was recorded at booking
- **THEN** the payment SHALL appear in the payments list with status "pending"
