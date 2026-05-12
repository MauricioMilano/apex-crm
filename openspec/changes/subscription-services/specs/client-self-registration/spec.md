## ADDED Requirements

### Requirement: Client can register via organization invite link
The system SHALL allow a new client to create an account by accessing `/portal/register?org=<slug>` where `<slug>` matches an organization's slug.

#### Scenario: Successful registration
- **WHEN** a visitor accesses `/portal/register?org=apex-crm`, fills in first name, last name, email, password, and submits
- **THEN** the system SHALL create a User with role "client" linked to the organization, create a Client record with matching email, log the user in, and redirect to `/portal/dashboard`

#### Scenario: Invalid org slug
- **WHEN** a visitor accesses `/portal/register?org=nonexistent`
- **THEN** the system SHALL show an error "Invalid registration link" and not display the registration form

#### Scenario: Email already registered
- **WHEN** a visitor submits registration with an email that already has a User in the same organization
- **THEN** the system SHALL reject with "Email already registered"

#### Scenario: Missing org parameter
- **WHEN** a visitor accesses `/portal/register` without the `org` query parameter
- **THEN** the system SHALL show an error page or prompt to use a valid registration link

### Requirement: Registration form validates required fields
The system SHALL validate first name, last name, email, and password (min 8 chars) before submission.

#### Scenario: Invalid form data
- **WHEN** a visitor submits registration with empty fields or password shorter than 8 characters
- **THEN** the system SHALL display inline validation errors and not create the account

### Requirement: Registration creates both User and Client
The system SHALL atomically create a User (for authentication) and a Client (for CRM records) during registration.

#### Scenario: Client record mirrors user data
- **WHEN** a client registers with first name "John", last name "Doe", email "john@example.com"
- **THEN** the Client record SHALL have matching firstName, lastName, and email, with isActive true

### Requirement: Registration page is accessible from login page
The client portal login page SHALL have a "Don't have an account? Register" link pointing to `/portal/register?org=<org-slug>`.

#### Scenario: Login page shows registration link
- **WHEN** a visitor is on the client portal login page
- **THEN** they SHALL see a link to create an account (registration)
