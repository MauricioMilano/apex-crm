## ADDED Requirements

### Requirement: Monthly Revenue card uses Payment records

The Dashboard Monthly Revenue card SHALL calculate revenue by summing `Payment.amount` records instead of summing appointment service prices.

#### Scenario: Dashboard shows revenue from payments in current month
- **WHEN** the Dashboard page loads
- **THEN** Monthly Revenue SHALL equal the sum of all `completed` Payments where `paidAt` falls within the current calendar month
- **AND** Payments with status `adjusted` SHALL be excluded from the sum

#### Scenario: Dashboard revenue trend compares current vs previous month
- **WHEN** the Dashboard page loads
- **THEN** the revenue trend SHALL compare current month total vs previous month total
- **AND** both totals SHALL use the same Payment-based calculation

#### Scenario: Dashboard card description reflects payment-based calculation
- **WHEN** the Dashboard page loads
- **THEN** the Monthly Revenue card SHALL display "recorded payments" (or similar) instead of "completed appointments" as the description

### Requirement: Plan-covered appointments are excluded from revenue

Appointments that belong to a subscription plan (have `clientSubscriptionId`) SHALL NOT contribute to revenue individually.

#### Scenario: Plan appointment does not create revenue contribution
- **WHEN** calculating revenue
- **THEN** appointments with `clientSubscriptionId` set SHALL NOT have their service price counted
- **AND** their revenue SHALL be captured through the subscription Payment mechanism instead
