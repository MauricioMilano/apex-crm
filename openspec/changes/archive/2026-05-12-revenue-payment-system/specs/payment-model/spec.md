## ADDED Requirements

### Requirement: Payment model stores all financial events

The system SHALL have a unified `Payment` model that records every financial event (standalone appointment payments, subscription charges, pro-rata charges, refunds). The model SHALL support polymorphic references via `referenceType` + `referenceId`.

#### Scenario: Payment record is created with required fields
- **WHEN** a Payment record is created
- **THEN** it SHALL include: `id`, `organizationId`, `amount` (Decimal), `currency` (default "USD"), `status`, `referenceType`, `referenceId`, `paidAt`, `description`, `createdAt`, `updatedAt`

#### Scenario: Payment supports all financial statuses
- **WHEN** inspecting the `status` field
- **THEN** allowed values SHALL be: `pending`, `completed`, `refunded`, `failed`, `adjusted`

#### Scenario: Payment supports negative amounts for refunds
- **WHEN** creating a refund Payment
- **THEN** `amount` SHALL be negative and `status` SHALL be `refunded`

#### Scenario: Payment tracks origin via polymorphic reference
- **WHEN** querying Payments by reference
- **THEN** `referenceType` SHALL be one of: `appointment`, `subscription`
- **AND** `referenceId` SHALL store the UUID of the referenced entity

### Requirement: Payment records are retrievable via API

The system SHALL provide API endpoints to list, create, and query Payment records.

#### Scenario: List payments with date filters
- **WHEN** calling `GET /api/v1/payments?dateFrom=...&dateTo=...`
- **THEN** the response SHALL include only Payments where `paidAt` falls within the range
- **AND** results SHALL be ordered by `paidAt` descending

#### Scenario: List payments by reference
- **WHEN** calling `GET /api/v1/payments?referenceType=appointment&referenceId=...`
- **THEN** the response SHALL include all Payments matching that reference

#### Scenario: Create a manual payment record
- **WHEN** calling `POST /api/v1/payments` with valid body
- **THEN** a new Payment SHALL be created
- **AND** the response SHALL include the full Payment record

### Requirement: Payment adjustment creates new record

When a Payment needs correction, the system SHALL create a new Payment record and mark the original as `adjusted`.

#### Scenario: Staff adjusts an auto-generated payment
- **WHEN** staff creates a new Payment correcting a previous one
- **AND** sets `adjustedPaymentId` to the original Payment's ID
- **THEN** the original Payment's status SHALL change to `adjusted`
- **AND** the new Payment SHALL reflect the corrected amount

#### Scenario: Adjusted payments are excluded from revenue
- **WHEN** calculating total revenue
- **THEN** Payments with status `adjusted` SHALL be excluded from the sum
