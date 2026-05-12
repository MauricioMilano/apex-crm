## ADDED Requirements

### Requirement: Client can view their active subscriptions on the dashboard
The client portal dashboard SHALL display a summary card showing each active subscription with plan name, usage progress, and status.

#### Scenario: Dashboard shows subscription summary
- **WHEN** a client with active subscription "Premium" (max 8, used 3) logs into the portal
- **THEN** the dashboard SHALL display a card showing "Premium — 3 of 8 appointments used this month" with a progress bar

#### Scenario: Dashboard with multiple subscriptions
- **WHEN** a client has 2 active subscriptions
- **THEN** the dashboard SHALL show one card per subscription

#### Scenario: Dashboard with no subscriptions
- **WHEN** a client has no active subscriptions
- **THEN** the dashboard SHALL NOT show any subscription card (or show "No active plans")

### Requirement: Client can view available plans
The system SHALL provide a page `/portal/plans` listing all active subscription plans the organization offers.

#### Scenario: View available plans
- **WHEN** a client navigates to `/portal/plans`
- **THEN** the system SHALL display a list of all active plans with name, description, price, billing period, and included services

#### Scenario: Subscribe to a plan
- **WHEN** a client clicks "Subscribe" on a plan they don't already have
- **THEN** the system SHALL create a new ClientSubscription with status "active" (pending admin approval if configured) — Note: MVP creates it immediately

### Requirement: Client has a dedicated subscriptions management page
The system SHALL provide a page `/portal/subscriptions` showing all of the client's subscriptions (active, cancelled, expired) with details.

#### Scenario: Subscriptions page lists all subscriptions
- **WHEN** a client navigates to `/portal/subscriptions`
- **THEN** the system SHALL display all their subscriptions with plan name, status badge, period dates, usage (x of y), and included services

#### Scenario: Cancel a subscription
- **WHEN** a client clicks "Cancel" on an active subscription
- **THEN** the system SHALL confirm via dialog, and on confirmation set status to "cancelled" and endDate to now

#### Scenario: Subscription usage details
- **WHEN** a client clicks on a subscription row
- **THEN** the system SHALL expand/show details: included services list, per-service usage if limited, and appointment history under this plan

### Requirement: Navigation includes subscriptions
The client portal navigation SHALL include "Plans" and "My Subscriptions" links.

#### Scenario: Nav links present
- **WHEN** a client views the portal navigation
- **THEN** they SHALL see links for "Plans" (`/portal/plans`) and "My Subscriptions" (`/portal/subscriptions`)
