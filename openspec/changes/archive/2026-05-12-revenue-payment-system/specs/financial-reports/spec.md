## ADDED Requirements

### Requirement: Financial Reports page displays revenue data

The system SHALL have a dedicated Financial Reports page accessible from the dashboard navigation, displaying revenue data with date range filtering, charts, and export.

#### Scenario: Financial reports page loads with current month data
- **WHEN** the user navigates to the financial reports page
- **THEN** the page SHALL display revenue data for the current month by default
- **AND** SHALL show total revenue, total payments count, and average payment value

#### Scenario: User can filter by date range
- **WHEN** the user selects a custom date range
- **THEN** all displayed data SHALL update to reflect only Payments within that range

#### Scenario: User can filter by payment type
- **WHEN** the user selects a payment type filter (appointment / subscription / all)
- **THEN** displayed data SHALL be filtered to the selected `referenceType`

#### Scenario: Reports page shows revenue breakdown chart
- **WHEN** viewing the reports page
- **THEN** a bar or line chart SHALL display revenue per month for the filtered period
- **AND** the chart SHALL differentiate between appointment revenue and subscription revenue

#### Scenario: Revenue table shows individual payments
- **WHEN** viewing the reports page
- **THEN** a table SHALL list individual Payment records with columns: date, description, type (appointment/subscription), amount, status
- **AND** results SHALL be paginated (20 per page)

#### Scenario: CSV export downloads payment data
- **WHEN** the user clicks "Export CSV"
- **THEN** a CSV file SHALL be downloaded containing all Payment records matching the current filters
- **AND** the CSV SHALL include columns: paidAt, referenceType, referenceId, amount, currency, status, description

#### Scenario: Reports page compares current vs previous period
- **WHEN** viewing the reports page
- **THEN** a summary card SHALL show current period total vs previous period total with percentage change
