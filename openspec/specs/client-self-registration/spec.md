## Description

Client self-registration flow allowing visitors to create an account without an invite link by selecting their organization and providing their details.

## Requirements

### Requirement: Client self-registration with org selection
The system SHALL allow any visitor to create a client account by accessing `/portal/register` and selecting their organization from an autocomplete dropdown. The system SHALL NOT require an invite link (`?org=` URL parameter) for registration.

#### Scenario: Successful registration with org selection
- **WHEN** a visitor accesses `/portal/register`, types at least 2 characters in the org search field, selects an organization from the results, fills in first name, last name, email, password, and submits
- **THEN** the system creates a User record with role `client` and a Client record, sets a session cookie, and redirects to `/portal/dashboard`

#### Scenario: Missing organization selection
- **WHEN** a visitor accesses `/portal/register` and submits the form without selecting an organization
- **THEN** the system SHALL show a validation error "Please select your organization"

#### Scenario: Email already registered in the organization
- **WHEN** a visitor submits the registration form with an email that already exists in the selected organization
- **THEN** the system SHALL return an error "Email already registered"

### Requirement: Optional birth date collection
The system SHALL allow collecting an optional birth date during client self-registration.

#### Scenario: Registration with birth date
- **WHEN** a visitor fills in all required fields plus an optional birth date and submits
- **THEN** the system SHALL store the birth date on both the User and Client records

#### Scenario: Registration without birth date
- **WHEN** a visitor submits the registration form leaving the birth date field empty
- **THEN** the system SHALL create the account successfully with birth date as null

### Requirement: Public register page access
The system SHALL allow unauthenticated visitors to access `/portal/register` without being redirected to the login page.

#### Scenario: Unauthenticated access to register page
- **WHEN** an unauthenticated visitor navigates to `/portal/register`
- **THEN** the system SHALL display the registration form instead of redirecting to `/portal/login`

### Requirement: Auto-login after registration
The system SHALL automatically set a session cookie and redirect the new client to the dashboard upon successful registration.

#### Scenario: Auto-redirect to dashboard
- **WHEN** a visitor completes registration successfully
- **THEN** the system SHALL set an HTTP-only session cookie and redirect to `/portal/dashboard`
