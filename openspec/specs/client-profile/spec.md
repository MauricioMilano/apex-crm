## ADDED Requirements

### Requirement: Client can update personal profile
The system SHALL allow client portal users to update their personal information (first name, last name, email, phone) and persist changes to BOTH the User record and the Client record.

#### Scenario: Client saves profile changes successfully
- **WHEN** client navigates to `/portal/profile` and edits `firstName`, `lastName`, `email`, or `phone` and clicks "Save Changes"
- **THEN** the system calls `prisma.user.update()` with the new values
- **AND** the system calls `prisma.client.update()` on the matching Client record
- **AND** the auth context (`currentUser`) reflects the new values immediately
- **AND** the UI shows a success toast

#### Scenario: Client saves profile when no Client record exists
- **WHEN** the logged-in User has `role='client'` but no matching Client record is found
- **THEN** the system updates only the User record
- **AND** returns success without error

#### Scenario: Email update violates unique constraint
- **WHEN** client changes email to an address already used by another User
- **THEN** the system returns an error
- **AND** the UI shows an error toast
- **AND** the email field is not updated

### Requirement: Client can change password
The system SHALL allow client portal users to change their password by providing current password, new password, and confirmation.

#### Scenario: Client changes password successfully
- **WHEN** client navigates to `/portal/profile`, fills in correct `currentPassword`, a `newPassword` of 8+ characters, and matching `confirmPassword`
- **THEN** the system verifies `currentPassword` via bcrypt
- **AND** hashes the new password with bcrypt (12 rounds)
- **AND** updates `User.passwordHash`
- **AND** shows a success toast

#### Scenario: Client provides incorrect current password
- **WHEN** client fills in wrong `currentPassword`
- **THEN** the system returns an error
- **AND** shows an error toast "Current password is incorrect"

#### Scenario: Client provides mismatched new passwords
- **WHEN** `newPassword` does not match `confirmPassword`
- **THEN** the Zod schema validation fails on the client
- **AND** the form shows "Passwords don't match" error on `confirmPassword` field

### Requirement: Client notification preferences persist
The system SHALL persist notification preference toggles (Email, SMS, 24h Reminders) in the User's `notificationPreferences` JSON field.

#### Scenario: Client saves notification preferences
- **WHEN** client toggles notification switches and clicks "Save Preferences"
- **THEN** the system saves the preferences object to `User.notificationPreferences`
- **AND** shows a success toast
- **AND** preferences are restored on page reload

#### Scenario: Client has no saved preferences (new user)
- **WHEN** a user with no `notificationPreferences` visits `/portal/profile`
- **THEN** the UI defaults all toggles to `true` (enabled)
