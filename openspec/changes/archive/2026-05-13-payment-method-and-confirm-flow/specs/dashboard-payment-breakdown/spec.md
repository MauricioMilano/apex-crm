## ADDED Requirements

### Requirement: Monthly Revenue card shows breakdown by payment method
The Dashboard's "Monthly Revenue" stats card SHALL be expanded to show a breakdown by payment method alongside the total. This includes a small inline bar or stacked indicator showing each method's contribution.

#### Scenario: Revenue breakdown displays
- **WHEN** the dashboard loads
- **AND** there are completed payments in the current month
- **THEN** the Monthly Revenue card SHALL display:
  - Total revenue (as before)
  - Below the total: a small colored bar segmenting revenue by payment method
  - Each segment SHALL show the method name and amount on hover
  - Method colors SHALL be consistent with the Reports page

#### Scenario: Single method month
- **WHEN** all current month payments use the same method
- **THEN** the revenue card SHALL show a single full-width bar with that method's name
- **AND** no segmentation is displayed

#### Scenario: No payments this month
- **WHEN** there are no completed payments in the current month
- **THEN** the revenue card SHALL show "No payments" and no breakdown
