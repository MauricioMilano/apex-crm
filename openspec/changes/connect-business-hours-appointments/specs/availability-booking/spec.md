## ADDED Requirements

### Requirement: Aggregated availability API
The system SHALL provide a server action that returns available time slots for a given service and date, aggregated across all eligible employees. The response SHALL include which employees are available at each slot.

#### Scenario: Get available slots for a date
- **WHEN** a user selects a service and date in the booking flow
- **THEN** the system calls `getAggregatedAvailability(serviceId, date)`
- **AND** returns a list of available time slots with their covering employees
- **AND** slots consider: employee working hours (with org fallback), employee blocked slots, existing non-cancelled appointments, and service-employee matching via `EmployeeService`

#### Scenario: No employees available on a date
- **WHEN** no employee is available on a given date (all off, all booked, or no matching employees)
- **THEN** the response indicates `dayCoverage: false`
- **AND** the frontend disables that date in the calendar and shows "No employees available"

#### Scenario: Service-employee matching
- **WHEN** computing availability for a service
- **THEN** only employees linked to that service via `EmployeeService` are considered
- **AND** if no employees offer the service, the response is empty

### Requirement: Booking flow uses real availability
The BookingFlow component SHALL use the aggregated availability API instead of hardcoded time slots. Days with no coverage SHALL be disabled in the calendar. Available slots SHALL be fetched from the server on date selection.

#### Scenario: Calendar disables days without coverage
- **WHEN** the booking flow calendar renders
- **THEN** dates with zero employee coverage are disabled (grayed out, not clickable)
- **AND** a tooltip or helper text explains why

#### Scenario: Slots fetched on date selection
- **WHEN** a user selects a date in the booking flow
- **THEN** the system fetches availability for that date
- **AND** shows loading state while fetching
- **AND** displays only server-returned available slots

#### Scenario: Slot shows which employees are available
- **WHEN** a specific employee is selected in step 2
- **THEN** slots show only if that employee is available at that time
- **AND** slots are disabled otherwise

### Requirement: Auto-allocation for "Any Available"
When the user selects "Any Available" in step 2 and confirms a time in step 3, the system SHALL automatically assign the most suitable employee.

#### Scenario: Auto-allocate on confirm
- **WHEN** "Any Available" is selected and user confirms a time slot
- **THEN** the system calls `autoAllocateEmployee(serviceId, date, time)`
- **AND** allocates the employee with the fewest appointments on that day (least-busy)
- **AND** creates the appointment with that employee assigned

#### Scenario: Auto-allocation handles simultaneous requests
- **WHEN** two users book the same slot simultaneously with "Any Available"
- **THEN** the first confirmed booking locks the employee
- **AND** the second booking re-runs allocation and may get a different employee or fail if no one remains

### Requirement: Calendar grid respects working hours
The CalendarGrid component SHALL visually respect working hours. Non-working hours SHALL be grayed out or hidden. Days where no employee is available SHALL show "Closed".

#### Scenario: Non-working hours are dimmed
- **WHEN** the calendar grid renders in week view
- **THEN** hour slots outside the computed working range are visually distinct (dimmed/grayed)
- **AND** cannot be clicked to create appointments

#### Scenario: Day with no coverage shows Closed
- **WHEN** a day has zero available employees (all off, all booked)
- **THEN** the day column header shows "Closed"
- **AND** the day column is visually distinct

### Requirement: Reschedule uses real availability
The appointment detail page's reschedule functionality SHALL use the same availability API instead of hardcoded time slots.

#### Scenario: Reschedule shows real slots
- **WHEN** a user opens the reschedule picker on the appointment detail page
- **THEN** available slots are fetched via the availability API
- **AND** only the same employee (if specified) is considered for slot availability
- **AND** days with no coverage are disabled
