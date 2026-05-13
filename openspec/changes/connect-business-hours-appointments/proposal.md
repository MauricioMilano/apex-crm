## Why

The appointment booking system and business hours are disconnected. Employee working hours are edited in the UI but never persisted to the backend (stored only in localStorage). The booking flow uses hardcoded time slots (09:00-17:00) instead of real availability data, the calendar grid shows fixed 8AM-8PM regardless of schedule, and there's no concept of organization-wide default business hours. This makes the scheduling system unreliable and forces manual workarounds.

## What Changes

- **Add organization-level default working hours** to `OrganizationSetting`, used as fallback when an employee has no custom hours configured
- **Persist employee working hours** to `EmployeeProfile.workingHours` via a real server action (remove localStorage hack)
- **Create aggregated availability system** that considers org defaults, employee overrides, blocked slots, existing appointments, and service-employee matching
- **Fix BookingFlow** to use real availability API: disable days with no coverage, show only genuinely available slots
- **Fix CalendarGrid** to respect working hours (gray out non-working hours, show "Closed" on closed days)
- **Implement auto-allocation** when "Any Available" is selected: system picks the best employee (least-busy heuristic)
- **Fix reschedule on detail page** to also use real availability instead of hardcoded slots

## Capabilities

### New Capabilities
- `organization-business-hours`: Default working hours at the organizational level, with per-employee override capability. Includes persistence, fallback chain, and admin UI.
- `availability-booking`: Real-time availability computation that aggregates across employees, respects all constraints (hours, blocked slots, appointments, service matching), and powers both the dashboard booking flow and calendar views. Includes auto-allocation logic.

### Modified Capabilities
*(none — no existing specs to modify)*

## Impact

- **DB**: New JSON field `defaultWorkingHours` on `OrganizationSetting` (existing model)
- **Backend**: New server actions (`updateWorkingHours`, `getAggregatedAvailability`, `autoAllocateEmployee`); updated `getAvailableSlots` to use org fallback
- **Frontend**: `BookingFlow` step 3 rewritten; `CalendarGrid` updated; `settings/team` working hours editor now calls backend; detail page reschedule updated
- **No breaking schema changes** — `EmployeeProfile.workingHours` already exists; `OrganizationSetting` already exists; only adding a JSON field
