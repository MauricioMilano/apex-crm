## MODIFIED Requirements

### Requirement: Admin can view all email templates

**Change**: The template list now shows 23 templates instead of 3, grouped into 6 categories instead of 3.

#### Scenario: View template list with all categories
- **WHEN** admin navigates to Email settings page
- **THEN** the system SHALL show all 23 templates grouped by category (appointment, lead, client, subscription, team, auth) with name, subject preview, and last updated date

#### Scenario: New categories appear in filter
- **WHEN** admin views the template list
- **THEN** the categories `subscription`, `team`, and `auth` SHALL be displayed alongside the existing `appointment`, `lead`, and `client` categories

### Requirement: Built-in default templates exist for all categories

**Change**: Default templates now cover subscription, team, and auth categories in addition to the original 3.

#### Scenario: All 23 templates available as defaults
- **WHEN** no custom templates exist in the database for an organization
- **THEN** all 23 built-in default templates from source code SHALL be available as fallbacks for sending

#### Scenario: Each template has valid required variables
- **WHEN** a new template is defined in `templates.ts`
- **THEN** its required variables SHALL be registered in `templateRequiredVars` and validated by unit tests

### Requirement: Templates use {{var}} placeholder system across all categories

**Change**: The {{var}} system is unchanged, but now applies to all 23 templates.

#### Scenario: All template variables are documented
- **WHEN** a new template is added
- **THEN** its variables SHALL be documented in the `templateRequiredVars` record and in the design document

#### Scenario: Unknown variable in new templates handled gracefully
- **WHEN** a template contains `{{unknownVar}}` and no matching data is provided
- **THEN** the placeholder SHALL be replaced with an empty string (same behavior as existing system)
