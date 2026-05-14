## ADDED Requirements

### Requirement: Internal user can view and edit their profile
The system SHALL provide a profile page at `/settings/profile` for authenticated admin and employee users.

#### Scenario: Employee navigates to profile page
- **WHEN** an authenticated employee clicks "Profile" in the header dropdown
- **THEN** the system navigates to `/settings/profile`
- **AND** displays a form pre-filled with: first name, last name, email, phone
- **AND** displays the user's current avatar (or initials fallback)
- **AND** displays the user's role as a badge
- **AND** displays the "member since" date

#### Scenario: Internal user saves profile changes
- **WHEN** user edits `firstName`, `lastName`, `phone` and clicks "Save Changes"
- **THEN** the system calls `updateUserProfile()` server action
- **AND** the auth context updates immediately
- **AND** shows a success toast

#### Scenario: Internal user changes email
- **WHEN** user edits the email field
- **THEN** the system validates uniqueness of the new email
- **AND** updates `User.email` if unique
- **AND** returns error toast if email is taken

### Requirement: Internal user can change password
The system SHALL allow internal users to change their password from the profile page.

#### Scenario: Internal user changes password successfully
- **WHEN** user fills in current password, new password (8+ chars), and confirmation
- **THEN** the system validates current password via bcrypt
- **AND** hashes and saves the new password
- **AND** shows a success toast

### Requirement: Profile page is accessible via Settings sidebar
The system SHALL include "Profile" as the first item in the Settings navigation sidebar.

#### Scenario: Profile link appears in Settings nav
- **WHEN** user navigates to any `/settings/*` page
- **THEN** the Settings sidebar displays a "Profile" link at the top
- **AND** the link is highlighted when on `/settings/profile`
