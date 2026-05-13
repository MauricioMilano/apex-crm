## ADDED Requirements

### Requirement: Reports page filters by payment method
The Financial Reports page SHALL include a payment method filter in addition to existing date and type filters. The filter SHALL list only active payment methods.

#### Scenario: Filter payments by method
- **WHEN** an operator selects "Credit" in the payment method filter
- **THEN** the table and charts SHALL show only payments with that method
- **AND** summary cards (Total Revenue, Payments Count, etc.) SHALL recalculate accordingly

### Requirement: Payment distribution chart by method
The Reports page SHALL include a chart showing revenue distribution by payment method (pie or stacked bar).

#### Scenario: Distribution chart renders
- **WHEN** there are payments with multiple methods in the selected period
- **THEN** a pie chart SHALL display each method's share of total revenue
- **AND** hovering a slice SHALL show method name and amount

#### Scenario: Distribution chart with single method
- **WHEN** all payments in the period use the same method
- **THEN** the chart SHALL show a single full segment with the method name

### Requirement: Installments receivable view
The Reports page SHALL include a section showing payments with installments > 1 and their projected future receivable amounts.

#### Scenario: Receivables table
- **WHEN** there are payments with `installments > 1`
- **THEN** a "Receivables" section SHALL display: payment date, client, total amount, number of installments, remaining installments, projected total remaining value
- **AND** remaining installments SHALL be computed as: `totalAmount / installments * (installments - 1)` (next installments assumed monthly from paidAt)

#### Scenario: No receivables
- **WHEN** all payments are single-installment (installments = 1)
- **THEN** the receivables section SHALL display "No installment receivables"

### Requirement: CSV/PDF export includes payment method
The CSV export SHALL include a `paymentMethod` column. If a payment has no method, the column SHALL be empty.

#### Scenario: Export with method column
- **WHEN** an operator exports the payment list as CSV
- **THEN** the CSV SHALL include the column `paymentMethod`
- **AND** each row SHALL contain the payment method name (or empty)
- **AND** the `installments` and `cardLastFour` columns SHALL also be included
