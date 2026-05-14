## ADDED Requirements

### Requirement: Admin can view all email templates

The system SHALL display a list of all email templates grouped by category.

#### Scenario: View template list
- **WHEN** admin navigates to Email settings page
- **THEN** the system SHALL show all templates grouped by category (appointment, lead, client) with name, subject preview, and last updated date

### Requirement: Admin can edit email template subject and body

The system SHALL provide an editor for admin to modify the subject and HTML body of each template.

#### Scenario: Edit template subject
- **WHEN** admin opens a template editor and changes the subject line
- **THEN** the system SHALL save the new subject and show a success toast

#### Scenario: Edit template HTML body
- **WHEN** admin opens a template editor and modifies the bodyHtml content
- **THEN** the system SHALL save the new bodyHtml and show a success toast

#### Scenario: Validation rejects empty subject
- **WHEN** admin tries to save a template with an empty subject
- **THEN** the system SHALL return a validation error

#### Scenario: Validation rejects empty body
- **WHEN** admin tries to save a template with an empty bodyHtml
- **THEN** the system SHALL return a validation error

### Requirement: Admin can preview template with sample data

The system SHALL render a live preview of the template using sample data.

#### Scenario: Preview renders with sample data
- **WHEN** admin is editing a template and clicks Preview
- **THEN** the system SHALL render the subject and bodyHtml with sample variable values and display the result

#### Scenario: Preview updates in real-time
- **WHEN** admin modifies bodyHtml content
- **THEN** the preview SHALL update automatically (debounced) to reflect changes

### Requirement: Templates use {{var}} placeholder system

The system SHALL support `{{variableName}}` placeholders in subject and bodyHtml.

#### Scenario: Placeholder replaced with actual value
- **WHEN** a template containing `{{clientName}}` is rendered with data `{clientName: "John"}`
- **THEN** the output SHALL contain "John" instead of "{{clientName}}"

#### Scenario: Unknown placeholder preserved as-is
- **WHEN** a template contains `{{unknownVar}}` and no matching data is provided
- **THEN** the placeholder SHALL be replaced with an empty string

#### Scenario: HTML escaping of variable values
- **WHEN** a variable value contains HTML characters like `<script>`
- **THEN** the characters SHALL be HTML-escaped (`&lt;script&gt;`) before insertion

### Requirement: Built-in default templates exist

The system SHALL ship with built-in default templates for each category that serve as fallback.

#### Scenario: Default templates available on fresh DB
- **WHEN** no custom templates exist in the database for an organization
- **THEN** the built-in default templates from source code SHALL be used for sending

#### Scenario: Custom template overrides default
- **WHEN** a custom template with the same name exists in the database
- **THEN** the database version SHALL be used instead of the built-in default
