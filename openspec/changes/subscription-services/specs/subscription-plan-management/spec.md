## ADDED Requirements

### Requirement: Admin can create subscription plans
The system SHALL allow admins to create subscription plans with a name, description, price, billing period, and optional global per-period appointment limit.

#### Scenario: Create a basic plan
- **WHEN** an admin submits a new subscription plan with name "Premium", price 199.00, billing period "monthly", and maxApptsPerPeriod 8
- **THEN** the system SHALL create the plan and return it with a unique ID

#### Scenario: Create a plan without global limit
- **WHEN** an admin submits a plan with maxApptsPerPeriod set to null
- **THEN** the system SHALL create the plan with unlimited appointments per period

#### Scenario: Create plan with invalid data
- **WHEN** an admin submits a plan with empty name or negative price
- **THEN** the system SHALL reject with a validation error

### Requirement: Admin can add services to a plan
The system SHALL allow admins to associate services with a subscription plan, with an optional per-service appointment limit within the period.

#### Scenario: Add a service without per-service limit
- **WHEN** an admin adds service "Haircut" to plan "Premium" without setting maxPerPeriod
- **THEN** the service SHALL be included in the plan with unlimited usage per period

#### Scenario: Add a service with per-service limit
- **WHEN** an admin adds service "Haircut" to plan "Premium" with maxPerPeriod 4
- **THEN** the service SHALL be included with a limit of 4 appointments per period

#### Scenario: Duplicate service in plan
- **WHEN** an admin attempts to add the same service twice to the same plan
- **THEN** the system SHALL reject with a duplicate error

### Requirement: Admin can update subscription plans
The system SHALL allow admins to update plan name, description, price, billing period, maxApptsPerPeriod, and isActive status.

#### Scenario: Update plan details
- **WHEN** an admin changes the price of plan "Premium" from 199.00 to 249.00
- **THEN** the system SHALL update the plan and reflect the new price

#### Scenario: Deactivate a plan
- **WHEN** an admin sets isActive to false on a plan
- **THEN** the plan SHALL no longer appear in lists of available plans

### Requirement: Admin can delete subscription plans
The system SHALL allow deletion of subscription plans that have no active client subscriptions.

#### Scenario: Delete plan with no subscriptions
- **WHEN** an admin deletes a plan that has zero client subscriptions
- **THEN** the system SHALL permanently delete the plan and its service associations

#### Scenario: Delete plan with active subscriptions
- **WHEN** an admin attempts to delete a plan that has active client subscriptions
- **THEN** the system SHALL reject with an error indicating active subscriptions exist

### Requirement: Admin can list and view subscription plans
The system SHALL list all plans for the organization with their services, pricing, and status.

#### Scenario: List all plans
- **WHEN** an admin opens the plans settings page
- **THEN** the system SHALL display all plans with name, price, billing period, services count, and active status

#### Scenario: View plan details
- **WHEN** an admin clicks on a specific plan
- **THEN** the system SHALL show full plan details including included services, limits, and subscription count
