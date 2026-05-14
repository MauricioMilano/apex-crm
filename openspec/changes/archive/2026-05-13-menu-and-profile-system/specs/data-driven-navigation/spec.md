## ADDED Requirements

### Requirement: Navigation items are defined in a single config
The system SHALL maintain all navigation items in a single configuration file at `src/lib/navigation.ts`.

#### Scenario: Config contains all sidebar sections and items
- **WHEN** the system loads the sidebar
- **THEN** it reads sections and items from `NAV_CONFIG` exported by `src/lib/navigation.ts`
- **AND** the sidebar displays the same items as before (no visual regression)

#### Scenario: Config contains all portal navigation items
- **WHEN** the system loads the Client Portal layout
- **THEN** it reads portal navigation items from `NAV_CONFIG` filtered by `context: 'portal'`
- **AND** the portal nav displays: Dashboard, Book Appointment, My Appointments, Plans, My Subscriptions, Profile

#### Scenario: Config contains all settings sidebar items
- **WHEN** the system loads the Settings layout
- **THEN** it reads settings navigation items from `NAV_CONFIG` filtered by `context: 'settings'`
- **AND** the settings nav displays: Profile, General, Business Hours, Services, Plans, Lead Statuses, Team, Locations, Email, Payment Methods, Webhooks, API Keys

### Requirement: Navigation filters items by user role
The system SHALL hide navigation items that the current user's role does not have permission to see.

#### Scenario: Employee cannot see admin-only nav items
- **WHEN** a user with `role: 'employee'` views the sidebar
- **THEN** items with `requiredRole: ['super_admin', 'admin']` are hidden
- **AND** sections that become empty after filtering are also hidden

#### Scenario: Admin can see all nav items
- **WHEN** a user with `role: 'admin'` views the sidebar
- **THEN** all items are visible
- **AND** no filtering occurs

#### Scenario: Item without requiredRole is visible to everyone
- **WHEN** a nav item has no `requiredRole` field
- **THEN** it is visible to all authenticated users regardless of role

### Requirement: Navigation supports dynamic badges
The system SHALL support displaying numeric badges on navigation items based on configurable keys.

#### Scenario: Sidebar shows unread count badge
- **WHEN** a nav item has `badge: 'leads:unread'`
- **THEN** the sidebar component resolves this key to the count of unread leads (or 0)
- **AND** displays the badge next to the nav item label

#### Scenario: Badge is zero
- **WHEN** the resolved badge count is 0
- **THEN** the badge is not displayed
