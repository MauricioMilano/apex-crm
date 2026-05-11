## ADDED Requirements

### Requirement: User can view all lead statuses in a table
The system SHALL display all lead statuses for the current organization in a settings page at `/settings/lead-statuses`.

#### Scenario: View lead statuses table
- **WHEN** user navigates to `/settings/lead-statuses`
- **THEN** system displays a table with columns: Name, Color, Default, Lead Count, Order, Actions

#### Scenario: Statuss sorted by order
- **WHEN** the table renders
- **THEN** rows are sorted ascending by the `order` field

### Requirement: User can create a new lead status
The system SHALL allow users to create a new lead status via a dialog form.

#### Scenario: Create status with valid data
- **WHEN** user clicks "Add Status" and fills in a name, selects a color, and submits
- **THEN** the new status is created with `isDefault: false`, `order` set to one greater than the current maximum, and the status appears in the table

#### Scenario: Create status as default
- **WHEN** user enables "Set as default" during creation and submits
- **THEN** the status is created with `isDefault: true` and `order` set to 1 (pushing all others down)

#### Scenario: Create status without name
- **WHEN** user submits the form with an empty name
- **THEN** the system shows a validation error and does not create the status

### Requirement: User can edit an existing lead status
The system SHALL allow users to edit a lead status via a dialog form pre-filled with current values.

#### Scenario: Edit status name and color
- **WHEN** user clicks the edit button on a status row
- **THEN** a dialog opens with the current name, color, and default state pre-filled
- **WHEN** user saves changes
- **THEN** the status is updated and the table reflects the new values

#### Scenario: Toggle default status
- **WHEN** user enables "Set as default" on a non-default status
- **THEN** the selected status becomes `isDefault: true` and all other statuses are set to `isDefault: false`

### Requirement: User can delete a lead status
The system SHALL allow users to delete a lead status with confirmation.

#### Scenario: Delete status with no leads
- **WHEN** user clicks delete on a status with zero leads and confirms
- **THEN** the status is removed from the database and the table

#### Scenario: Delete status with leads is blocked
- **WHEN** user clicks delete on a status that has leads assigned to it
- **THEN** the system shows a message explaining the status cannot be deleted because leads reference it

#### Scenario: Delete the only status
- **WHEN** there is exactly one status and user attempts to delete it
- **THEN** the delete button is disabled with a message explaining at least one status is required

### Requirement: User can reorder lead statuses
The system SHALL allow users to change the display order of lead statuses using up/down arrow buttons.

#### Scenario: Move status down
- **WHEN** user clicks the down arrow on a status row
- **THEN** the status's `order` is incremented and the row below's `order` is decremented, swapping their positions

#### Scenario: Move status up
- **WHEN** user clicks the up arrow on a status row
- **THEN** the status's `order` is decremented and the row above's `order` is incremented, swapping their positions

#### Scenario: Reorder reflects on leads page
- **WHEN** user reorders statuses in settings
- **THEN** the kanban board columns and per-status count badges on `/leads` reflect the new order

### Requirement: Color palette for lead statuses
The system SHALL restrict color selection to a predefined Tailwind color palette.

#### Scenario: Color displayed as swatch
- **WHEN** a status has a color value
- **THEN** the settings table displays a colored circle (swatch) matching the selected color

#### Scenario: Color stored as Tailwind token
- **WHEN** a user selects a color from the palette
- **THEN** the color is stored as the Tailwind token name (e.g., `"blue"`, `"red"`) in the `color` field
