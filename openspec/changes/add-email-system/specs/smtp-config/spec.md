## ADDED Requirements

### Requirement: Admin can configure SMTP server

The system SHALL provide a settings page where admin users can configure SMTP server connection details.

#### Scenario: Save valid SMTP configuration
- **WHEN** admin fills in smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, smtpSecure and clicks Save
- **THEN** the configuration SHALL be persisted to the OrganizationSetting table with the password encrypted via AES-256-CBC

#### Scenario: Save with missing optional fields
- **WHEN** admin saves SMTP config with only smtpHost provided
- **THEN** the system SHALL accept the partial configuration and store it

#### Scenario: Validation error on empty host
- **WHEN** admin submits SMTP config with empty smtpHost
- **THEN** the system SHALL return a validation error and not persist

### Requirement: Admin can toggle SMTP enable/disable

The system SHALL provide a switch to globally enable or disable email sending.

#### Scenario: Enable SMTP
- **WHEN** admin toggles SMTP enabled ON and saves
- **THEN** the system SHALL set smtpEnabled to true in OrganizationSetting

#### Scenario: Disable SMTP
- **WHEN** admin toggles SMTP enabled OFF and saves
- **THEN** the system SHALL set smtpEnabled to false and no emails SHALL be sent

### Requirement: Admin can test SMTP connection

The system SHALL provide a "Test Connection" button that attempts to verify SMTP connectivity.

#### Scenario: Successful connection test
- **WHEN** admin clicks "Test Connection" with valid SMTP settings
- **THEN** the system SHALL attempt to connect to the SMTP server and show a success toast

#### Scenario: Failed connection test
- **WHEN** admin clicks "Test Connection" with invalid SMTP settings
- **THEN** the system SHALL show an error toast with the connection error message

### Requirement: SMTP password is never exposed to frontend

The system SHALL never return the actual SMTP password in API responses.

#### Scenario: GET returns masked password
- **WHEN** the frontend fetches SMTP settings
- **THEN** the smtpPass field SHALL be returned as "••••••" (6 bullet characters)

### Requirement: SMTP settings persist across page reloads

The system SHALL load saved SMTP settings from the database on page load.

#### Scenario: Load saved settings
- **WHEN** admin navigates to Email settings page
- **THEN** the form SHALL be pre-populated with the saved SMTP configuration from the database
