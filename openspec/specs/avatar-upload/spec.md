## ADDED Requirements

### Requirement: User can upload an avatar image
The system SHALL allow authenticated users to upload an avatar image via a POST API endpoint.

#### Scenario: User uploads a valid image
- **WHEN** user selects a PNG/JPEG/WebP image under 2MB and confirms upload
- **THEN** the system saves the file to `/app/uploads/avatars/` with a unique filename
- **AND** updates `User.avatar` with the URL path `/api/files/avatars/<filename>`
- **AND** returns the new avatar URL
- **AND** the UI updates to show the new image immediately

#### Scenario: User uploads a file that exceeds size limit
- **WHEN** user selects a file larger than 2MB
- **THEN** the system returns a 413 error
- **AND** shows an error toast "File too large. Maximum 2MB."

#### Scenario: User uploads an unsupported file type
- **WHEN** user selects a file that is not PNG, JPEG, or WebP
- **THEN** the system returns a 400 error
- **AND** shows an error toast "Unsupported file type. Use PNG, JPEG, or WebP."

### Requirement: Avatar image is served via API route
The system SHALL serve uploaded avatar images through a dedicated API route at `/api/files/avatars/<filename>`.

#### Scenario: Client requests avatar image
- **WHEN** browser requests `GET /api/files/avatars/u_abc123_1690000000.jpg`
- **THEN** the system reads the file from `/app/uploads/avatars/u_abc123_1690000000.jpg`
- **AND** responds with the image content and appropriate Content-Type header
- **AND** sets Cache-Control header for browser caching

#### Scenario: Requested avatar file does not exist
- **WHEN** browser requests a non-existent filename
- **THEN** the system returns a 404 response

### Requirement: Avatar is displayed in the UI
The system SHALL display the user's avatar image (or initials fallback) in all avatar instances across the application.

#### Scenario: User has uploaded an avatar
- **WHEN** `User.avatar` is not null/empty
- **THEN** the Sidebar, Header dropdown, and Profile page show `AvatarImage` with the avatar URL
- **AND** the component falls back to initials if the image fails to load

#### Scenario: User has not uploaded an avatar
- **WHEN** `User.avatar` is null or empty
- **THEN** all avatar instances display `AvatarFallback` with initials (existing behavior preserved)

### Requirement: Docker volume persists uploaded avatars
The system SHALL mount a Docker volume at `/app/uploads/` so that uploaded files survive container restarts.

#### Scenario: Container restarts with existing uploads
- **WHEN** the Docker container is restarted
- **THEN** previously uploaded avatar files are still available at their original URLs
- **AND** no data loss occurs
