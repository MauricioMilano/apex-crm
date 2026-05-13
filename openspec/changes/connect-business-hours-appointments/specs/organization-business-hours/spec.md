## ADDED Requirements

### Requirement: Organization default working hours
The system SHALL allow administrators to configure default working hours at the organization level. These hours define the standard operating schedule and serve as the fallback when an employee has no custom hours configured. The format SHALL use the same `WorkingHours` structure (7 days with `isWorking`, `startTime`, `endTime`).

#### Scenario: Admin sets default hours
- **WHEN** an admin configures default working hours in settings
- **THEN** the system persists them to `OrganizationSetting.defaultWorkingHours`
- **AND** all employees without custom hours inherit these defaults

#### Scenario: Default hours used as fallback
- **WHEN** `getAvailableSlots` is called for an employee without custom working hours
- **THEN** the system uses the organization default working hours
- **AND** if no defaults exist, treats all days as closed

### Requirement: Employee working hours persistence
The system SHALL persist employee working hours to `EmployeeProfile.workingHours` via a server action. The current localStorage-based editing SHALL be replaced with a real API call.

#### Scenario: Admin saves employee hours
- **WHEN** an admin edits an employee's working hours in Team Settings
- **THEN** the system calls `updateEmployeeWorkingHours(userId, workingHours)` server action
- **AND** persists the hours to `EmployeeProfile.workingHours`
- **AND** returns success confirmation

#### Scenario: Employee hours override org defaults
- **WHEN** an employee has custom hours configured
- **THEN** `getAvailableSlots` uses the employee's hours instead of org defaults
- **AND** the system does not fall back to org defaults for that employee

### Requirement: Working hours UI in Team Settings
The Team Settings page SHALL provide a working hours editor for each employee. The editor SHALL load existing hours from the backend, allow per-day toggle and time range editing, and persist via server action.

#### Scenario: Load existing hours
- **WHEN** an admin opens the hours editor for an employee
- **THEN** the system fetches the employee's working hours from `EmployeeProfile.workingHours`
- **AND** pre-fills the form with the current schedule
- **AND** if no custom hours exist, pre-fills with org defaults

#### Scenario: Save hours with validation
- **WHEN** an admin edits hours and clicks save
- **THEN** the system validates that `startTime` is before `endTime` on working days
- **AND** persists via `updateEmployeeWorkingHours`
- **AND** shows a success toast
