## ADDED Requirements

### Requirement: Confirm Payment modal opens automatically on appointment completion
When an appointment status changes to `completed`, the system SHALL auto-open a "Confirm Payment" modal with default values pre-filled. The modal SHALL NOT open if the appointment is linked to an active subscription plan (service is covered).

#### Scenario: Modal auto-opens on completion (no subscription)
- **WHEN** an operator changes appointment status to `completed`
- **AND** the appointment has no `clientSubscriptionId`
- **THEN** the system SHALL auto-open the Confirm Payment modal
- **AND** the modal SHALL pre-fill: amount = service price, method = default active method for the organization, installments = 1

#### Scenario: Modal does NOT open when subscription covers the service
- **WHEN** an operator changes appointment status to `completed`
- **AND** the appointment has `clientSubscriptionId` set
- **THEN** no payment modal SHALL appear
- **AND** no Payment record is auto-created

#### Scenario: Modal with pre-filled data from prepayment
- **WHEN** a prepayment was already recorded at booking time (status = pending)
- **AND** the appointment reaches `completed`
- **THEN** the modal SHALL open pre-filled with the prepayment's method, installments, and amount
- **AND** the operator can edit and confirm to finalize (update payment status to `completed`)

### Requirement: Installment picker with interest calculation
The modal SHALL include an installment selector that shows the calculated per-installment value in real time. The calculation SHALL use the hierarchical interest rate (service.interestRate ?? org.defaultInterestRate ?? 0).

#### Scenario: Installment calculation display
- **WHEN** the operator selects method = Credit
- **THEN** the installment selector SHALL appear with options 1x through 12x
- **WHEN** the operator selects 3x with effective rate 2% a.m. and amount R$ 150
- **THEN** the modal SHALL display "3x de R$ 52,00 (2% a.m.)"
- **WHEN** the operator selects method = Debit
- **THEN** the parcel selector SHALL be hidden (debit is always 1x)

#### Scenario: Confirm and create payment
- **WHEN** the operator clicks "Confirm" in the modal
- **THEN** a Payment record SHALL be created with: amount (edited or default), paymentMethodId, installments, cardLastFour (if provided), status = completed, referenceType = appointment, referenceId = appointment.id, description, paidAt = now
- **AND** the modal SHALL close
- **AND** the payment SHALL appear in the appointment detail's payment list

#### Scenario: Cancel modal
- **WHEN** the operator clicks "Cancel" or closes the modal
- **THEN** no Payment is created
- **AND** the appointment remains in `completed` status without a payment recorded
