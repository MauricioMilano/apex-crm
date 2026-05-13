## ADDED Requirements

### Requirement: Organization can manage payment methods
Organizations SHALL be able to create, read, update, and deactivate their own payment methods (debit, credit, cash, PIX, transfer, etc.) through a management UI in Organization Settings. Each method has a machine-readable code, display name, and active flag.

#### Scenario: Create a new payment method
- **WHEN** an admin navigates to Settings → Payment Methods and clicks "Add Method"
- **THEN** a form opens with fields: Name, Code (auto-generated from name, editable), Requires Installments (checkbox), Is Active (default true)
- **WHEN** the admin fills the form and saves
- **THEN** a new PaymentMethod record is created and appears in the methods list

#### Scenario: Deactivate a payment method
- **WHEN** an admin toggles a payment method to inactive
- **THEN** the method is marked inactive and no longer appears in payment method selectors
- **AND** existing Payments referencing this method are unaffected

#### Scenario: Duplicate code rejected
- **WHEN** an admin tries to create a method with a code that already exists for the organization
- **THEN** the system SHALL reject with a "code already exists" error

#### Scenario: List active methods
- **WHEN** any user views a payment method selector (in booking flow, confirm payment modal, reports filter)
- **THEN** only methods with `isActive = true` SHALL be displayed, ordered by creation date

### Requirement: System seeds default payment methods
The database seed SHALL create 5 default payment methods for each new organization: Debit, Credit, Cash, PIX, Transfer. The Credit method SHALL have `requiresInstallments = true`.

#### Scenario: Fresh organization receives defaults
- **WHEN** a new organization is created and seeded
- **THEN** the organization SHALL have 5 active payment methods: Debit, Credit, Cash, PIX, Transfer
- **AND** Credit SHALL have `requiresInstallments = true`
