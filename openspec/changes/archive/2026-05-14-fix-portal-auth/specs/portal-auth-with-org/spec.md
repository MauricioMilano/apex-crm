## ADDED Requirements

### Requirement: Portal login SHALL include org selector

The client portal login page MUST display an organization slug autocomplete dropdown before the email/password fields. The user MUST select or type their organization slug to proceed. The login request MUST include the `orgSlug` so the server can scope authentication to that organization.

#### Scenario: Successful login with org selection
- **WHEN** user navigates to `/portal/login`
- **THEN** the page shows an "Organization" autocomplete field above email and password
- **WHEN** user types 2+ characters in the org field
- **THEN** the page fetches matching organizations from `/api/v1/auth/orgs/lookup?q=...` and shows a dropdown
- **WHEN** user selects an org from the dropdown, enters valid credentials, and clicks "Sign In"
- **THEN** the system calls `/api/v1/auth/login` with `{ email, password, orgSlug }`
- **THEN** the server looks up the user by email AND organization slug
- **THEN** on success, the user is redirected to `/portal/dashboard`

#### Scenario: Login fails when org slug doesn't match
- **WHEN** user enters credentials for a valid email but the org slug doesn't match the user's organization
- **THEN** the server returns 401 "Invalid credentials"
- **THEN** the page shows a toast error "Invalid email or password for this organization"

#### Scenario: No orgs match the typed slug
- **WHEN** user types an org slug that doesn't match any organization
- **THEN** the dropdown shows "No organizations found"
- **THEN** the user cannot submit the form (org field is required)

### Requirement: Portal login SHALL NOT display demo credentials

The client portal login page MUST NOT display any hardcoded demo credentials. The line containing `Demo: client@example.com / Password123!` MUST be removed.

#### Scenario: Login page renders without credentials
- **WHEN** user navigates to `/portal/login`
- **THEN** no hardcoded email/password pairs are displayed anywhere on the page

### Requirement: API SHALL expose org lookup endpoint

A GET endpoint at `/api/v1/auth/orgs/lookup?q=<query>` SHALL return matching organizations. A GET endpoint at `/api/v1/auth/orgs/lookup?slug=<slug>` SHALL return a single organization by exact slug. These are used by the org autocomplete and by the register page to resolve org names.

#### Scenario: Search orgs by partial slug
- **WHEN** a GET request is sent to `/api/v1/auth/orgs/lookup?q=acme`
- **THEN** the response is `{ success: true, data: [{ id, name, slug }] }` with orgs whose slug contains "acme"
- **THEN** results are limited to 10 items

#### Scenario: Lookup org by exact slug
- **WHEN** a GET request is sent to `/api/v1/auth/orgs/lookup?slug=acmebiz`
- **THEN** the response is `{ success: true, data: { id, name, slug } }` for the matching org
- **WHEN** a GET request is sent to `/api/v1/auth/orgs/lookup?slug=doesnotexist`
- **THEN** the response is `{ success: false, error: "Organization not found" }` with status 404

### Requirement: Portal register SHALL resolve org name from slug

The client portal register page MUST resolve the organization name from the `?org=` URL parameter by calling the org lookup API, and display the real organization name (not the raw slug) on the registration form header ("Join ACME Business Solutions" instead of "Join acmebiz").

#### Scenario: Register with valid org slug
- **WHEN** user navigates to `/portal/register?org=acmebiz`
- **THEN** the page fetches org info from `/api/v1/auth/orgs/lookup?slug=acmebiz`
- **THEN** the page displays "Join ACME Business Solutions" as the header
- **WHEN** user submits the registration form
- **THEN** the registration proceeds with `orgSlug: "acmebiz"`

#### Scenario: Register with invalid org slug
- **WHEN** user navigates to `/portal/register?org=doesnotexist`
- **THEN** the org lookup returns 404
- **THEN** the page shows "Invalid Link" error (same as missing org)

### Requirement: loginUser SHALL support org-scoped authentication

The `loginUser` server action MUST accept an optional `orgSlug` parameter. When provided, the user lookup MUST be scoped to users belonging to an organization with that slug. When omitted, the current behavior (lookup by email only) is preserved for backward compatibility.

#### Scenario: Login with orgSlug scopes lookup
- **WHEN** `loginUser(email, password, orgSlug)` is called
- **THEN** the query is `prisma.user.findFirst({ where: { email, organization: { slug: orgSlug } } })`
- **THEN** authentication proceeds only if the user belongs to that organization

#### Scenario: Login without orgSlug uses existing behavior
- **WHEN** `loginUser(email, password)` is called (no orgSlug)
- **THEN** the query is `prisma.user.findUnique({ where: { email } })` (current behavior)
