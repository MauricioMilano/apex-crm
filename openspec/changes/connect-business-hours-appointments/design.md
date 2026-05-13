## Context

Currently, business hours exist only as a JSON field on `EmployeeProfile` but are edited via localStorage in the Team Settings page — they never reach the backend. The booking flow (`BookingFlow.tsx`) uses hardcoded `TIME_SLOTS = ["09:00"... "17:00"]` and checks conflicts against local context data rather than querying real availability. The calendar grid (`CalendarGrid.tsx`) hardcodes 8AM-8PM. There is no organization-level default schedule, no aggregation across employees, and the "Any Available" option is non-functional.

The organization has ~3 models with temporal data: `EmployeeProfile` (workingHours JSON), `BlockedSlot` (per-employee time-offs), and `Appointment` (booked time). The `OrganizationSetting` model already exists but has no hours field.

## Goals / Non-Goals

**Goals:**
- Add organization-level default working hours as a fallback chain
- Persist employee working hours to backend via server action
- Provide an aggregated availability API that returns which employees are available at which slots for a given service+date
- Auto-allocate the best employee when "Any Available" is selected
- Fix BookingFlow step 3: disable days with no coverage, show real available slots
- Fix CalendarGrid: respect working hours visually
- Fix appointment detail reschedule to use real availability

**Non-Goals:**
- Client self-service portal (separate change)
- Published "availability blocks" for public booking (separate change)
- Recurring availability patterns
- Real-time presence/status
- Location-level business hours (org-level is sufficient for now)
- Mobile-specific UI optimizations

## Decisions

### D1: Fallback chain for working hours
- **Decision**: Employee hours → Org default hours → Closed (all days off)
- **Rationale**: The employee is the most specific context. If they have custom hours, use them. If not, fall back to org default. If no org default is set, treat as closed. This matches the typical small business pattern where most employees share the same schedule.
- **Alternative considered**: Location-level hours as middle layer. Rejected because most organizations have a single location or all locations share the same hours.

### D2: Org default hours stored as JSON on OrganizationSetting
- **Decision**: Add `defaultWorkingHours Json @default("{}")` to `OrganizationSetting`
- **Rationale**: Uses the same JSON structure as `EmployeeProfile.workingHours`, keeping the data model consistent. The `normalizeWorkingHours()` function already handles empty JSON gracefully.
- **Alternative considered**: Separate table `OrganizationBusinessHours` with one row per day. Rejected — over-normalization for 7 rows of fixed data.

### D3: Aggregated availability as a single server action
- **Decision**: `getAggregatedAvailability(serviceId, date, locationId?) → { slots: Record<string, { time: string, employees: Array<{id, name}> }>, dayCoverage: boolean }`
- **Rationale**: Single round-trip for the booking UI. Returns both which slots are available and which employees can cover each slot. The frontend can then render the calendar and handle "Any Available" auto-allocation on confirm.
- **Alternative considered**: Separate endpoints for coverage vs slots. More RESTful but requires multiple calls.

### D4: Auto-allocation uses least-busy heuristic
- **Decision**: When "Any Available" is selected and a time+service is chosen, allocate to the employee who (1) is available at that time, (2) offers the selected service, and (3) has the fewest appointments on that day.
- **Rationale**: Simple, fair, and predictable. No complex routing or optimization needed.
- **Alternative considered**: Round-robin. Simpler but doesn't balance workload.

### D5: BookingFlow fetches availability on date change
- **Decision**: When the user selects a date in step 3, call `getAggregatedAvailability`. If the response shows zero coverage for that date, disable all time slots and show "No employees available this day." Disable the date in the calendar if `dayCoverage` is false.
- **Rationale**: Real-time check ensures accuracy. The calendar's `disabled` prop from `react-day-picker` supports function-based disabling, so we can disable individual dates based on coverage.

### D6: CalendarGrid reads availability per day
- **Decision**: CalendarGrid will fetch aggregated availability for each visible week. Hour columns dynamically show/hide based on the computed working range. Days with zero coverage show "Closed" overlay instead of empty grid.
- **Rationale**: Avoids showing misleading empty time slots.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Performance: fetching availability per date could be slow if many employees | Add a single bulk query that fetches all needed data (employees, profiles, appointments) for a date range in one go, then compute in-memory |
| Employee working hours not migrated (currently in localStorage) | No migration needed — localStorage data is per-user and was never authoritative. Treat the current state as "no hours configured" (falls back to org default). |
| Auto-allocation might pick a suboptimal employee | The least-busy heuristic is transparent and fair. Future enhancement could add location distance or skill matching. |
| BookingFlow changes affect both dashboard and calendar entry points | Both pass through the same `BookingFlow` component. Changes to step 3 apply uniformly. |
