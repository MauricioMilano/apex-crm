## ADDED Requirements

### Requirement: Organization can set default interest rate
The Organization Settings SHALL include a `defaultInterestRate` field (monthly percentage, decimal, nullable). This rate serves as the baseline for installment interest calculations across all services.

#### Scenario: Admin sets default interest rate
- **WHEN** an admin navigates to Settings → Organization
- **THEN** the admin SHALL see a "Default Interest Rate (% per month)" field
- **WHEN** the admin sets it to 2.5 and saves
- **THEN** `OrganizationSetting.defaultInterestRate` SHALL be 2.5
- **AND** all services without their own interest rate SHALL use 2.5% a.m. for installment calculations

### Requirement: Service can override interest rate
Each Service SHALL have an optional `interestRate` field that overrides the organization default. When null, the org default is used. When 0, the service has no interest for installments.

#### Scenario: Service with custom interest rate
- **WHEN** an admin edits a service in Settings → Services
- **THEN** the admin SHALL see an "Interest Rate (% per month)" field (optional, defaults to empty = use org default)
- **WHEN** the admin sets it to 3.0 for a specific service
- **THEN** that service SHALL use 3.0% a.m. for installment calculations, ignoring the org default

#### Scenario: Installment formula
- **WHEN** calculating installment values
- **AND** effective rate = service.interestRate ?? orgSetting.defaultInterestRate ?? 0
- **THEN** the system SHALL use this formula: `installmentValue = totalAmount / installments * (1 + effectiveRate/100 * (installments - 1) / installments)` (simplified linear)
- **AND** if effective rate = 0, SHALL show "No interest" instead of a percentage
