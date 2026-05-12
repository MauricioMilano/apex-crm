## ADDED Requirements

### Requirement: Send password reset email

The system SHALL send a password reset email with a secure link when a user requests a password reset.

#### Scenario: Password reset email sent
- **WHEN** a user requests a password reset via a new `requestPasswordReset()` action and SMTP is enabled
- **THEN** the system SHALL send an email using the `password-reset` template with a reset link

#### Scenario: Password reset link expires
- **WHEN** a password reset email is sent
- **THEN** the reset link SHALL include a token that expires after 1 hour

#### Scenario: Password reset variables populated
- **WHEN** a password reset email is sent
- **THEN** the following variables SHALL be populated: `{{userName}}`, `{{resetUrl}}`, `{{orgName}}`

#### Scenario: Reset fails for unknown email
- **WHEN** a password reset is requested for an email not registered in any organization
- **THEN** the system SHALL still return success (to avoid email enumeration) but SHALL NOT send any email

### Requirement: Send email verification link

The system SHALL send an email verification link when a new user registers (client or admin) and email verification is enabled.

#### Scenario: Verification email sent on registration
- **WHEN** `registerClient()` or `registerUser()` succeeds, email verification is enabled in org settings, and SMTP is enabled
- **THEN** the system SHALL send an email using the `email-verification` template with a verification link

#### Scenario: Verification email variables populated
- **WHEN** an email verification email is sent
- **THEN** the following variables SHALL be populated: `{{userName}}`, `{{verifyUrl}}`, `{{orgName}}`

#### Scenario: Verification is optional
- **WHEN** email verification is disabled in organization settings
- **THEN** no verification email SHALL be sent and the user SHALL be registered without verification

### Requirement: Send magic link for passwordless login

The system SHALL send a magic link email for passwordless login.

#### Scenario: Magic link email sent
- **WHEN** a user requests a magic link login and SMTP is enabled
- **THEN** the system SHALL send an email using the `magic-link` template with a one-time login URL

#### Scenario: Magic link variables populated
- **WHEN** a magic link email is sent
- **THEN** the following variables SHALL be populated: `{{userName}}`, `{{magicLinkUrl}}`, `{{orgName}}`
